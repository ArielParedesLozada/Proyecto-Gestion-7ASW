namespace Backend.Presentation.Dtos.Responses;

public class EmpresaDtoResponse
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = null!;
    public string Email { get; set; } = null!;
}