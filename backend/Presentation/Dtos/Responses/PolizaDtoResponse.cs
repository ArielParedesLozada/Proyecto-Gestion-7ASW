using Backend.Domain.Enums;
namespace Backend.Presentation.Dtos.Responses;

public class PolizaDtoResponse
{
    public Guid Id { get; set; }
    public string Numero { get; set; } = null!;
    public string Obra { get; set; } = null!;
    public Guid AseguradoraId { get; set; }
    public string AseguradoraNombre { get; set; } = null!;
    public TimeSpan PeriodicidadRenovacion { get; set; }
    public Guid ContratistaId { get; set; }
    public string Contratista { get; set; } = null!;
    public Guid RamoId { get; set; }
    public string Ramo { get; set; } = null!;
    public bool RamoCambiaValor { get; set; }
    public decimal ValorOriginal { get; set; }
    public decimal ValorActual { get; set; }
    public DateTimeOffset FechaEmision { get; set; }
    public DateTimeOffset FechaExpiracion { get; set; }
    public string? Observaciones { get; set; }
    public EstadoPolizaDerivado Estado { get; set; }
}
