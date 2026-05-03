namespace Backend.Infrastructure.Docs;

public class PolizaDocumentoDto
{
    public string Aseguradora { get; set; } = null!;
    public string Obra { get; set; } = null!;
    public string Contratista { get; set; } = null!;
    public string NumeroPoliza { get; set; } = null!;
    public decimal Valor { get; set; }
    public DateTimeOffset FechaRenovacion { get; set; }
    public DateTimeOffset FechaExpiracion { get; set; }
}