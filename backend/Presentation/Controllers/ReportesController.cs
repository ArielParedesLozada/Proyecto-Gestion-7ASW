using Backend.App.Reportes;
using Backend.App.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Presentation.Controllers;

[ApiController]
[Route("reportes")]
public class ReportesController(ControlMaestroService controlMaestroService) : ControllerBase
{
    private readonly ControlMaestroService _controlMaestroService = controlMaestroService;

    [HttpGet("control-maestro")]
    [Authorize(Policy = "ACCESS-GRANTED")]
    public async Task<ActionResult<ControlMaestroRes>> GetControlMaestro(
        [FromQuery] int pageVigentes = 1,
        [FromQuery] int pageSizeVigentes = 10,
        [FromQuery] int pageVencidas = 1,
        [FromQuery] int pageSizeVencidas = 10,
        [FromQuery] decimal saldoInicial = 0
    )
    {
        var result = await _controlMaestroService.ObtenerControlMaestroAsync(
            pageVigentes,
            pageSizeVigentes,
            pageVencidas,
            pageSizeVencidas,
            saldoInicial
        );

        return Ok(result);
    }

    [HttpGet("control-maestro/pdf")]
    [Authorize(Policy = "ACCESS-GRANTED")]
    public async Task<IActionResult> GetControlMaestroPdf(
        [FromQuery] int pageVigentes,
        [FromQuery] int pageSizeVigentes,
        [FromQuery] int pageVencidas,
        [FromQuery] int pageSizeVencidas,
        [FromQuery] decimal saldoInicial
    )
    {
        var (Bytes, FileName) = await _controlMaestroService.GenerarPdfAsync(
            saldoInicial,
            DateTimeOffset.UtcNow
        );

        return File(Bytes, "application/pdf", FileName);
    }
}