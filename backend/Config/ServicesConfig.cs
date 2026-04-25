using Backend.App.Auth;
using Backend.App.Polizas;
using Backend.App.Renovaciones;
using Backend.Data.Repository;
using Backend.Domain.Models;
using Backend.Domain.Services;

namespace Backend.Config;

public static class ServicesConfig
{
    public static IServiceCollection AddAppServices(this IServiceCollection services, IConfiguration configuration)
    {
        var domain = configuration.GetValue<string>("Frontend:Url")!;
        services.AddScoped<LoginService>();
        services.AddScoped<MeService>();
        services.AddScoped<UserService>();
        services.AddScoped<ChangePasswordService>();
        services.AddScoped<PasswordResetService>(sp =>
        {
            return new PasswordResetService(
                sp.GetRequiredService<IRepository<User, Guid>>(),
                sp.GetRequiredService<IRepository<PasswordReset, Guid>>(),
                sp.GetRequiredService<INotifier>(),
                domain
            );
        });
        services.AddScoped<EmpresasService>();
        services.AddScoped<RamoService>();
        services.AddScoped<PolizaService>();
        services.AddScoped<PolizaExcelImportService>();
        services.AddScoped<PolizaPdfService>();
        services.AddScoped<CreateRenovacionService>();
        services.AddScoped<ExpireRenovationService>();
        services.AddScoped<RenovacionService>();
        services.AddScoped<ValidateRenovacionService>();
        return services;
    }
}