using Backend.Data.Databases;
using Backend.Data.Repository;
using Backend.Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Config;

public static class DatabaseConfig
{
    public static IServiceCollection AddDatabase(this IServiceCollection services, string connectionString)
    {
        services.AddDbContext<AppDatabase>(options =>
            options.UseNpgsql(connectionString)
        );

        services.AddScoped<IRepository<User, Guid>, Repository<User, Guid>>();
        services.AddScoped<IRepository<PasswordReset, Guid>, Repository<PasswordReset, Guid>>();
        return services;
    }
}