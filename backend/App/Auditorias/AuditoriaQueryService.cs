using Backend.App.Dtos;
using Backend.Data.Databases;
using Backend.Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.App.Auditorias;

public class AuditoriaQueryService(AppDatabase context)
{
    private readonly AppDatabase _context = context;

    public async Task<(IEnumerable<AuditoriaRes>, int)> ObtenerPaginadoAsync(
        int page,
        int pageSize,
        string? search,
        string? tabla = null,
        Guid? userId = null
    )
    {
        if (page <= 0)
            page = 1;

        if (pageSize <= 0)
            pageSize = 10;

        var query = _context.Auditorias
            .AsNoTracking()
            .Include(a => a.UsuarioNav)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim();
            query = query.Where(a =>
                a.Tabla.Contains(s) ||
                a.Accion.Contains(s) ||
                a.UsuarioNav.Username!.Contains(s)
            );
        }

        if (!string.IsNullOrWhiteSpace(tabla))
        {
            query = query.Where(a => a.Tabla == tabla);
        }

        if (userId.HasValue && userId.Value != Guid.Empty)
        {
            query = query.Where(a => a.UserId == userId.Value);
        }

        var total = await query.CountAsync();

        var items = await query
            .OrderByDescending(a => a.Id) // o por fecha si luego agregas CreatedAt
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new AuditoriaRes
            {
                Id = a.Id,
                UserId = a.UserId,
                Username = a.UsuarioNav.Username!,
                Tabla = a.Tabla,
                RegistroId = a.RegistroId,
                Accion = a.Accion,
                DatosPrevios = a.DatosPrevios,
                DatosNuevos = a.DatosNuevos
            })
            .ToListAsync();

        return (items, total);
    }
}