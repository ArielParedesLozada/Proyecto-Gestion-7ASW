// ReportesIntegrationTests.cs
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Backend.Data.Databases;
using Backend.Domain.Models;
using Backend.Domain.Enums;
using test_integracion;
using Xunit;

namespace test_integracion;

[Collection("IntegrationTests")]
public class ReportesIntegrationTests
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public ReportesIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GenerateControlMaestro_ShouldReturnReportData()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDatabase>();

        var aseguradora = new Aseguradora { Id = Guid.NewGuid(), Nombre = "Test Aseguradora" };
        var empresa = new Empresa { Id = Guid.NewGuid(), Nombre = "Test Empresa" };
        var ramo = new Ramo { Id = Guid.NewGuid(), Nombre = "Test Ramo", CambiaValor = true, Descripcion = "Test" };
        await CustomWebApplicationFactory.EnsureTestUserAsync(db);

        await db.Aseguradoras.AddAsync(aseguradora);
        await db.Empresas.AddAsync(empresa);
        await db.Ramos.AddAsync(ramo);
        await db.SaveChangesAsync();

        var poliza = new Poliza
        {
            Id = Guid.NewGuid(),
            Numero = "POL-REP-1",
            Obra = "Obra",
            AseguradoraId = aseguradora.Id,
            Contratista = empresa.Id,
            Ramo = ramo.Id,
            Estado = EstadoPoliza.Vigente,
            UsuarioId = CustomWebApplicationFactory.TestUserId,
            ValorOriginal = 1000,
            ValorActual = 1000,
            FechaEmision = DateTimeOffset.UtcNow,
            FechaExpiracion = DateTimeOffset.UtcNow.AddYears(1),
            PeriodicidadRenovacion = TimeSpan.FromDays(365),
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
        await db.Polizas.AddAsync(poliza);
        await db.SaveChangesAsync();

        // Act
        var response = await _client.GetAsync("/reportes/control-maestro");

        // Assert
        response.EnsureSuccessStatusCode();
        var content = await response.Content.ReadAsStringAsync();
        content.Should().Contain("POL-REP-1");
    }

    [Fact]
    public async Task DownloadControlMaestroPdf_ShouldReturnFile()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDatabase>();

        var aseguradora = new Aseguradora { Id = Guid.NewGuid(), Nombre = "Test Aseguradora" };
        var empresa = new Empresa { Id = Guid.NewGuid(), Nombre = "Test Empresa" };
        var ramo = new Ramo { Id = Guid.NewGuid(), Nombre = "Test Ramo", CambiaValor = true, Descripcion = "Test" };
        await CustomWebApplicationFactory.EnsureTestUserAsync(db);

        await db.Aseguradoras.AddAsync(aseguradora);
        await db.Empresas.AddAsync(empresa);
        await db.Ramos.AddAsync(ramo);
        await db.SaveChangesAsync();

        var poliza = new Poliza
        {
            Id = Guid.NewGuid(),
            Numero = "POL-REP-2",
            Obra = "Obra",
            AseguradoraId = aseguradora.Id,
            Contratista = empresa.Id,
            Ramo = ramo.Id,
            Estado = EstadoPoliza.Vencida,
            UsuarioId = CustomWebApplicationFactory.TestUserId,
            ValorOriginal = 1000,
            ValorActual = 1000,
            FechaEmision = DateTimeOffset.UtcNow.AddYears(-2),
            FechaExpiracion = DateTimeOffset.UtcNow.AddDays(-1),
            PeriodicidadRenovacion = TimeSpan.FromDays(365),
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
        await db.Polizas.AddAsync(poliza);
        await db.SaveChangesAsync();

        // Act
        var response = await _client.GetAsync("/reportes/control-maestro/pdf");

        // Assert
        response.EnsureSuccessStatusCode();
        response.Content.Headers.ContentType!.MediaType.Should().Be("application/pdf");
        var fileBytes = await response.Content.ReadAsByteArrayAsync();
        fileBytes.Should().NotBeEmpty();
    }
}