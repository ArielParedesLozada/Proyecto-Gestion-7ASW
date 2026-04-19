namespace Backend.Domain.Enums;

/// <summary>
/// Estado de póliza expuesto en API: calculado con <c>FechaExpiracion</c> y la fecha actual (solo día, UTC).
/// </summary>
public enum EstadoPolizaDerivado
{
    Vigente = 0,
    PorVencer = 1,
    Expirado = 2
}
