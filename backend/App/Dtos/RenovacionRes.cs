using Backend.Domain.Enums;

namespace Backend.App.Dtos;

public class RenovacionRes
{
    public Guid Id { get; set; }
    public Guid PolizaId { get; set; }
    public string NumeroPoliza { get; set; } = null!;
    public string Obra { get; set; } = null!;
    public string ContratistaNombre { get; set; } = null!;
    public string RamoNombre { get; set; } = null!;
    public decimal Valor { get; set; }
    public DateTimeOffset FechaRenovacion { get; set; }
    public DateTimeOffset FechaExpiracion { get; set; }
    public EstadoRenovacion Estado { get; set; }
    public string? Observaciones { get; set; }
}