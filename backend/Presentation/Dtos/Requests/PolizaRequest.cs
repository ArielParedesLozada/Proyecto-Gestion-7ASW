namespace Backend.Presentation.Dtos.Requests;

public class PolizaRequest
{
    public string Numero { get; set; } = null!;
    public Guid Contratista { get; set; }
    public string Obra { get; set; } = null!;
    public Guid Ramo { get; set; }
    public string Aseguradora { get; set; } = null!;
    public DateTimeOffset FechaEmision { get; set; }
    public DateTimeOffset FechaExpiracion { get; set; }
    public decimal ValorOriginal { get; set; }
}
