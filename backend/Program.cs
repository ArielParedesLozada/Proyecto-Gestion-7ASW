//
using Backend.Config;
using Backend.Data.Databases;
using Backend.Data.Seed;
using Backend.Domain.Services;
using Backend.Infrastructure.Security;
using DotNetEnv;
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
// Add services to the container.
builder.Services
    .AddSwaggerDoc()
    .AddDatabase(CONNECTION_STRING)
    .AddJWTConfig(JWT_ISSUER, JWT_AUDIENCE, JWT_PUBLIC_KEY_FILE)
    .AddAppServices(); ;
builder.Services.AddScoped<ITokenGenerator>(sp =>
    new JwtTokenGenerator(JWT_PRIVATE_KEY_FILE, JWT_TIME, JWT_ISSUER, JWT_AUDIENCE)
);
builder.Services.AddControllers();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDatabase>();
    await db.Database.MigrateAsync();
    await UserSeeder.SeedAsync(db, ADMIN_PASSWORD);
}
// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();