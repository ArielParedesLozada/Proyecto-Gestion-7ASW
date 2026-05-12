using Backend.Data.Databases;
using Backend.Domain.Enums;
using Backend.Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.App.Renovaciones;

public class CreateRenovacionService(AppDatabase context)
{
    private readonly AppDatabase _context = context;
    public async Task CreateRenovacion()
    {
        var targetDate = DateTimeOffset.UtcNow.Date.AddDays(3);

        var polizas = await _context.Polizas
          .Include(p => p.RamoNav)
          .Where(p =>
              p.Estado == EstadoPoliza.Vigente &&
              p.FechaExpiracion.Date <= targetDate &&
              !_context.Renovaciones.Any(r =>
                   r.PolizaId == p.Id && (r.Estado == EstadoRenovacion.Pendiente || r.Estado == EstadoRenovacion.PorVencer)
              )
          )
          .ToListAsync();

        using var tx = await _context.Database.BeginTransactionAsync();
        foreach (var poliza in polizas)
        {
            await _context.Renovaciones.AddAsync(
               new Renovacion
               {
                   Id = Guid.NewGuid(),
                   PolizaId = poliza.Id,
                   Estado = EstadoRenovacion.PorVencer,
                   Valor = poliza.ValorActual,
                   FechaRenovacion = DateTimeOffset.UtcNow,
                   FechaExpiracion = poliza.FechaExpiracion.Add(poliza.RamoNav.PeriodicidadRenovacion),
                   CreatedAt = DateTimeOffset.UtcNow
               });
        }
        await _context.SaveChangesAsync();
        await tx.CommitAsync();
    }
}