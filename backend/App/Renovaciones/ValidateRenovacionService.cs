using System.Threading.Tasks;
using Backend.Data.Databases;
using Backend.Domain.Enums;
using Backend.Domain.Errors;
using Backend.Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.App.Renovaciones;

public class ValidateRenovacionService(AppDatabase context)
{
    private readonly AppDatabase _context = context;
    public async Task<Renovacion> ValidateRenovacion(Guid renovacionId, decimal? nuevoValor)
    {
        var renovacion = await _context.Renovaciones
            .Include(r => r.PolizaNav)
            .ThenInclude(p => p.RamoNav)
            .FirstOrDefaultAsync(r => r.Id == renovacionId) ?? throw new CustomError("Renovación no encontrada", 404);

        if (renovacion.Estado == EstadoRenovacion.Vigente)
            throw new CustomError("La renovación ya fue validada", 400);
        if (renovacion.Estado == EstadoRenovacion.Vencida)
            throw new CustomError("La renovación expiró", 400);
        var poliza = renovacion.PolizaNav;
        var ramo = poliza.RamoNav;
        if (ramo.CambiaValor)
        {
            if (!nuevoValor.HasValue || nuevoValor <= 0)
                throw new CustomError("Debe ingresar un nuevo valor válido", 400);
            poliza.ValorActual = nuevoValor.Value;
        }
        renovacion.Estado = EstadoRenovacion.Vigente;
        poliza.Estado = EstadoPoliza.Vigente;
        poliza.FechaExpiracion = poliza.FechaExpiracion.Add(poliza.PeriodicidadRenovacion);
        await InvalidarNotificaciones(poliza.Id);
        await _context.SaveChangesAsync();
        return renovacion;
    }
    public async Task<Renovacion> RejectRenovacion(Guid renovacionId)
    {
        var renovacion = await _context.Renovaciones
            .Include(r => r.PolizaNav)
            .ThenInclude(p => p.RamoNav)
            .FirstOrDefaultAsync(r => r.Id == renovacionId) ?? throw new CustomError("Renovación no encontrada", 404);

        if (renovacion.Estado == EstadoRenovacion.Vigente)
            throw new CustomError("La renovación ya fue validada", 400);
        if (renovacion.Estado == EstadoRenovacion.Vencida)
            throw new CustomError("La renovación expiró", 400);
        var poliza = renovacion.PolizaNav;
        var ramo = poliza.RamoNav;
        renovacion.Estado = EstadoRenovacion.Vencida;
        poliza.Estado = EstadoPoliza.Vencida;
        await InvalidarNotificaciones(poliza.Id);
        await _context.SaveChangesAsync();
        return renovacion;
    }

    private async Task InvalidarNotificaciones(Guid polizaId)
    {
        var notificaciones = await _context.Notificaciones
            .Where(n => n.PolizaId == polizaId && n.Estado == EstadoNotificacion.Pendiente)
            .ToListAsync();
        foreach (var n in notificaciones)
        {
            n.Estado = EstadoNotificacion.Invalidada;
        }
    }
}