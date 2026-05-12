using System.ComponentModel.DataAnnotations;

namespace Backend.Presentation.Dtos.Requests;

public class EmpresaRequest
{
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [MaxLength(500)]
    public string Nombre { get; set; } = null!;
    [EmailAddress(ErrorMessage = "Email invalido")]
    public string? Email { get; set; }
}
