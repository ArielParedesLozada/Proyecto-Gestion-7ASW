namespace Backend.Domain.Models;

public class Auditoria
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User UsuarioNav { get; set; } = null!;
    public string? Tabla { get; set; }
    public Guid RegistroId { get; set; }
    public string? Accion { get; set; }
    public string? DatosPrevios { get; set; }
    public string? DatosNuevos { get; set; }
}