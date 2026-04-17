using Backend.Domain.Enums;

namespace Backend.App.Polizas;

public static class PolizaEstadoDerivadoHelper
{
    /// <summary>Offset fijo Colombia (sin DST), alineado con fechas del API (<c>-05:00</c>).</summary>
    private static readonly TimeSpan OffsetNegocioColombia = TimeSpan.FromHours(-5);

    /// <summary>Días hasta expiración (inclusive) para considerar "por vencer".</summary>
    public const int DiasUmbralPorVencer = 10;

    /// <summary>Fecha civil del negocio (calendario Colombia) para un instante almacenado.</summary>
    public static DateTime FechaCalendarioNegocio(DateTimeOffset instante) =>
        instante.ToOffset(OffsetNegocioColombia).Date;

    /// <summary>
    /// Compara solo la parte fecha (UTC). Expirado si la fecha de expiración es anterior al día de hoy.
    /// Si no expiró: por vencer si quedan 10 días o menos hasta la expiración; si no, vigente.
    /// </summary>
    public static EstadoPolizaDerivado Calcular(DateTimeOffset fechaExpiracionUtc, DateTimeOffset ahoraUtc)
    {
        var exp = fechaExpiracionUtc.ToUniversalTime().Date;
        var today = ahoraUtc.ToUniversalTime().Date;
        if (exp < today)
            return EstadoPolizaDerivado.Expirado;
        var dias = (exp - today).Days;
        if (dias <= DiasUmbralPorVencer)
            return EstadoPolizaDerivado.PorVencer;
        return EstadoPolizaDerivado.Vigente;
    }

    /// <summary>
    /// Valor persistido en BD: Vencida si ya pasó la fecha de expiración (solo día), si no Vigente.
    /// </summary>
    public static EstadoPoliza EstadoPersistido(DateTimeOffset fechaExpiracionUtc, DateTimeOffset ahoraUtc)
    {
        var exp = fechaExpiracionUtc.ToUniversalTime().Date;
        var today = ahoraUtc.ToUniversalTime().Date;
        return exp < today ? EstadoPoliza.Vencida : EstadoPoliza.Vigente;
    }
}
