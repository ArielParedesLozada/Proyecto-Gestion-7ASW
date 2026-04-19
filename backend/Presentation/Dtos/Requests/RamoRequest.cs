namespace Backend.Presentation.Dtos.Requests;

public class RamoRequest
{
    public string Nombre { get; set; } = null!;
    public bool CambiaValor { get; set; }
    public string Descripcion { get; set; } = null!;
}