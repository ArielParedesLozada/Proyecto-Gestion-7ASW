using Backend.Domain.Services;
using Backend.Infrastructure.Mail;

namespace Backend.Config;

public static class MailConfig
{
    public static IServiceCollection AddMailer(this IServiceCollection services, IConfiguration configuration, string user, string password)
    {
        var domain = configuration.GetValue<string>("MailSettings:Domain")!;
        var port = configuration.GetValue<int>("MailSettings:Port")!;
        services.AddScoped<INotifier>(sp => new EmailNotifier(domain, port, user, password));
        return services;
    }
}