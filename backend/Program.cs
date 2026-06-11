using Backend.Config;
using Backend.Data.Databases;
using Backend.Data.Seed;
using Backend.Domain.Services;
using Backend.Infrastructure.Security;
using Backend.Presentation.Middleware;
using DotNetEnv;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Hangfire;
using Backend.Infrastructure.Jobs;
using Serilog;
using Microsoft.AspNetCore.HttpOverrides;  // ← Agrega esta línea

Env.Load();

// ============================================================
// 1. CONFIGURAR SERILOG ANTES DE CONSTRUIR LA APLICACIÓN
// ============================================================
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Debug()                    // Nivel mínimo: captura casi todo
    .MinimumLevel.Override("Microsoft", Serilog.Events.LogEventLevel.Warning)  // Reduce ruido de Microsoft
    .MinimumLevel.Override("Microsoft.Hosting.Lifetime", Serilog.Events.LogEventLevel.Information)
    .MinimumLevel.Override("Hangfire", Serilog.Events.LogEventLevel.Warning)   // Reduce ruido de Hangfire
    .Enrich.FromLogContext()                 // Agrega contexto adicional
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
    .WriteTo.File(
        "logs/log-.txt",                     // Ruta y patrón del archivo
        rollingInterval: RollingInterval.Day, // Crea un archivo por día
        outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj}{NewLine}{Exception}",
        retainedFileCountLimit: 30            // Mantiene 30 días de logs
    )
    .CreateLogger();

try
{
    Log.Information("🚀 Iniciando la aplicación");

    var builder = WebApplication.CreateBuilder(args);

    // ============================================================
    // 2. REEMPLAZAR EL LOGGER POR DEFECTO CON SERILOG
    // ============================================================
    builder.Host.UseSerilog();  // ← Esta línea es CRÍTICA

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
        .AddDocs(builder.Configuration)
        .AddAppServices(builder.Configuration);
    if (!builder.Environment.IsEnvironment("Testing"))
    {
        builder.Services.AddHangFire(CONNECTION_STRING);
    }
    builder.Services.Configure<ForwardedHeadersOptions>(options =>
    {
        options.ForwardedHeaders = ForwardedHeaders.All;
    });
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

    // ============================================================
    // 3. AGREGAR MIDDLEWARE PARA LOG DE REQUESTS HTTP
    // ============================================================
    if (!app.Environment.IsEnvironment("Testing"))
    {
        using (var scope = app.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDatabase>();
            Log.Information("Ejecutando migraciones de base de datos...");
            await db.Database.MigrateAsync();
            Log.Information("Migraciones completadas");

            Log.Information("Ejecutando seed de usuarios...");
            await UserSeeder.SeedAsync(db, ADMIN_PASSWORD);
            Log.Information("Seed completado");

            await db.Database.ExecuteSqlRawAsync(
                """UPDATE "users" SET "MustChangePassword" = false WHERE "Username" = 'adminpapu' AND "MustChangePassword" = true;""");
        }
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

    app.UseHangfireDashboard("/hangfire");

    if (!app.Environment.IsEnvironment("Testing"))
    {
        var timeZoneOptions = new RecurringJobOptions
        {
            TimeZone = TimeZoneInfo.FindSystemTimeZoneById("America/Guayaquil")
        };
        RecurringJob.AddOrUpdate<CheckRenovacionesJob>(
            "revision-polizas-diaria",
            x => x.CheckRenovaciones(),
            Cron.Daily(10),
            timeZoneOptions
        );

        RecurringJob.AddOrUpdate<SendNotificationsJob>(
            "revision-notificaciones-diaria",
            x => x.NotifyPeople(),
            Cron.Daily(10),
            timeZoneOptions
        );
    }

    app.UseForwardedHeaders();
    app.MapControllers();

    Log.Information("Aplicación configurada correctamente, iniciando ejecución...");
    app.Run();
}
catch (HostAbortedException)
{
    // dotnet ef (design-time) aborta el host tras resolver DbContext; no es un fallo real.
    throw;
}
catch (Exception ex)
{
    Log.Fatal(ex, "💥 La aplicación falló al iniciar");
    throw;
}
finally
{
    Log.Information("🛑 Aplicación cerrada");
    Log.CloseAndFlush();  // Importante: asegura que todos los logs se escriban
}

public partial class Program { }