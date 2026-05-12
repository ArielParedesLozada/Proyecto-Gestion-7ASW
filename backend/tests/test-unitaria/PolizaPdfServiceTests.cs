using Backend.App.Auditorias;
using Backend.App.Dtos;
using Backend.App.Polizas;
using Backend.Data.Databases;
using Backend.Domain.Enums;
using Backend.Domain.Models;
using Backend.Domain.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Moq;
using Xunit;

namespace TestUnitaria;

/// <summary>
/// Pruebas unitarias de PolizaPdfService.
/// Se usa EF Core InMemory con un PolizaService real para probar GenerarPdfAsync.
/// No se mockea PolizaService (métodos no virtuales); se verifica el flujo completo
/// sin conexión a base de datos real.
/// </summary>
public class PolizaPdfServiceTests : IDisposable
{
    private readonly AppDatabase _db;
    private readonly PolizaService _polizaService;
    private readonly PolizaPdfService _sut;

    public PolizaPdfServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDatabase>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;
        _db = new AppDatabase(options);

        var currentUserMock = new Mock<ICurrentUser>();
        currentUserMock.Setup(c => c.UserId).Returns(Guid.NewGuid());
        var auditoriaService = new AuditoriaService(_db);
        _polizaService = new PolizaService(_db, auditoriaService, currentUserMock.Object);
        _sut = new PolizaPdfService(_polizaService);
    }

    public void Dispose() => _db.Dispose();

    private async Task<Poliza> SeedPoliza()
    {
        var ramo = new Ramo { Id = Guid.NewGuid(), Nombre = "Cumplimiento", CambiaValor = false, Descripcion = "d" };
        var empresa = new Empresa { Id = Guid.NewGuid(), Nombre = "Contratista Test", Email = "e@e.com" };
        var aseg = new Aseguradora { Id = Guid.NewGuid(), Nombre = "Seguros Test", Email = "a@a.com" };
        var user = new User("admin", "hash", "ADMIN", "admin@test.com") { Id = Guid.NewGuid() };
        var poliza = new Poliza
        {
            Id = Guid.NewGuid(),
            Numero = "POL-2026-001",
            Obra = "Obra de prueba",
            Contratista = empresa.Id, ContratistaNav = empresa,
            Ramo = ramo.Id, RamoNav = ramo,
            AseguradoraId = aseg.Id, AseguradoraNav = aseg,
            UsuarioId = user.Id, UsuarioNav = user,
            PeriodicidadRenovacion = TimeSpan.FromDays(365),
            FechaEmision = DateTimeOffset.UtcNow.AddMonths(-6),
            FechaExpiracion = DateTimeOffset.UtcNow.AddMonths(6),
            ValorOriginal = 50000, ValorActual = 50000,
            Estado = EstadoPoliza.Vigente,
            CreatedAt = DateTimeOffset.UtcNow, UpdatedAt = DateTimeOffset.UtcNow
        };
        _db.Ramos.Add(ramo);
        _db.Empresas.Add(empresa);
        _db.Aseguradoras.Add(aseg);
        _db.Users.Add(user);
        _db.Polizas.Add(poliza);
        await _db.SaveChangesAsync();
        return poliza;
    }

    // ── 1. Póliza no encontrada retorna null ──────────────────────────
    [Fact]
    public async Task GenerarPdfAsync_PolizaNoExiste_RetornaNull()
    {
        var result = await _sut.GenerarPdfAsync(Guid.NewGuid(), DateTimeOffset.UtcNow);
        Assert.Null(result);
    }

    // ── 2. Póliza encontrada genera PDF con bytes y nombre ────────────
    [Fact]
    public async Task GenerarPdfAsync_PolizaExiste_RetornaBytesYNombreArchivo()
    {
        var poliza = await SeedPoliza();

        var result = await _sut.GenerarPdfAsync(poliza.Id, DateTimeOffset.UtcNow);

        Assert.NotNull(result);
        Assert.NotEmpty(result!.Value.Bytes);
        Assert.Contains("POL-2026-001", result.Value.FileName);
        Assert.EndsWith(".pdf", result.Value.FileName);
    }
}
