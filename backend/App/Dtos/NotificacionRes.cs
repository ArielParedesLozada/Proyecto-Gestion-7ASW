using Backend.Domain.Enums;

namespace Backend.App.Dtos;

public class NotificacionRes
{
    public Guid Id { get; set; }

    public Guid PolizaId { get; set; }
    public string NumeroPoliza { get; set; } = null!;
    public string Obra { get; set; } = null!;

    public Guid RenovacionId { get; set; }
    public DateTimeOffset FechaRenovacion { get; set; }
    public DateTimeOffset FechaExpiracion { get; set; }

    public EstadoNotificacion Estado { get; set; }
    public TipoNotificacion Tipo { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? FechaEnvio { get; set; }
}