using System.ComponentModel.DataAnnotations;

namespace Backend.Presentation.Dtos.Requests;

public class PolizaUpdateRequest
{
    [Required(ErrorMessage = "El contratista es obligatorio.")]
    public Guid Contratista { get; set; }

    [Required(ErrorMessage = "La obra es obligatoria.")]
    [MaxLength(500)]
    public string Obra { get; set; } = null!;

    [Required(ErrorMessage = "El ramo es obligatorio.")]
    public Guid Ramo { get; set; }

    [Required(ErrorMessage = "La aseguradora es obligatoria.")]
    [MaxLength(200)]
    public string Aseguradora { get; set; } = null!;

    [Required(ErrorMessage = "La fecha de emisión es obligatoria.")]
    public DateTimeOffset FechaEmision { get; set; }

    [Required(ErrorMessage = "La fecha de expiración es obligatoria.")]
    public DateTimeOffset FechaExpiracion { get; set; }

    [Range(typeof(decimal), "0", "79228162514264337593543950335", ErrorMessage = "El valor original debe ser mayor o igual a cero.")]
    public decimal ValorOriginal { get; set; }

    [Range(typeof(decimal), "0", "79228162514264337593543950335", ErrorMessage = "El valor actual debe ser mayor o igual a cero.")]
    public decimal ValorActual { get; set; }
}
