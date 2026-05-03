namespace Backend.App.Dtos;

public class ControlMaestroRes
{
    public PagedResult<PolizaRes> Vigentes { get; set; } = null!;
    public PagedResult<PolizaRes> Vencidas { get; set; } = null!;
    public decimal TotalVigentes { get; set; }
    public decimal TotalVencidas { get; set; }
    public decimal SaldoInicial { get; set; }
    public decimal CuadreTotal { get; set; }
}