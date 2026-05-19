// PolizaIntegrationTests.cs
using System.Net.Http.Json;
using Backend.Presentation.Dtos.Requests;
using Backend.Presentation.Dtos.Responses;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Backend.Data.Databases;
using Backend.Domain.Models;
using Backend.Domain.Enums;
using test_integracion;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace test_integracion;

public class PolizaIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public PolizaIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CreatePoliza_ShouldReturnSuccess_WhenDataIsValid()
    {
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDatabase>();

        var aseguradora = new Aseguradora
        {
            Id = Guid.NewGuid(),
            Nombre = "Test Aseguradora"
        };

        var empresa = new Empresa
        {
            Id = Guid.NewGuid(),
            Nombre = "Test Empresa"
        };

        var ramo = new Ramo
        {
            Id = Guid.NewGuid(),
            Nombre = "Test Ramo",
            CambiaValor = true,
            Descripcion = "Test"
        };

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
            Numero = "POL-12345",
            Obra = "Obra Test",
            AseguradoraId = aseguradora.Id,
            Contratista = empresa.Id,
            Ramo = ramo.Id,
            ValorOriginal = 1000,
            ValorActual = 1000,
            FechaEmision = DateTimeOffset.UtcNow,
            FechaExpiracion = DateTimeOffset.UtcNow.AddYears(1),
            Observaciones = "Test obs"
        };

        var response = await _client.PostAsJsonAsync("/polizas", request);

        response.EnsureSuccessStatusCode();

        var result = await response.Content.ReadFromJsonAsync<PolizaDtoResponse>();

        result.Should().NotBeNull();
        result!.Numero.Should().Be("POL-12345");
    }

    [Fact]
    public async Task PolizaCronJob_ShouldChangeStatusToExpired_WhenDatePassed()
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
            Numero = "POL-EXPIRED",
            Obra = "Obra",
            AseguradoraId = aseguradora.Id,
            Contratista = empresa.Id,
            Ramo = ramo.Id,
            PeriodicidadRenovacion = TimeSpan.FromDays(365),
            ValorOriginal = 1000,
            ValorActual = 1000,
            FechaEmision = DateTimeOffset.UtcNow.AddYears(-2),
            FechaExpiracion = DateTimeOffset.UtcNow.AddDays(-1),
            Estado = EstadoPoliza.Vigente,
            UsuarioId = user.Id,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
        await db.Polizas.AddAsync(poliza);
        await db.SaveChangesAsync();

        // Act
        var job = new Backend.Infrastructure.Jobs.CheckRenovacionesJob(
            scope.ServiceProvider.GetRequiredService<Backend.App.Renovaciones.CreateRenovacionService>(),
            scope.ServiceProvider.GetRequiredService<Backend.App.Renovaciones.ExpireRenovationService>());
        await job.CheckRenovaciones();

        // Assert
        var updatedPoliza = await db.Polizas.FindAsync(poliza.Id);
        updatedPoliza.Should().NotBeNull();
        updatedPoliza!.Estado.Should().Be(EstadoPoliza.Vencida);
    }
}