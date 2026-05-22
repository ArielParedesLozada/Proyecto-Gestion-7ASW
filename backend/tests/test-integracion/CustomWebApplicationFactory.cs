using Backend.Data.Databases;
using Backend.Infrastructure.Jobs;
using Hangfire;
using Hangfire.MemoryStorage;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Xunit;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using Backend.Domain.Services;
using Moq;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.Security.Claims;
using System.Text.Encodings.Web;

namespace test_integracion;

[CollectionDefinition("IntegrationTests")]
public class IntegrationTestCollection : ICollectionFixture<CustomWebApplicationFactory>;

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
            new Claim(ClaimTypes.Name, "testuser"),
            new Claim(ClaimTypes.NameIdentifier, CustomWebApplicationFactory.TestUserId.ToString()),
            new Claim("must_change_password", "false"),
        };

        var identity = new ClaimsIdentity(claims, "TestScheme");
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, "TestScheme");

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    public static readonly Guid TestUserId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

    public Mock<INotifier> NotifierMock { get; } = new();

    private static bool _dbInitialized;
    private static readonly object DbInitLock = new();

    public static async Task EnsureTestUserAsync(AppDatabase db)
    {
        if (await db.Users.AnyAsync(u => u.Id == TestUserId))
            return;

        db.Users.Add(new Backend.Domain.Models.User(
            "testuser",
            BCrypt.Net.BCrypt.HashPassword("Password123!"),
            "Admin",
            "test@test.com")
        {
            Id = TestUserId,
            MustChangePassword = false
        });

        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException)
        {
            db.ChangeTracker.Clear();
        }
    }

    protected override IHost CreateHost(IHostBuilder builder)
    {
        var host = base.CreateHost(builder);

        lock (DbInitLock)
        {
            if (_dbInitialized)
                return host;

            using var scope = host.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDatabase>();
            db.Database.EnsureCreated();
            _dbInitialized = true;
        }

        return host;
    }

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
            // EF IN-MEMORY (misma estrategia que tests unitarios)
            // =========================
            services.AddDbContext<AppDatabase>(options =>
            {
                options.UseInMemoryDatabase("IntegrationTestsDb");
                options.ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning));
            });

            // =========================
            // MOCK NOTIFIER
            // =========================
            services.RemoveAll(typeof(INotifier));
            services.AddSingleton(NotifierMock.Object);

            // =========================
            // HANGFIRE (Program omite AddHangFire en Testing, pero UseHangfireDashboard sí corre)
            // =========================
            services.AddHangfire(config => config.UseMemoryStorage());
            services.AddHangfireServer();
            services.AddScoped<CheckRenovacionesJob>();
            services.AddScoped<SendNotificationsJob>();

            // =========================
            // TEST AUTH
            // =========================
            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = "TestScheme";
                options.DefaultChallengeScheme = "TestScheme";
            })
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
        });
    }
}