using System.Security.Claims;
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
                    IssuerSigningKey = new RsaSecurityKey(KeyLoader.LoadRsaKey(publicKeyFile)),
                    // El token emite ClaimTypes.Name; sin esto, User.Identity.Name queda vacío y endpoints devuelven 401.
                    NameClaimType = ClaimTypes.Name,
                    RoleClaimType = ClaimTypes.Role,
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
                    var must = context.User.FindFirst("must_change_password")?.Value?.ToLower();
                    if (must != "false")
                    {
                        return false;
                    }

                    // Con MapInboundClaims = false, el JWT puede traer el rol como "role" (compacto) y no
                    // coincidir con ClaimTypes.Role; IsInRole("ADMIN") fallaría aunque el usuario sea ADMIN.
                    var role =
                        context.User.FindFirst("role")?.Value
                        ?? context.User.FindFirst(ClaimTypes.Role)?.Value;
                    var isAdmin =
                        context.User.IsInRole("ADMIN")
                        || string.Equals(role, "ADMIN", StringComparison.OrdinalIgnoreCase);
                    return isAdmin;
                }));

        services.AddAuthorization();
        return services;
    }
}