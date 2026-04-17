using Backend.App.Dtos;
using Backend.Data.Databases;
using Backend.Domain.Errors;
using Backend.Domain.Enums;
using Backend.Domain.Models;
using Backend.Presentation.Dtos.Requests;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Backend.App.Polizas;

public class PolizaService(AppDatabase context)
{
    private readonly AppDatabase _context = context;

    public async Task<PolizaRes> CrearAsync(PolizaRequest request)
    {
        var emisionUtc = AUtc(request.FechaEmision);
        var expiracionUtc = AUtc(request.FechaExpiracion);
        PolizaFechaValidacion.ValidarEmisionYExpiracion(emisionUtc, expiracionUtc);
        await ValidarFkAsync(request.Contratista, request.Ramo);

        var valorActual = request.ValorActual > 0 ? request.ValorActual : request.ValorOriginal;

        var poliza = new Poliza
        {
            Id = Guid.NewGuid(),
            Numero = request.Numero.Trim(),
            Contratista = request.Contratista,
            Obra = request.Obra.Trim(),
            Ramo = request.Ramo,
            Aseguradora = request.Aseguradora.Trim(),
            FechaEmision = emisionUtc,
            FechaExpiracion = expiracionUtc,
            ValorOriginal = request.ValorOriginal,
            ValorActual = valorActual,
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

        return await ProyectarPorIdAsync(poliza.Id)
            ?? throw new CustomError("No se pudo recuperar la póliza creada.", 500);
    }

    public async Task<(IEnumerable<PolizaRes>, int)> ObtenerPaginadoAsync(
        int page,
        int pageSize,
        string? search)
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
                p.Aseguradora.Contains(s) ||
                p.ContratistaNav.Nombre.Contains(s) ||
                p.RamoNav.Nombre.Contains(s));
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
                Aseguradora = p.Aseguradora,
                ContratistaId = p.Contratista,
                ContratistaNombre = p.ContratistaNav.Nombre,
                RamoId = p.Ramo,
                RamoNombre = p.RamoNav.Nombre,
                FechaEmision = p.FechaEmision,
                FechaExpiracion = p.FechaExpiracion,
                ValorOriginal = p.ValorOriginal,
                ValorActual = p.ValorActual,
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
        await ValidarFkAsync(request.Contratista, request.Ramo);

        var entity = await _context.Polizas.FirstOrDefaultAsync(p => p.Id == id);
        if (entity == null)
            return null;

        entity.Contratista = request.Contratista;
        entity.Obra = request.Obra.Trim();
        entity.Ramo = request.Ramo;
        entity.Aseguradora = request.Aseguradora.Trim();
        entity.FechaEmision = emisionUtc;
        entity.FechaExpiracion = expiracionUtc;
        entity.ValorOriginal = request.ValorOriginal;
        entity.ValorActual = request.ValorActual;
        entity.Estado = PolizaEstadoDerivadoHelper.EstadoPersistido(expiracionUtc, DateTimeOffset.UtcNow);
        entity.UpdatedAt = DateTimeOffset.UtcNow;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateException ex)
        {
            ThrowIfPolizaSaveFailed(ex);
        }

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
                Aseguradora = p.Aseguradora,
                ContratistaId = p.Contratista,
                ContratistaNombre = p.ContratistaNav.Nombre,
                RamoId = p.Ramo,
                RamoNombre = p.RamoNav.Nombre,
                FechaEmision = p.FechaEmision,
                FechaExpiracion = p.FechaExpiracion,
                ValorOriginal = p.ValorOriginal,
                ValorActual = p.ValorActual,
                Estado = EstadoPolizaDerivado.Vigente
            })
            .FirstOrDefaultAsync();

        if (row == null)
            return null;

        row.Estado = PolizaEstadoDerivadoHelper.Calcular(row.FechaExpiracion, DateTimeOffset.UtcNow);
        return row;
    }

    /// <summary>
    /// Npgsql solo escribe <c>timestamptz</c> con <see cref="DateTimeOffset"/> en offset UTC (0).
    /// </summary>
    private static DateTimeOffset AUtc(DateTimeOffset dto) => dto.ToUniversalTime();

    private async Task ValidarFkAsync(Guid empresaId, Guid ramoId)
    {
        if (!await _context.Empresas.AnyAsync(e => e.Id == empresaId))
            throw new CustomError("El contratista indicado no existe.", 400);
        if (!await _context.Ramos.AnyAsync(r => r.Id == ramoId))
            throw new CustomError("El ramo indicado no existe.", 400);
    }

    /// <summary>
    /// Npgsql puede anidar PostgresException; no basta con comprobar solo InnerException directo.
    /// </summary>
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
