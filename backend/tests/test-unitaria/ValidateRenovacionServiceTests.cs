using Backend.App.Auditorias;
using Backend.App.Renovaciones;
using Backend.Data.Databases;
using Backend.Domain.Enums;
using Backend.Domain.Errors;
using Backend.Domain.Models;
using Backend.Domain.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Moq;
using Xunit;

namespace TestUnitaria;

/// <summary>
/// Pruebas unitarias de ValidateRenovacionService.
/// Se usa EF Core InMemory como sustituto de la base de datos real.
/// Se mockea ICurrentUser y se usa AuditoriaService con la misma BD InMemory.
/// </summary>
public class ValidateRenovacionServiceTests : IDisposable
{
    private readonly AppDatabase _db;
    private readonly Mock<ICurrentUser> _currentUserMock = new();
    private readonly AuditoriaService _auditoriaService;
    private readonly ValidateRenovacionService _sut;

    public ValidateRenovacionServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDatabase>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;

        _db = new AppDatabase(options);
        _currentUserMock.Setup(c => c.UserId).Returns(Guid.NewGuid());
        _auditoriaService = new AuditoriaService(_db);
        _sut = new ValidateRenovacionService(_db, _auditoriaService, _currentUserMock.Object);
    }

    public void Dispose() => _db.Dispose();

    private async Task<(Poliza, Renovacion)> SeedPolizaConRenovacion(
        bool cambiaValor = false,
        EstadoRenovacion estadoRenovacion = EstadoRenovacion.PorVencer)
    {
        var ramo = new Ramo { Id = Guid.NewGuid(), Nombre = "Test Ramo", CambiaValor = cambiaValor, Descripcion = "desc" };
        var empresa = new Empresa { Id = Guid.NewGuid(), Nombre = "Test Empresa", Email = "e@e.com" };
        var aseguradora = new Aseguradora { Id = Guid.NewGuid(), Nombre = "Test Aseg", Email = "a@a.com" };
        var user = new User("test", "hash", "USER", "u@u.com") { Id = Guid.NewGuid() };

        var poliza = new Poliza
        {
            Id = Guid.NewGuid(),
            Numero = "POL-001",
            Obra = "Obra Test",
            Contratista = empresa.Id,
            ContratistaNav = empresa,
            Ramo = ramo.Id,
            RamoNav = ramo,
            AseguradoraId = aseguradora.Id,
            AseguradoraNav = aseguradora,
            UsuarioId = user.Id,
            UsuarioNav = user,
            PeriodicidadRenovacion = TimeSpan.FromDays(365),
            FechaEmision = DateTimeOffset.UtcNow.AddYears(-1),
            FechaExpiracion = DateTimeOffset.UtcNow.AddDays(2),
            ValorOriginal = 10000,
            ValorActual = 10000,
            Estado = EstadoPoliza.Vigente,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        var renovacion = new Renovacion
        {
            Id = Guid.NewGuid(),
            PolizaId = poliza.Id,
            PolizaNav = poliza,
            Estado = estadoRenovacion,
            Valor = 10000,
            FechaRenovacion = DateTimeOffset.UtcNow,
            FechaExpiracion = poliza.FechaExpiracion.Add(poliza.PeriodicidadRenovacion),
            CreatedAt = DateTimeOffset.UtcNow
        };

        _db.Ramos.Add(ramo);
        _db.Empresas.Add(empresa);
        _db.Aseguradoras.Add(aseguradora);
        _db.Users.Add(user);
        _db.Polizas.Add(poliza);
        _db.Renovaciones.Add(renovacion);
        await _db.SaveChangesAsync();

        return (poliza, renovacion);
    }

    // ── 1. Validar renovación exitosamente ────────────────────────────
    [Fact]
    public async Task ValidateRenovacion_PorVencer_CambiaEstadoAVigente()
    {
        var (poliza, renovacion) = await SeedPolizaConRenovacion();

        var result = await _sut.ValidateRenovacion(renovacion.Id, null);

        Assert.Equal(EstadoRenovacion.Vigente, result.Estado);
    }

    // ── 2. Validar extiende fecha de expiración de la póliza ──────────
    [Fact]
    public async Task ValidateRenovacion_ExtiendeFechaExpiracion()
    {
        var (poliza, renovacion) = await SeedPolizaConRenovacion();
        var fechaOriginal = poliza.FechaExpiracion;

        await _sut.ValidateRenovacion(renovacion.Id, null);

        var polizaActualizada = await _db.Polizas.FindAsync(poliza.Id);
        Assert.True(polizaActualizada!.FechaExpiracion > fechaOriginal);
    }

    // ── 3. Renovación ya validada lanza error ─────────────────────────
    [Fact]
    public async Task ValidateRenovacion_YaVigente_LanzaError400()
    {
        var (_, renovacion) = await SeedPolizaConRenovacion(estadoRenovacion: EstadoRenovacion.Vigente);

        var ex = await Assert.ThrowsAsync<CustomError>(
            () => _sut.ValidateRenovacion(renovacion.Id, null));
        Assert.Equal(400, ex.Code);
        Assert.Contains("ya fue validada", ex.Message);
    }

    // ── 4. Rechazar renovación marca como Vencida ─────────────────────
    [Fact]
    public async Task RejectRenovacion_CambiaEstadoAVencida()
    {
        var (_, renovacion) = await SeedPolizaConRenovacion();

        var result = await _sut.RejectRenovacion(renovacion.Id);

        Assert.Equal(EstadoRenovacion.Vencida, result.Estado);
    }

    // ── 5. Rechazar renovación marca póliza como Vencida ─────────────
    [Fact]
    public async Task RejectRenovacion_MarcaPolizaComoVencida()
    {
        var (poliza, renovacion) = await SeedPolizaConRenovacion();

        await _sut.RejectRenovacion(renovacion.Id);

        var polizaDb = await _db.Polizas.FindAsync(poliza.Id);
        Assert.Equal(EstadoPoliza.Vencida, polizaDb!.Estado);
    }
}
