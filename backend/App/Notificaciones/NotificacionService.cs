using Backend.App.Dtos;
using Backend.Data.Databases;
using Backend.Domain.Enums;
using Backend.Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.App.Notificaciones;

public class NotificacionService(AppDatabase context)
{
    private readonly AppDatabase _context = context;

    public async Task<(IEnumerable<NotificacionRes>, int)> ObtenerPaginadoAsync(
        int page,
        int pageSize,
        string? search,
        EstadoNotificacion? estado = null,
        TipoNotificacion? tipo = null
    )
    {
        if (page <= 0)
            page = 1;

        if (pageSize <= 0)
            pageSize = 10;

        var query = _context.Notificaciones
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            query = query.Where(n =>
                n.PolizaNav.Numero.Contains(s) ||
                n.PolizaNav.Obra.Contains(s) ||
                n.RenovacionNav.Observaciones!.Contains(s)
            );
        }

        if (estado.HasValue)
        {
            query = query.Where(n => n.Estado == estado.Value);
        }

        if (tipo.HasValue)
        {
            query = query.Where(n => n.Tipo == tipo.Value);
        }

        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(n => n.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(n => new NotificacionRes
            {
                Id = n.Id,
                PolizaId = n.PolizaId,
                NumeroPoliza = n.PolizaNav.Numero,
                Obra = n.PolizaNav.Obra,
                RenovacionId = n.RenovacionId,
                FechaRenovacion = n.RenovacionNav.FechaRenovacion,
                FechaExpiracion = n.RenovacionNav.FechaExpiracion,
                Estado = n.Estado,
                Tipo = n.Tipo,
                CreatedAt = n.CreatedAt,
                FechaEnvio = n.FechaEnvio
            })
            .ToListAsync();

        return (items, total);
    }

    public async Task<(IEnumerable<NotificacionRes>, int)> ObtenerPorPolizaIdAsync(
        Guid polizaId,
        int page,
        int pageSize
    )
    {
        if (page <= 0)
            page = 1;

        if (pageSize <= 0)
            pageSize = 10;

        var query = _context.Notificaciones
            .AsNoTracking()
            .Where(n => n.PolizaId == polizaId);

        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(n => n.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(n => new NotificacionRes
            {
                Id = n.Id,
                PolizaId = n.PolizaId,
                NumeroPoliza = n.PolizaNav.Numero,
                Obra = n.PolizaNav.Obra,
                RenovacionId = n.RenovacionId,
                FechaRenovacion = n.RenovacionNav.FechaRenovacion,
                FechaExpiracion = n.RenovacionNav.FechaExpiracion,
                Estado = n.Estado,
                Tipo = n.Tipo,
                CreatedAt = n.CreatedAt,
                FechaEnvio = n.FechaEnvio
            })
            .ToListAsync();

        return (items, total);
    }
}