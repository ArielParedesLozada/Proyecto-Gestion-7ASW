// NotificacionIntegrationTests.cs
using System.Net.Http.Json;
using Backend.Presentation.Dtos.Requests;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Backend.Data.Databases;
using Backend.Domain.Models;
using Backend.Domain.Enums;
using test_integracion;
using Xunit;
using Microsoft.EntityFrameworkCore;

namespace test_integracion;

public class NotificacionIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public NotificacionIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task PolizaCreation_ShouldTriggerAutomaticEmail()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDatabase>();

        var aseguradora = new Aseguradora { Id = Guid.NewGuid(), Nombre = "Test Aseguradora" };
        var empresa = new Empresa { Id = Guid.NewGuid(), Nombre = "Test Empresa" };
        var ramo = new Ramo { Id = Guid.NewGuid(), Nombre = "Test Ramo", CambiaValor = true, Descripcion = "Test" };
        var user = new User("testuser", BCrypt.Net.BCrypt.HashPassword("Password123!"), "Admin", "test@test.com")
        {
            Id = Guid.NewGuid(),
            MustChangePassword = false
        };

        db.Aseguradoras.Add(aseguradora);
        db.Empresas.Add(empresa);
        db.Ramos.Add(ramo);
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var request = new PolizaRequest
        {
            Numero = "POL-MAIL-1",
            Obra = "Obra",
            AseguradoraId = aseguradora.Id,
            Contratista = empresa.Id,
            Ramo = ramo.Id,
            ValorOriginal = 1000,
            ValorActual = 1000,
            FechaEmision = DateTimeOffset.UtcNow,
            FechaExpiracion = DateTimeOffset.UtcNow.AddYears(1),
            Observaciones = ""
        };

        // Act
        var response = await _client.PostAsJsonAsync("/polizas", request);

        // Assert
        response.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task Renovacion_ShouldSendSingleNotification_ToPolicyCreator()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDatabase>();

        var aseguradora = new Aseguradora { Id = Guid.NewGuid(), Nombre = "Test Aseguradora" };
        var empresa = new Empresa { Id = Guid.NewGuid(), Nombre = "Test Empresa" };
        var ramo = new Ramo { Id = Guid.NewGuid(), Nombre = "Test Ramo", CambiaValor = true, Descripcion = "Test" };
        var user = new User("testuser", BCrypt.Net.BCrypt.HashPassword("Password123!"), "Admin", "test@test.com")
        {
            Id = Guid.NewGuid(),
            MustChangePassword = false
        };

        await db.Aseguradoras.AddAsync(aseguradora);
        await db.Empresas.AddAsync(empresa);
        await db.Ramos.AddAsync(ramo);
        await db.Users.AddAsync(user);
        await db.SaveChangesAsync();

        var poliza = new Poliza
        {
            Id = Guid.NewGuid(),
            Numero = "POL-RENOV",
            Obra = "Obra",
            AseguradoraId = aseguradora.Id,
            Contratista = empresa.Id,
            Ramo = ramo.Id,
            ValorOriginal = 1000,
            ValorActual = 1000,
            FechaEmision = DateTimeOffset.UtcNow.AddMonths(-1),
            FechaExpiracion = DateTimeOffset.UtcNow.AddDays(2),
            Estado = EstadoPoliza.PorVencer,
            UsuarioId = user.Id,
            PeriodicidadRenovacion = TimeSpan.FromDays(30),
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
        await db.Polizas.AddAsync(poliza);
        await db.SaveChangesAsync();

        // Act
        var job = new Backend.Infrastructure.Jobs.SendNotificationsJob(
            scope.ServiceProvider.GetRequiredService<Backend.App.Notificaciones.PolizaNotificationService>());
        await job.NotifyPeople();

        // Assert
        var notificaciones = await db.Notificaciones
            .Where(n => n.PolizaId == poliza.Id)
            .ToListAsync();

        notificaciones.Should().NotBeEmpty();
    }
}