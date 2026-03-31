using Backend.App.Polizas;
using Backend.Domain.Models;
using Backend.Presentation.Dtos.Requests;
using Backend.Presentation.Dtos.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Presentation.Controllers;

[ApiController]
[Route("ramos")]
public class RamoController : ControllerBase
{
    private readonly RamoService _ramoService;

    public RamoController(RamoService ramoService)
    {
        _ramoService = ramoService;
    }

    [HttpGet]
    [Authorize(Policy = "ADMIN-ACCESS")]
    public async Task<ActionResult<IEnumerable<RamoDtoResponse>>> GetAll()
    {
        var ramos = await _ramoService.GetAllRamos();
        return Ok(ramos.Select(Map));
    }

    [HttpGet("{id}")]
    [Authorize(Policy = "ADMIN-ACCESS")]
    public async Task<ActionResult<RamoDtoResponse>> GetById(Guid id)
    {
        var ramo = await _ramoService.GetRamoById(id);
        return Ok(Map(ramo!));
    }

    [HttpPost]
    [Authorize(Policy = "ADMIN-ACCESS")]
    public async Task<ActionResult<RamoDtoResponse>> Create([FromBody] RamoRequest request)
    {
        var ramo = await _ramoService.CreateRamo(
            request.Nombre,
            request.CambiaValor,
            request.Descripcion
        );

        return Ok(Map(ramo));
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "ADMIN-ACCESS")]
    public async Task<ActionResult<RamoDtoResponse>> Update(Guid id, [FromBody] RamoRequest request)
    {
        var ramo = await _ramoService.UpdateRamo(
            id,
            request.Nombre,
            request.CambiaValor,
            request.Descripcion
        );

        return Ok(Map(ramo!));
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "ADMIN-ACCESS")]
    public async Task<ActionResult<bool>> Delete(Guid id)
    {
        var result = await _ramoService.DeleteRamo(id);
        return Ok(result);
    }

    private static RamoDtoResponse Map(Ramo r) => new()
    {
        Id = r.Id,
        Nombre = r.Nombre,
        CambiaValor = r.CambiaValor,
        Descripcion = r.Descripcion
    };
}