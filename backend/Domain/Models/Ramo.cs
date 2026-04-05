namespace Backend.Domain.Models;

public class Ramo
{
    public Guid Id { get; set; }
    public string Nombre { get; set; }
    public bool CambiaValor { get; set; }
    public string Descripcion { get; set; }
}