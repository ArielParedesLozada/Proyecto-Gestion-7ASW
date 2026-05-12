using Backend.App.Auditorias;
using Backend.App.Auth;
using Backend.App.Notificaciones;
using Backend.App.Polizas;
using Backend.App.Renovaciones;
using Backend.App.Reportes;
using Backend.Data.Databases;
using Backend.Data.Repository;
using Backend.Domain.Models;
using Backend.Domain.Services;
using Backend.Infrastructure.Http;

namespace Backend.Config;

public static class ServicesConfig
{
    public static IServiceCollection AddAppServices(this IServiceCollection services, IConfiguration configuration)
    {
        var domain = configuration.GetValue<string>("Frontend:Url")!;
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUser>(sp =>
        {
            var httpContext = sp.GetRequiredService<IHttpContextAccessor>().HttpContext;
            return new CurrentUser(httpContext.User);
        });
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
        services.AddScoped<AseguradorasService>();
        services.AddScoped<PolizaService>();
        services.AddScoped<PolizaExcelImportService>();
        services.AddScoped<PolizaPdfService>();
        services.AddScoped<CreateRenovacionService>();
        services.AddScoped<ExpireRenovationService>();
        services.AddScoped<RenovacionService>();
        services.AddScoped<ValidateRenovacionService>();
        services.AddScoped<PolizaNotificationService>(sp =>
        {
            return new PolizaNotificationService(
               sp.GetRequiredService<IWordTemplate>(),
               sp.GetRequiredService<INotifier>(),
               sp.GetRequiredService<AppDatabase>(),
               domain,
               sp.GetRequiredService<ILogger<PolizaNotificationService>>()
           );
        });
        services.AddScoped<AuditoriaService>();
        services.AddScoped<AuditoriaQueryService>();
        services.AddScoped<NotificacionService>();
        services.AddScoped<ControlMaestroService>();
        return services;
    }
}