// RenovacionIntegrationTests.cs
using System.Net.Http.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using Backend.Data.Databases;
using Backend.Domain.Models;
using Backend.Domain.Enums;
using test_integracion;
using Microsoft.EntityFrameworkCore;
using Xunit;
using Backend.Presentation.Dtos.Requests;

namespace test_integracion;

[Collection("IntegrationTests")]
public class RenovacionIntegrationTests
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public RenovacionIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CreateAndApproveRenovacion_ShouldUpdatePolicyStatus()
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
            Numero = "POL-REN-APP",
            Obra = "Obra",
            AseguradoraId = aseguradora.Id,
            Contratista = empresa.Id,
            Ramo = ramo.Id,
            PeriodicidadRenovacion = TimeSpan.FromDays(180),
            ValorOriginal = 1000,
            ValorActual = 1000,
            FechaEmision = DateTimeOffset.UtcNow.AddMonths(-6),
            FechaExpiracion = DateTimeOffset.UtcNow.AddDays(-1),
            Estado = EstadoPoliza.Vencida,
            UsuarioId = CustomWebApplicationFactory.TestUserId,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
        await db.Polizas.AddAsync(poliza);
        await db.SaveChangesAsync();

        var renovacion = new Renovacion
        {
            Id = Guid.NewGuid(),
            PolizaId = poliza.Id,
            Estado = EstadoRenovacion.PorVencer,
            Valor = 1000,
            FechaRenovacion = DateTimeOffset.UtcNow,
            FechaExpiracion = DateTimeOffset.UtcNow.AddDays(30),
            CreatedAt = DateTimeOffset.UtcNow
        };
        await db.Renovaciones.AddAsync(renovacion);
        await db.SaveChangesAsync();

        var renewRequest = new ValidateRenovacionRequest
        {
            NuevoValor = 1200
        };

        // Act
        var response = await _client.PostAsJsonAsync($"/renovaciones/{renovacion.Id}/validar", renewRequest);

        // Assert
        response.EnsureSuccessStatusCode();

        using var assertScope = _factory.Services.CreateScope();
        var assertDb = assertScope.ServiceProvider.GetRequiredService<AppDatabase>();

        var renovacionActualizada = await assertDb.Renovaciones
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == renovacion.Id);

        renovacionActualizada.Should().NotBeNull();
        renovacionActualizada!.Estado.Should().Be(EstadoRenovacion.Vigente);

        var polizaActualizada = await assertDb.Polizas
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == poliza.Id);
        polizaActualizada.Should().NotBeNull();
        polizaActualizada!.ValorActual.Should().Be(1200);
    }
}