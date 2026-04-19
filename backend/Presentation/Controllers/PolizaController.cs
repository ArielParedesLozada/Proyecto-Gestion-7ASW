using Backend.App.Dtos;
using Backend.App.Polizas;
using Backend.Domain.Models;
using Backend.Presentation.Dtos.Requests;
using Backend.Presentation.Dtos.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Presentation.Controllers;

[ApiController]
[Route("polizas")]
public class PolizaController(PolizaService polizaService) : ControllerBase
{
    private readonly PolizaService _polizaService = polizaService;

    // ✅ GET paginado + búsqueda
    [HttpGet]
    [Authorize(Policy = "ACCESS-GRANTED")]
    public async Task<ActionResult<PagedDtoResponse<PolizaDtoResponse>>> GetPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null)
    {
        var (items, total) = await _polizaService.ObtenerPaginadoAsync(page, pageSize, search);

        return Ok(new PagedDtoResponse<PolizaDtoResponse>
        {
            Items = items.Select(Map),
            TotalCount = total
        });
    }

    // ✅ GET por Id
    [HttpGet("{id}")]
    [Authorize(Policy = "ACCESS-GRANTED")]
    public async Task<ActionResult<PolizaDtoResponse>> GetById(Guid id)
    {
        var poliza = await _polizaService.ObtenerPorIdAsync(id);
        return Ok(Map(poliza!));
    }

    // ✅ POST crear
    [HttpPost]
    [Authorize(Policy = "ACCESS-GRANTED")]
    public async Task<ActionResult<PolizaDtoResponse>> Create([FromBody] PolizaRequest request)
    {
        var poliza = await _polizaService.CrearAsync(request);
        return Ok(Map(poliza));
    }

    // 🔁 Mapper
    private static PolizaDtoResponse Map(PolizaRes p) => new()
    {
        Id = p.Id,
        Numero = p.Numero,
        Obra = p.Obra,
        Aseguradora = p.Aseguradora,
        ValorOriginal = p.ValorOriginal,
        ValorActual = p.ValorActual,
        FechaEmision = p.FechaEmision,
        FechaExpiracion = p.FechaExpiracion,
        Estado = p.Estado,
        Contratista = p.ContratistaNombre,
        Ramo = p.RamoNombre
    };
}