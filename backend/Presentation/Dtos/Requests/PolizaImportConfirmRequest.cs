using System.ComponentModel.DataAnnotations;

namespace Backend.Presentation.Dtos.Requests;

public class PolizaImportConfirmRequest
{
    [Required(ErrorMessage = "El token de previsualización es obligatorio.")]
    public Guid Token { get; set; }
}
