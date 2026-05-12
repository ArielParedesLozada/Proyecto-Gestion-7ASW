using System.Text.Json;
using Backend.Data.Databases;
using Backend.Domain.Models;

namespace Backend.App.Auditorias;

public class AuditoriaService(AppDatabase db)
{
    private readonly AppDatabase _db = db;

    public async Task RegistrarAsync(
        Guid userId,
        string tabla,
        Guid registroId,
        string accion,
        object? datosPrevios = null,
        object? datosNuevos = null)
    {
        var auditoria = new Auditoria
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Tabla = tabla,
            RegistroId = registroId,
            Accion = accion,
            DatosPrevios = datosPrevios != null
                ? JsonSerializer.Serialize(datosPrevios)
                : null,
            DatosNuevos = datosNuevos != null
                ? JsonSerializer.Serialize(datosNuevos)
                : null
        };
        await _db.Auditorias.AddAsync(auditoria);
    }
}