using Backend.App.Dtos;
using Backend.Data.Databases;
using Backend.Domain.Errors;
using Backend.Domain.Enums;
using Backend.Domain.Models;
using Backend.Presentation.Dtos.Requests;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Backend.Domain.Services;
using Backend.App.Auditorias;

namespace Backend.App.Polizas;

public class PolizaService(AppDatabase context, AuditoriaService auditoriaService, ICurrentUser currentUser)
{
    private readonly AppDatabase _context = context;
    private readonly AuditoriaService _auditoriaService = auditoriaService;
    private readonly ICurrentUser _currentUser = currentUser;
    public async Task<PolizaRes> CrearAsync(PolizaRequest request, Guid userId)
    {
        var emisionUtc = AUtc(request.FechaEmision);
        var expiracionUtc = AUtc(request.FechaExpiracion);
        PolizaFechaValidacion.ValidarEmisionYExpiracion(emisionUtc, expiracionUtc);
        await ValidarFkAsync(request.Contratista, request.Ramo, request.AseguradoraId);

        var valorActual = request.ValorActual > 0 ? request.ValorActual : request.ValorOriginal;
        var poliza = new Poliza
        {
            Id = Guid.NewGuid(),
            Numero = request.Numero.Trim(),
            Contratista = request.Contratista,
            Obra = request.Obra.Trim(),
            Ramo = request.Ramo,
            AseguradoraId = request.AseguradoraId,
            UsuarioId = userId,
            PeriodicidadRenovacion = expiracionUtc - emisionUtc,
            FechaEmision = emisionUtc,
            FechaExpiracion = expiracionUtc,
            ValorOriginal = request.ValorOriginal,
            ValorActual = valorActual,
            Observaciones = NormalizeObservaciones(request.Observaciones),
            Estado = PolizaEstadoDerivadoHelper.EstadoPersistido(expiracionUtc, DateTimeOffset.UtcNow),
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        _context.Polizas.Add(poliza);

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            ThrowIfPolizaSaveFailed(ex);
        }
        await _auditoriaService.RegistrarAsync(
            _currentUser.UserId,
            "Polizas",
            poliza.Id,
            "CREATE",
            null,
            new
            {
                poliza.Numero,
                poliza.Obra,
                poliza.ValorOriginal,
                poliza.ValorActual,
                poliza.FechaEmision,
                poliza.FechaExpiracion
            }
        );
        await _context.SaveChangesAsync();
        return await ProyectarPorIdAsync(poliza.Id)
            ?? throw new CustomError("No se pudo recuperar la póliza creada.", 500);
    }

    public async Task<(IEnumerable<PolizaRes>, int)> ObtenerPaginadoAsync(
        int page,
        int pageSize,
        string? search,
        Guid? ramoId = null)
    {
        if (page <= 0) page = 1;
        if (pageSize <= 0) pageSize = 10;

        var query = _context.Polizas.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            query = query.Where(p =>
                p.Numero.Contains(s) ||
                p.Obra.Contains(s) ||
                p.AseguradoraNav.Nombre.Contains(s) ||
                p.ContratistaNav.Nombre.Contains(s) ||
                p.RamoNav.Nombre.Contains(s));
        }

