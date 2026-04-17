using System.ComponentModel.DataAnnotations;

namespace Backend.Presentation.Dtos.Requests;

public class EmpresaRequest
{
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [MaxLength(500)]
    public string Nombre { get; set; } = null!;

    [Required(ErrorMessage = "El correo es obligatorio.")]
    [EmailAddress(ErrorMessage = "El correo no tiene un formato válido.")]
    [MaxLength(320)]
    public string Email { get; set; } = null!;
}
