namespace Backend.App.Dtos;

public class AuditoriaRes
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }
    public string Username { get; set; } = null!;

    public string Tabla { get; set; } = null!;
    public Guid RegistroId { get; set; }
    public string Accion { get; set; } = null!;

    public string? DatosPrevios { get; set; }
    public string? DatosNuevos { get; set; }
}