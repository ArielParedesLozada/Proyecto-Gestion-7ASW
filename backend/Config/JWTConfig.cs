using Backend.Infrastructure.Security;
using Microsoft.IdentityModel.Tokens;

namespace Backend.Config;

public static class JWTConfig
{
    public static IServiceCollection AddJWTConfig(this IServiceCollection services, string issuer, string audience, string publicKeyFile)
    {
        services.AddAuthentication("Bearer")
            .AddJwtBearer(options =>
            {
                // Conservar nombres de claims del JWT (p. ej. must_change_password) para las políticas.
                options.MapInboundClaims = false;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = issuer,
                    ValidAudience = audience,
                    IssuerSigningKey = new RsaSecurityKey(KeyLoader.LoadRsaKey(publicKeyFile))
                };
            });
        services.AddAuthorizationBuilder()
            .AddPolicy("ACCESS-GRANTED", policy =>
                policy.RequireAssertion(context =>
                {
                    var claim = context.User.FindFirst("must_change_password");
                    return claim?.Value?.ToLower() == "false";
                }))
            .AddPolicy("MUST-CHANGE-PASSWORD", policy =>
                policy.RequireAssertion(context =>
                {
                    var claim = context.User.FindFirst("must_change_password");
                    return claim?.Value?.ToLower() == "true";
                }))
            .AddPolicy("ADMIN-ACCESS", policy =>
                policy.RequireAssertion(context =>
                {
                    var claim = context.User.FindFirst("must_change_password");
                    return claim?.Value?.ToLower() == "false" && context.User.IsInRole("ADMIN");
                }));

        services.AddAuthorization();
        return services;
    }
}