using Backend.Domain.Enums;

namespace Backend.Domain.Models;

public class Renovacion
{
    public Guid Id { get; set; }
    public Guid PolizaId { get; set; }
    public Poliza PolizaNav { get; set; } = null!;
    public EstadoRenovacion Estado { get; set; }
    public decimal Valor { get; set; }
    public DateTimeOffset FechaRenovacion { get; set; }
    public DateTimeOffset FechaExpiracion { get; set; }
    public string? Observaciones { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? UpdatedAt { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }
}