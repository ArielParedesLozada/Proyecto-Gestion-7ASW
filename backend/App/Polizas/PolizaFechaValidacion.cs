using Backend.Domain.Errors;

namespace Backend.App.Polizas;

/// <summary>Reglas compartidas entre creación manual e importación Excel.</summary>
public static class PolizaFechaValidacion
{
    public static void ValidarEmisionYExpiracion(DateTimeOffset emision, DateTimeOffset expiracion)
    {
        var ahora = DateTimeOffset.UtcNow;
        var dEm = PolizaEstadoDerivadoHelper.FechaCalendarioNegocio(emision);
        var dEx = PolizaEstadoDerivadoHelper.FechaCalendarioNegocio(expiracion);
        var dHoy = PolizaEstadoDerivadoHelper.FechaCalendarioNegocio(ahora);
        if (dEm > dHoy)
            throw new CustomError("La fecha de emisión no puede ser posterior a la fecha actual.", 400);
        if (dEx < dEm)
            throw new CustomError("La fecha de expiración no puede ser anterior a la fecha de emisión.", 400);
    }
}
