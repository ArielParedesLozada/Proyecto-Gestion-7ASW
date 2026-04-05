using Backend.App.Dtos;
using Backend.Data.Databases;
using Microsoft.EntityFrameworkCore;
using Backend.Domain.Enums;
using Backend.Domain.Models;
using Backend.Presentation.Dtos.Requests;

namespace Backend.App.Polizas;

public class PolizaService(AppDatabase context)
{
    private readonly AppDatabase _context = context;

    // ✅ Crear
    public async Task<PolizaRes> CrearAsync(PolizaRequest request)
    {
        var poliza = new Poliza
        {
            Id = Guid.NewGuid(),
            Numero = request.Numero,
            Contratista = request.Contratista,
            Obra = request.Obra,
            Ramo = request.Ramo,
            Aseguradora = request.Aseguradora,
            FechaEmision = request.FechaEmision,
            FechaExpiracion = request.FechaExpiracion,
            ValorOriginal = request.ValorOriginal,
            ValorActual = request.ValorOriginal,
            Estado = EstadoPoliza.Vigente,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
        _context.Polizas.Add(poliza);
        await _context.SaveChangesAsync();
        var result = await _context.Polizas
            .Where(p => p.Id == poliza.Id)
            .Include(p => p.ContratistaNav)
            .Include(p => p.RamoNav)
            .Select(p => new PolizaRes
            {
                Id = p.Id,
                Numero = p.Numero,
                Obra = p.Obra,
                ContratistaNombre = p.ContratistaNav.Nombre,
                RamoNombre = p.RamoNav.Nombre
            })
            .AsNoTracking()
            .FirstOrDefaultAsync();
        return result;
    }

    // ✅ Obtener paginado + búsqueda
    public async Task<(IEnumerable<PolizaRes>, int)> ObtenerPaginadoAsync(
          int page,
          int pageSize,
          string? search)
    {
        if (page <= 0) page = 1;
        if (pageSize <= 0) pageSize = 10;

        var query = _context.Polizas
            .AsNoTracking()
            .Include(p => p.ContratistaNav)
            .Include(p => p.RamoNav)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(p =>
                p.Numero.Contains(search) ||
                p.Obra.Contains(search));
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
                FechaExpiracion = p.FechaExpiracion,
                Estado = p.Estado
            })
            .ToListAsync();

        return (items, total);
    }

    // ✅ Obtener por Id
    public async Task<PolizaRes?> ObtenerPorIdAsync(Guid id)
    {
        return await _context.Polizas
            .Where(p => p.Id == id)
            .Include(p => p.ContratistaNav)
            .Include(p => p.RamoNav)
            .Select(p => new PolizaRes
            {
                Id = p.Id,
                Numero = p.Numero,
                Obra = p.Obra,
                ContratistaNombre = p.ContratistaNav.Nombre,
                RamoNombre = p.RamoNav.Nombre
            })
            .AsNoTracking()
            .FirstOrDefaultAsync();
    }
}