        // Filtro por ramo (punto 9 de especificaciones)
        if (ramoId.HasValue && ramoId.Value != Guid.Empty)
        {
            query = query.Where(p => p.Ramo == ramoId.Value);
        }

        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new PolizaRes
            {
                Id = p.Id,
                Numero = p.Numero,
                Obra = p.Obra,
                AseguradoraId = p.AseguradoraId,
                AseguradoraNombre = p.AseguradoraNav.Nombre,
                PeriodicidadRenovacion = p.PeriodicidadRenovacion,
                ContratistaId = p.Contratista,
                ContratistaNombre = p.ContratistaNav.Nombre,
                RamoId = p.Ramo,
                RamoNombre = p.RamoNav.Nombre,
                FechaEmision = p.FechaEmision,
                FechaExpiracion = p.FechaExpiracion,
                ValorOriginal = p.ValorOriginal,
                ValorActual = p.ValorActual,
                Observaciones = p.Observaciones,
                Estado = EstadoPolizaDerivado.Vigente
            })
            .ToListAsync();

        var now = DateTimeOffset.UtcNow;
        foreach (var item in items)
            item.Estado = PolizaEstadoDerivadoHelper.Calcular(item.FechaExpiracion, now);

        return (items, total);
    }

    public async Task<PolizaRes?> ObtenerPorIdAsync(Guid id) => await ProyectarPorIdAsync(id);

    public async Task<PolizaRes?> ActualizarAsync(Guid id, PolizaUpdateRequest request)
    {
        var emisionUtc = AUtc(request.FechaEmision);
        var expiracionUtc = AUtc(request.FechaExpiracion);
        PolizaFechaValidacion.ValidarEmisionYExpiracion(emisionUtc, expiracionUtc);

        // CORREGIDO: Usar AseguradoraId en lugar de Aseguradora (string)
        await ValidarFkAsync(request.Contratista, request.Ramo, request.AseguradoraId);

        var entity = await _context.Polizas.FirstOrDefaultAsync(p => p.Id == id);
        var oldData = new
        {
            entity.Numero,
            entity.Obra,
            entity.ValorOriginal,
            entity.ValorActual,
            entity.FechaEmision,
            entity.FechaExpiracion
        };
        if (entity == null)
            return null;

        entity.Contratista = request.Contratista;
        entity.Obra = request.Obra.Trim();
        entity.Ramo = request.Ramo;
        entity.AseguradoraId = request.AseguradoraId; // CORREGIDO
        entity.PeriodicidadRenovacion = expiracionUtc - emisionUtc;
        entity.FechaEmision = emisionUtc;
        entity.FechaExpiracion = expiracionUtc;
        entity.ValorOriginal = request.ValorOriginal;
        entity.ValorActual = request.ValorActual;
        entity.Observaciones = NormalizeObservaciones(request.Observaciones);
        entity.Estado = PolizaEstadoDerivadoHelper.EstadoPersistido(expiracionUtc, DateTimeOffset.UtcNow);
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        var newData = new
        {
            entity.Numero,
            entity.Obra,
            entity.ValorOriginal,
            entity.ValorActual,
            entity.FechaEmision,
            entity.FechaExpiracion
        };
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            ThrowIfPolizaSaveFailed(ex);
        }
        await _auditoriaService.RegistrarAsync(
            _currentUser.UserId,
            "Polizas",
            entity.Id,
            "UPDATE",
            oldData,
            newData
        );
        await _context.SaveChangesAsync();

        return await ProyectarPorIdAsync(id);
    }

    private async Task<PolizaRes?> ProyectarPorIdAsync(Guid id)
    {
        var row = await _context.Polizas
            .AsNoTracking()
            .Where(p => p.Id == id)
            .Select(p => new PolizaRes
            {
                Id = p.Id,
                Numero = p.Numero,
                Obra = p.Obra,
                AseguradoraId = p.AseguradoraId,
                AseguradoraNombre = p.AseguradoraNav.Nombre,
                PeriodicidadRenovacion = p.PeriodicidadRenovacion,
                ContratistaId = p.Contratista,
                ContratistaNombre = p.ContratistaNav.Nombre,
                RamoId = p.Ramo,
                RamoNombre = p.RamoNav.Nombre,
                RamoCambiaValor = p.RamoNav.CambiaValor,
                FechaEmision = p.FechaEmision,
                FechaExpiracion = p.FechaExpiracion,
                ValorOriginal = p.ValorOriginal,
                ValorActual = p.ValorActual,
                Observaciones = p.Observaciones,
                Estado = EstadoPolizaDerivado.Vigente
            })
            .FirstOrDefaultAsync();

        if (row == null)
            return null;

        row.Estado = PolizaEstadoDerivadoHelper.Calcular(row.FechaExpiracion, DateTimeOffset.UtcNow);
        return row;
    }

    private static DateTimeOffset AUtc(DateTimeOffset dto) => dto.ToUniversalTime();

    private static string? NormalizeObservaciones(string? observaciones)
    {
        if (string.IsNullOrWhiteSpace(observaciones))
            return null;
        return observaciones.Trim();
    }

    private async Task ValidarFkAsync(Guid empresaId, Guid ramoId, Guid aseguradoraId)
    {
        if (!await _context.Empresas.AnyAsync(e => e.Id == empresaId))
            throw new CustomError("El contratista indicado no existe.", 400);
        if (!await _context.Ramos.AnyAsync(r => r.Id == ramoId))
            throw new CustomError("El ramo indicado no existe.", 400);
        if (!await _context.Aseguradoras.AnyAsync(a => a.Id == aseguradoraId))
            throw new CustomError("La aseguradora indicada no existe.", 400);
    }

    private static void ThrowIfPolizaSaveFailed(DbUpdateException ex)
    {
        var pg = FindPostgresException(ex);
        if (pg != null)
        {
            switch (pg.SqlState)
            {
                case "23505":
                    throw new CustomError("Ya existe una póliza con ese número.", 409);
                case "23503":
                    throw new CustomError(
                        "No se pudo guardar: el contratista o el ramo no es válido en la base de datos.",
                        400);
                case "23502":
                    throw new CustomError("Faltan datos obligatorios para guardar la póliza.", 400);
                case "22003":
                    throw new CustomError("Algún valor numérico está fuera del rango permitido.", 400);
                default:
                    throw new CustomError(
                        $"Error al guardar en base de datos: {pg.MessageText}",
                        500);
            }
        }

        var detalle = DeepestExceptionMessage(ex);
        throw new CustomError(
            $"No se pudo guardar la póliza. {detalle}",
            500);
    }

    private static string DeepestExceptionMessage(Exception ex)
    {
        var x = ex;
        while (x.InnerException != null)
            x = x.InnerException;
        return x.Message;
    }

    private static PostgresException? FindPostgresException(Exception? ex)
    {
        if (ex == null)
            return null;
        if (ex is PostgresException pe)
            return pe;
        if (ex is AggregateException agg)
        {
            foreach (var inner in agg.InnerExceptions)
            {
                var found = FindPostgresException(inner);
                if (found != null)
                    return found;
            }
        }
        return FindPostgresException(ex.InnerException);
    }
}