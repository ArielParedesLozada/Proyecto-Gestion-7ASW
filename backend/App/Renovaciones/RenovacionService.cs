using Backend.App.Dtos;
using Backend.Data.Databases;
using Backend.Domain.Errors;
using Microsoft.EntityFrameworkCore;

namespace Backend.App.Renovaciones;

public class RenovacionService(AppDatabase context)
{
    private readonly AppDatabase _context = context;

    public async Task<(IEnumerable<RenovacionRes>, int)> ObtenerPaginadoAsync(
        int page,
        int pageSize,
        string? search,
        DateTimeOffset? fechaDesde = null,
        DateTimeOffset? fechaHasta = null
    )
    {
        if (page <= 0)
            page = 1;

        if (pageSize <= 0)
            pageSize = 10;

        var query = _context.Renovaciones
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            query = query.Where(r =>
                r.PolizaNav.Numero.Contains(s) ||
                r.PolizaNav.Obra.Contains(s) ||
                r.PolizaNav.ContratistaNav.Nombre.Contains(s) ||
                r.PolizaNav.RamoNav.Nombre.Contains(s)
            );
        }
        if (fechaDesde.HasValue)
        {
            query = query.Where(r =>
                r.FechaRenovacion >= fechaDesde.Value
            );
        }
        if (fechaHasta.HasValue)
        {
            query = query.Where(r =>
                r.FechaRenovacion <= fechaHasta.Value
            );
        }
        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(r => r.FechaRenovacion)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new RenovacionRes
            {
                Id = r.Id,
                PolizaId = r.PolizaId,
                NumeroPoliza = r.PolizaNav.Numero,
                Obra = r.PolizaNav.Obra,
                ContratistaNombre = r.PolizaNav.ContratistaNav.Nombre,
                RamoNombre = r.PolizaNav.RamoNav.Nombre,
                Valor = r.Valor,
                FechaRenovacion = r.FechaRenovacion,
                FechaExpiracion = r.FechaExpiracion,
                Estado = r.Estado,
                Observaciones = r.Observaciones
            })
            .ToListAsync();
        return (items, total);
    }
    public async Task<RenovacionRes> ObtenerPorIdAsync(Guid renovacionId)
    {
        var renovacion = await _context.Renovaciones
            .AsNoTracking()
            .Where(r => r.Id == renovacionId)
            .Select(r => new RenovacionRes
            {
                Id = r.Id,
                PolizaId = r.PolizaId,
                NumeroPoliza = r.PolizaNav.Numero,
                Obra = r.PolizaNav.Obra,
                ContratistaNombre = r.PolizaNav.ContratistaNav.Nombre,
                RamoNombre = r.PolizaNav.RamoNav.Nombre,
                Valor = r.Valor,
                FechaRenovacion = r.FechaRenovacion,
                FechaExpiracion = r.FechaExpiracion,
                Estado = r.Estado,
                Observaciones = r.Observaciones
            })
            .FirstOrDefaultAsync() ?? throw new CustomError("Renovación no encontrada", 404);
        return renovacion;
    }
    public async Task<(IEnumerable<RenovacionRes>, int)>
    ObtenerPorPolizaIdAsync(Guid polizaId, int page, int pageSize)
    {
        if (page <= 0)
            page = 1;

        if (pageSize <= 0)
            pageSize = 10;

        var query = _context.Renovaciones
            .AsNoTracking()
            .Where(r => r.PolizaId == polizaId);

        var total = await query.CountAsync();

        var items = await query.OrderByDescending(r => r.FechaRenovacion)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new RenovacionRes
            {
                Id = r.Id,
                PolizaId = r.PolizaId,
                NumeroPoliza = r.PolizaNav.Numero,
                Obra = r.PolizaNav.Obra,
                ContratistaNombre = r.PolizaNav.ContratistaNav.Nombre,
                RamoNombre = r.PolizaNav.RamoNav.Nombre,
                Valor = r.Valor,
                FechaRenovacion = r.FechaRenovacion,
                FechaExpiracion = r.FechaExpiracion,
                Estado = r.Estado,
                Observaciones = r.Observaciones
            })
            .ToListAsync();

        return (items, total);
    }
}