using Backend.App.Polizas;
using Backend.Domain.Models;
using Backend.Presentation.Dtos.Requests;
using Backend.Presentation.Dtos.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Presentation.Controllers;

[ApiController]
[Route("aseguradoras")]
public class AseguradoraController(AseguradorasService aseguradoraService) : ControllerBase
{
    private readonly AseguradorasService _aseguradoraService = aseguradoraService;

    [HttpGet]
    [Authorize(Policy = "ACCESS-GRANTED")]
    public async Task<ActionResult<IEnumerable<AseguradoraDtoResponse>>> GetAll()
    {
        var aseguradoras = await _aseguradoraService.GetAllAseguradoras();
        return Ok(aseguradoras.Select(Map));
    }

    [HttpGet("{id}")]
    [Authorize(Policy = "ACCESS-GRANTED")]
    public async Task<ActionResult<AseguradoraDtoResponse>> GetById(Guid id)
    {
        var aseguradora = await _aseguradoraService.GetAseguradoraById(id);
        if (aseguradora == null)
            return NotFound();
        return Ok(Map(aseguradora));
    }

    [HttpPost]
    [Authorize(Policy = "ACCESS-GRANTED")]
    public async Task<ActionResult<AseguradoraDtoResponse>> Create([FromBody] AseguradoraRequest request)
    {
        var aseguradora = await _aseguradoraService.CreateAseguradora(request.Nombre, request.Email);
        return Ok(Map(aseguradora));
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "ACCESS-GRANTED")]
    public async Task<ActionResult<AseguradoraDtoResponse>> Update(Guid id, [FromBody] AseguradoraRequest request)
    {
        var aseguradora = await _aseguradoraService.UpdateAseguradora(id, request.Nombre, request.Email);
        if (aseguradora == null)
            return NotFound();
        return Ok(Map(aseguradora));
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "ACCESS-GRANTED")]
    public async Task<ActionResult<bool>> Delete(Guid id)
    {
        var result = await _aseguradoraService.DeleteAseguradora(id);
        return Ok(result);
    }

    private static AseguradoraDtoResponse Map(Aseguradora e) => new()
    {
        Id = e.Id,
        Nombre = e.Nombre,
        Email = e.Email
    };
}
