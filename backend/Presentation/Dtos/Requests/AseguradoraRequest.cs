using System.ComponentModel.DataAnnotations;

namespace Backend.Presentation.Dtos.Requests;

public class AseguradoraRequest
{
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [MaxLength(500)]
    public string Nombre { get; set; } = null!;

    [EmailAddress(ErrorMessage = "El correo no tiene un formato válido.")]
    public string? Email { get; set; } = null!;
}
