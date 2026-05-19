using Backend.Data.Databases;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Backend.Domain.Services;
using Moq;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Security.Claims;
using System.Text.Encodings.Web;

namespace test_integracion;

public class TestAuthHandler : AuthenticationHandler<AuthenticationSchemeOptions>
{
    public TestAuthHandler(
        IOptionsMonitor<AuthenticationSchemeOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder)
        : base(options, logger, encoder)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.Name, "Test user"),
            new Claim(ClaimTypes.NameIdentifier, Guid.NewGuid().ToString())
        };

        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, "TestScheme");

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    public Mock<INotifier> NotifierMock { get; } = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // =========================
        // ENV PARA TESTS
        // =========================
        Environment.SetEnvironmentVariable("CONNECTION_STRING", "Host=localhost;Database=test;Username=test;Password=test");
        Environment.SetEnvironmentVariable("JWT_ISSUER", "TestIssuer");
        Environment.SetEnvironmentVariable("JWT_AUDIENCE", "TestAudience");
        Environment.SetEnvironmentVariable("JWT_PUBLIC_KEY_FILE", "dummy");
        Environment.SetEnvironmentVariable("JWT_PRIVATE_KEY_FILE", "dummy");
        Environment.SetEnvironmentVariable("JWT_TIME", "1");
        Environment.SetEnvironmentVariable("MAIL_USER", "test@test.com");
        Environment.SetEnvironmentVariable("MAIL_PASSWORD", "password");

        builder.UseEnvironment("Testing");

        builder.ConfigureServices(services =>
        {
            // =========================
            // REMOVE DB ORIGINAL
            // =========================
            services.RemoveAll(typeof(DbContextOptions<AppDatabase>));
            services.RemoveAll(typeof(AppDatabase));

            // =========================
            // SQLITE IN-MEMORY (CRÍTICO)
            // =========================
            services.AddDbContext<AppDatabase>(options =>
            {
                options.UseSqlite("Data Source=:memory:");
            });

            // =========================
            // MOCK NOTIFIER
            // =========================
            services.RemoveAll(typeof(INotifier));
            services.AddSingleton(NotifierMock.Object);

            // =========================
            // TEST AUTH
            // =========================
            services.AddAuthentication("TestScheme")
                .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(
                    "TestScheme", options => { });

            services.AddAuthorization(options =>
            {
                options.DefaultPolicy =
                    new Microsoft.AspNetCore.Authorization.AuthorizationPolicyBuilder("TestScheme")
                        .RequireAuthenticatedUser()
                        .Build();

                options.AddPolicy("ACCESS-GRANTED", policy =>
                {
                    policy.RequireAuthenticatedUser();
                    policy.AddAuthenticationSchemes("TestScheme");
                });
            });

            // =========================
            // BUILD SERVICE PROVIDER
            // =========================
            var sp = services.BuildServiceProvider();

            using var scope = sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDatabase>();

            // =========================
            // SQLITE MEMORY FIX (OBLIGATORIO)
            // =========================
            db.Database.OpenConnection();
            db.Database.EnsureCreated();
        });
    }
}