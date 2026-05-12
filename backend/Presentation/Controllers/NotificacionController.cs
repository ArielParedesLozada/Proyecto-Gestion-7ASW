using Backend.App.Notificaciones;
using Backend.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Presentation.Controllers;

[ApiController]
[Route("notificaciones")]
public class NotificacionController(NotificacionService service) : ControllerBase
{
    private readonly NotificacionService _service = service;

    [HttpGet]
    [Authorize(Policy = "ACCESS-GRANTED")]
    public async Task<ActionResult> GetPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] EstadoNotificacion? estado = null,
        [FromQuery] TipoNotificacion? tipo = null
    )
    {
        var (items, total) = await _service.ObtenerPaginadoAsync(
            page,
            pageSize,
            search,
            estado,
            tipo
        );

        return Ok(new
        {
            total,
            page,
            pageSize,
            items
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
        var (items, total) = await _service.ObtenerPorPolizaIdAsync(
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