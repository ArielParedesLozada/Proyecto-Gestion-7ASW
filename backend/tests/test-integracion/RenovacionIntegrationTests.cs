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

public class RenovacionIntegrationTests : IClassFixture<CustomWebApplicationFactory>
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
            UsuarioId = user.Id,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
        await db.Polizas.AddAsync(poliza);
        await db.SaveChangesAsync();

        var renewRequest = new ValidateRenovacionRequest
        {
            NuevoValor = 1200
        };

        // Act
        var response = await _client.PostAsJsonAsync($"/renovaciones/{poliza.Id}/validate", renewRequest);

        // Assert
        response.EnsureSuccessStatusCode();

        // Verificar que la renovación fue creada
        var renovacion = await db.Renovaciones
            .FirstOrDefaultAsync(r => r.PolizaId == poliza.Id);

        renovacion.Should().NotBeNull();
        renovacion!.Valor.Should().Be(1200);
        renovacion.Estado.Should().Be(EstadoRenovacion.Pendiente);
    }
}