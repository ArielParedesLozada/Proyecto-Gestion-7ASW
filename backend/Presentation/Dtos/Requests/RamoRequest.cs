using System.ComponentModel.DataAnnotations;

namespace Backend.Presentation.Dtos.Requests;

public class RamoRequest
{
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [MaxLength(500)]
    public string Nombre { get; set; } = null!;

    public bool CambiaValor { get; set; }

    [Required(ErrorMessage = "La descripción es obligatoria.")]
    [MaxLength(2000)]
    public string Descripcion { get; set; } = null!;
}
