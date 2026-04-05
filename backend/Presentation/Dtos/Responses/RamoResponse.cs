namespace Backend.Presentation.Dtos.Responses;

public class RamoDtoResponse
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = null!;
    public bool CambiaValor { get; set; }
    public string Descripcion { get; set; } = null!;
}