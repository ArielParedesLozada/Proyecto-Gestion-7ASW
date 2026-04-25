using Backend.Data.Databases;
using Backend.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Backend.App.Renovaciones;

public class ExpireRenovationService(AppDatabase context)
{
    private readonly AppDatabase _context = context;
    public async Task ExpireRenovations()
    {
        var now = DateTimeOffset.UtcNow;
        var renovacionesExpiradas = await _context.Renovaciones
            .Include(r => r.PolizaNav)
            .Where(r =>
                r.Estado == EstadoRenovacion.PorVencer &&
                r.PolizaNav.FechaExpiracion <= now
            )
            .ToListAsync();
        if (!renovacionesExpiradas.Any())
            return;

        foreach (var renovacion in renovacionesExpiradas)
        {
            renovacion.Estado = EstadoRenovacion.Vencida;
            renovacion.UpdatedAt = now;
            renovacion.PolizaNav.Estado = EstadoPoliza.Vencida;
        }

        await _context.SaveChangesAsync();
    }
}