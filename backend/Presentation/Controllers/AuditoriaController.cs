using Backend.App.Auditorias;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Presentation.Controllers;

[ApiController]
[Route("auditorias")]
public class AuditoriaController(AuditoriaQueryService service) : ControllerBase
{
    private readonly AuditoriaQueryService _service = service;

    [HttpGet]
    [Authorize(Policy = "ACCESS-GRANTED")]
    public async Task<ActionResult> GetPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null,
        [FromQuery] string? tabla = null,
        [FromQuery] Guid? userId = null
    )
    {
        var (items, total) = await _service.ObtenerPaginadoAsync(
            page,
            pageSize,
            search,
            tabla,
            userId
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