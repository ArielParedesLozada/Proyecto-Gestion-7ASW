//
using Backend.Config;
using Backend.Data.Databases;
using Backend.Data.Seed;
using Backend.Domain.Services;
using Backend.Infrastructure.Security;
using Backend.Presentation.Middleware;
using DotNetEnv;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;

Env.Load();

var builder = WebApplication.CreateBuilder(args);
var CONNECTION_STRING = Environment.GetEnvironmentVariable("CONNECTION_STRING")!;
var JWT_ISSUER = Environment.GetEnvironmentVariable("JWT_ISSUER")!;
var JWT_AUDIENCE = Environment.GetEnvironmentVariable("JWT_AUDIENCE")!;
var JWT_PUBLIC_KEY_FILE = Environment.GetEnvironmentVariable("JWT_PUBLIC_KEY_FILE")!;
var JWT_PRIVATE_KEY_FILE = Environment.GetEnvironmentVariable("JWT_PRIVATE_KEY_FILE")!;
var JWT_TIME = double.Parse(Environment.GetEnvironmentVariable("JWT_TIME") ?? "1");
var ADMIN_PASSWORD = Environment.GetEnvironmentVariable("ADMIN_PASSWORD") ?? "";
var MAIL_USER = Environment.GetEnvironmentVariable("MAIL_USER")!;
var MAIL_PSSWD = Environment.GetEnvironmentVariable("MAIL_PASSWORD")!;
// Add services to the container.
builder.Services
    .AddSwaggerDoc()
    .AddDatabase(CONNECTION_STRING)
    .AddJWTConfig(JWT_ISSUER, JWT_AUDIENCE, JWT_PUBLIC_KEY_FILE)
    .AddMailer(builder.Configuration, MAIL_USER, MAIL_PSSWD)
    .AddAppServices(builder.Configuration); ;
builder.Services.AddMemoryCache();
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(o =>
{
    o.MultipartBodyLengthLimit = 25_000_000;
});
builder.Services.AddScoped<ITokenGenerator>(sp =>
    new JwtTokenGenerator(JWT_PRIVATE_KEY_FILE, JWT_TIME, JWT_ISSUER, JWT_AUDIENCE)
);
builder.Services.AddControllers().AddJsonOptions(o =>
{
    o.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDatabase>();
    await db.Database.MigrateAsync();
    await UserSeeder.SeedAsync(db, ADMIN_PASSWORD);
    // Usuarios creados antes con MustChangePassword=true quedan bloqueados por la política ACCESS-GRANTED.
    await db.Database.ExecuteSqlRawAsync(
        """UPDATE "users" SET "MustChangePassword" = false WHERE "Username" = 'adminpapu' AND "MustChangePassword" = true;""");
}
// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
