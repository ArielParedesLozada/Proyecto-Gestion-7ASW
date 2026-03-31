using Backend.Domain.Enums;

namespace Backend.Domain.Models;

public class Poliza
{
    public Guid Id { get; set; }
    public string Numero { get; set; }
    public Guid Contratista { get; set; }
    public string Obra { get; set; }
    public Guid Ramo { get; set; }
    public string Aseguradora { get; set; }
    public DateTimeOffset FechaEmision { get; set; }
    public DateTimeOffset FechaExpiracion { get; set; }
    public decimal ValorOriginal { get; set; }
    public decimal ValorActual { get; set; }
    public EstadoPoliza Estado { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }

}