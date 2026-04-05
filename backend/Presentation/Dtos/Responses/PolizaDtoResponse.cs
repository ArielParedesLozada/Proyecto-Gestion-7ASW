using Backend.Domain.Enums;
namespace Backend.Presentation.Dtos.Responses;

public class PolizaDtoResponse
{
    public Guid Id { get; set; }
    public string Numero { get; set; } = null!;
    public string Obra { get; set; } = null!;
    public string Aseguradora { get; set; } = null!;
    public string Contratista { get; set; } = null!;
    public string Ramo { get; set; } = null!;
    public decimal ValorOriginal { get; set; }
    public decimal ValorActual { get; set; }
    public DateTimeOffset FechaEmision { get; set; }
    public DateTimeOffset FechaExpiracion { get; set; }
    public EstadoPoliza Estado { get; set; }
}