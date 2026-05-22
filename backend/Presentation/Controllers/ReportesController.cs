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
        [FromQuery] decimal saldoInicial = 0,
        [FromQuery] DateTimeOffset? fechaInicio = null,
        [FromQuery] DateTimeOffset? fechaFin = null,
        [FromQuery] Guid? ramoId = null
    )
    {
        var result = await _controlMaestroService.ObtenerControlMaestroAsync(
                        pageVigentes,
                        pageSizeVigentes,
                        pageVencidas,
                        pageSizeVencidas,
                        saldoInicial,
                        fechaInicio,
                        fechaFin,
                        ramoId
                    );

        return Ok(result);
    }

    [HttpGet("control-maestro/pdf")]
    [Authorize(Policy = "ACCESS-GRANTED")]
    public async Task<IActionResult> GetControlMaestroPdf(
        [FromQuery] decimal saldoInicial,
        [FromQuery] DateTimeOffset? fechaInicio,
        [FromQuery] DateTimeOffset? fechaFin,
        [FromQuery] Guid? ramoId
    )
    {
        var (Bytes, FileName) = await _controlMaestroService.GenerarPdfAsync(
            saldoInicial,
            DateTimeOffset.UtcNow,
            fechaInicio,
            fechaFin,
            ramoId
        );

        return File(Bytes, "application/pdf", FileName);
    }
}