using Backend.Infrastructure.Jobs;
using Hangfire;
using Hangfire.PostgreSql;

namespace Backend.Config;

public static class HangfireConfig
{
    public static IServiceCollection AddHangFire(this IServiceCollection services, string connectionString)
    {
        services.AddHangfire(config =>
            config.UsePostgreSqlStorage(options =>
                options.UseNpgsqlConnection(connectionString)
            )
        );
        services.AddHangfireServer();
        services.AddScoped<PolizaExpirationJob>();
        return services;
    }
}