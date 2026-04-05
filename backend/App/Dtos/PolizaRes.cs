using Backend.Domain.Enums;

namespace Backend.App.Dtos;

public class PolizaRes
{
    public Guid Id { get; set; }
    public string Numero { get; set; } = null!;
    public string Obra { get; set; } = null!;
    public string Aseguradora { get; set; } = null!;
    public Guid ContratistaId { get; set; }
    public string ContratistaNombre { get; set; } = null!;
    public Guid RamoId { get; set; }
    public string RamoNombre { get; set; } = null!;
    public decimal ValorOriginal { get; set; }
    public decimal ValorActual { get; set; }
    public DateTimeOffset FechaEmision { get; set; }
    public DateTimeOffset FechaExpiracion { get; set; }
    public EstadoPoliza Estado { get; set; }
}