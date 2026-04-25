using Backend.Domain.Enums;

namespace Backend.Domain.Models;

public class Notificacion
{
    public Guid Id { get; set; }
    public Guid PolizaId { get; set; }
    public Poliza PolizaNav { get; set; } = null!;
    public EstadoNotificacion Estado { get; set; }
    public TipoNotificacion Tipo { get; set; }
    public DateTimeOffset FechaEnvio { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}