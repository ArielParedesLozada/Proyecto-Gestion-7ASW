using Backend.App.Renovaciones;
using Backend.App.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Backend.Presentation.Dtos.Requests;

namespace Backend.Presentation.Controllers;

[ApiController]
[Route("renovaciones")]
public class RenovacionController(
    RenovacionService renovacionService,
    ValidateRenovacionService validateService) : ControllerBase
{
    private readonly RenovacionService _renovacionService = renovacionService;
    private readonly ValidateRenovacionService _validateService = validateService;

    [HttpGet]
    [Authorize(Policy = "ACCESS-GRANTED")]
    public async Task<ActionResult> GetPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] DateTimeOffset? fechaDesde = null,
        [FromQuery] DateTimeOffset? fechaHasta = null
    )
    {
        var (items, total) =
            await _renovacionService.ObtenerPaginadoAsync(
                page,
                pageSize,
                search,
                fechaDesde,
                fechaHasta
            );
        return Ok(new
        {
            total,
            page,
            pageSize,
            items
        });
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = "ACCESS-GRANTED")]
    public async Task<ActionResult<RenovacionRes>>
        GetById(Guid id)
    {
        var renovacion = await _renovacionService.ObtenerPorIdAsync(id);
        return Ok(renovacion);
    }

    // POST /renovaciones/{id}/validar
    [HttpPost("{id:guid}/validar")]
    [Authorize(Policy = "ACCESS-GRANTED")]
    public async Task<ActionResult> Validar(Guid id, [FromBody] ValidateRenovacionRequest request
    )
    {
        var renovacion = await _validateService.ValidateRenovacion(id, request.NuevoValor);
        return Ok(new
        {
            message = "Renovación validada correctamente",
            renovacionId = renovacion.Id
        });
    }

    // POST /renovaciones/{id}/rechazar
    [HttpPost("{id:guid}/rechazar")]
    [Authorize(Policy = "ACCESS-GRANTED")]
    public async Task<ActionResult> Rechazar(Guid id)
    {
        var renovacion = await _validateService.RejectRenovacion(id);
        return Ok(new
        {
            message = "Renovación rechazada correctamente",
            renovacionId = renovacion.Id
        });
    }
    [HttpGet("poliza/{polizaId:guid}")]
    [Authorize(Policy = "ACCESS-GRANTED")]
    public async Task<ActionResult> GetByPolizaId(
        Guid polizaId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10
    )
    {
        var (items, total) = await _renovacionService.ObtenerPorPolizaIdAsync(
                    polizaId,
                    page,
                    pageSize
                );
        return Ok(new
        {
            total,
            page,
            pageSize,
            items
        });
    }
}