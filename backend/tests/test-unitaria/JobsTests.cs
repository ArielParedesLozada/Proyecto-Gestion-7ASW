using Backend.App.Notificaciones;
using Backend.App.Renovaciones;
using Backend.Data.Databases;
using Backend.Domain.Enums;
using Backend.Domain.Models;
using Backend.Domain.Services;
using Backend.Infrastructure.Jobs;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace TestUnitaria;

/// <summary>
/// Pruebas unitarias de los Cron Jobs (Hangfire).
/// Se usa EF Core InMemory como DB simulada y mocks para INotifier/IWordTemplate.
/// Se verifica que los jobs procesan correctamente las entidades según su estado.
/// </summary>
public class JobsTests : IDisposable
{
    private readonly AppDatabase _db;

    public JobsTests()
    {
        var options = new DbContextOptionsBuilder<AppDatabase>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;
        _db = new AppDatabase(options);
    }

    public void Dispose() => _db.Dispose();

    private async Task<Poliza> SeedPolizaVigente(int diasParaExpirar = 2)
    {
        var ramo = new Ramo { Id = Guid.NewGuid(), Nombre = "Test", CambiaValor = false, Descripcion = "d" };
        var empresa = new Empresa { Id = Guid.NewGuid(), Nombre = "E", Email = "e@e.com" };
        var aseg = new Aseguradora { Id = Guid.NewGuid(), Nombre = "A", Email = "a@a.com" };
        var user = new User("u", "h", "USER", "u@u.com") { Id = Guid.NewGuid() };
        var poliza = new Poliza
        {
            Id = Guid.NewGuid(),
            Numero = $"POL-{Guid.NewGuid():N}".Substring(0, 10),
            Obra = $"Obra-{Guid.NewGuid():N}".Substring(0, 10),
            Contratista = empresa.Id, ContratistaNav = empresa,
            Ramo = ramo.Id, RamoNav = ramo,
            AseguradoraId = aseg.Id, AseguradoraNav = aseg,
            UsuarioId = user.Id, UsuarioNav = user,
            PeriodicidadRenovacion = TimeSpan.FromDays(365),
            FechaEmision = DateTimeOffset.UtcNow.AddYears(-1),
            FechaExpiracion = DateTimeOffset.UtcNow.AddDays(diasParaExpirar),
            ValorOriginal = 5000, ValorActual = 5000,
            Estado = EstadoPoliza.Vigente,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
        _db.Ramos.Add(ramo);
        _db.Empresas.Add(empresa);
        _db.Aseguradoras.Add(aseg);
        _db.Users.Add(user);
        _db.Polizas.Add(poliza);
        await _db.SaveChangesAsync();
        return poliza;
    }

    // ═══════════════════════════════════════════════════════════════════
    // CheckRenovacionesJob → CreateRenovacionService
    // ═══════════════════════════════════════════════════════════════════

    // ── 1. Crea renovación para póliza próxima a expirar ──────────────
    [Fact]
    public async Task CreateRenovacion_PolizaPorExpirar_CreaRenovacion()
    {
        var poliza = await SeedPolizaVigente(diasParaExpirar: 2);
        var service = new CreateRenovacionService(_db);

        await service.CreateRenovacion();

        var renovacion = await _db.Renovaciones.FirstOrDefaultAsync(r => r.PolizaId == poliza.Id);
        Assert.NotNull(renovacion);
        Assert.Equal(EstadoRenovacion.PorVencer, renovacion!.Estado);
    }

    // ── 2. No crea renovación duplicada si ya existe una pendiente ────
    [Fact]
    public async Task CreateRenovacion_YaExisteRenovacion_NoCrea()
    {
        var poliza = await SeedPolizaVigente(diasParaExpirar: 2);
        _db.Renovaciones.Add(new Renovacion
        {
            Id = Guid.NewGuid(),
            PolizaId = poliza.Id,
            Estado = EstadoRenovacion.PorVencer,
            Valor = 5000,
            FechaRenovacion = DateTimeOffset.UtcNow,
            FechaExpiracion = poliza.FechaExpiracion.AddDays(365),
            CreatedAt = DateTimeOffset.UtcNow
        });
        await _db.SaveChangesAsync();

        var service = new CreateRenovacionService(_db);
        await service.CreateRenovacion();

        var count = await _db.Renovaciones.CountAsync(r => r.PolizaId == poliza.Id);
        Assert.Equal(1, count);
    }

    // ═══════════════════════════════════════════════════════════════════
    // SendNotificationsJob → PolizaNotificationService
    // ═══════════════════════════════════════════════════════════════════

    // ── 3. Procesa renovaciones PorVencer y envía notificación ────────
    [Fact]
    public async Task ProcesarNotificaciones_ConRenovacionPorVencer_CreaNotificacionYEnvia()
    {
        var poliza = await SeedPolizaVigente(diasParaExpirar: 2);
        _db.Renovaciones.Add(new Renovacion
        {
            Id = Guid.NewGuid(),
            PolizaId = poliza.Id,
            PolizaNav = poliza,
            Estado = EstadoRenovacion.PorVencer,
            Valor = 5000,
            FechaRenovacion = DateTimeOffset.UtcNow,
            FechaExpiracion = poliza.FechaExpiracion.AddDays(365),
            CreatedAt = DateTimeOffset.UtcNow
        });
        await _db.SaveChangesAsync();

        var notifierMock = new Mock<INotifier>();
        notifierMock
            .Setup(n => n.SendWithAttachmentAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<byte[]>(), It.IsAny<string>()))
            .Returns(Task.CompletedTask);
        var wordMock = new Mock<IWordTemplate>();
        wordMock.Setup(w => w.Generate(It.IsAny<string>(), It.IsAny<Dictionary<string, string>>()))
            .Returns(new byte[] { 1, 2, 3 });
        wordMock.Setup(w => w.TemplateExists(It.IsAny<string>())).Returns(true);

        var loggerMock = new Mock<ILogger<PolizaNotificationService>>();

        var service = new PolizaNotificationService(
            wordMock.Object, notifierMock.Object, _db, "http://localhost", loggerMock.Object);

        await service.ProcesarNotificacionesExpiracion();

        var notificaciones = await _db.Notificaciones.ToListAsync();
        Assert.Single(notificaciones);
        Assert.Equal(EstadoNotificacion.Enviada, notificaciones[0].Estado);
        notifierMock.Verify(
            n => n.SendWithAttachmentAsync(
                It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>(),
                It.IsAny<byte[]>(), It.IsAny<string>()),
            Times.AtLeastOnce);
    }
}
