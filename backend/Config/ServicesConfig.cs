using Backend.App.Auth;

namespace Backend.Config;

public static class ServicesConfig
{
    public static IServiceCollection AddAppServices(this IServiceCollection services)
    {
        services.AddScoped<LoginService>();
        services.AddScoped<MeService>();
        services.AddScoped<UserService>();
        services.AddScoped<ChangePasswordService>();
        return services;
    }
}