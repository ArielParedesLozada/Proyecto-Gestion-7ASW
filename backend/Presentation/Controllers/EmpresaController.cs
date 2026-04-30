using Backend.App.Polizas;
using Backend.Domain.Models;
using Backend.Presentation.Dtos.Requests;
using Backend.Presentation.Dtos.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Presentation.Controllers;

[ApiController]
[Route("empresas")]
public class EmpresaController(EmpresasService empresaService) : ControllerBase
{
    private readonly EmpresasService _empresaService = empresaService;

    [HttpGet]
    [Authorize(Policy = "ACCESS-GRANTED")]
    public async Task<ActionResult<IEnumerable<EmpresaDtoResponse>>> GetAll()
    {
        var empresas = await _empresaService.GetAllEmpresas();
        return Ok(empresas.Select(Map));
    }

    [HttpGet("{id}")]
    [Authorize(Policy = "ACCESS-GRANTED")]
    public async Task<ActionResult<EmpresaDtoResponse>> GetById(Guid id)
    {
        var empresa = await _empresaService.GetEmpresaById(id);
        if (empresa == null)
            return NotFound();
        return Ok(Map(empresa));
    }

    [HttpPost]
    [Authorize(Policy = "ACCESS-GRANTED")]
    public async Task<ActionResult<EmpresaDtoResponse>> Create([FromBody] EmpresaRequest request)
    {
        var empresa = await _empresaService.CreateEmpresa(request.Nombre, request.Email);
        return Ok(Map(empresa));
    }

    [HttpPut("{id}")]
    [Authorize(Policy = "ACCESS-GRANTED")]
    public async Task<ActionResult<EmpresaDtoResponse>> Update(Guid id, [FromBody] EmpresaRequest request)
    {
        var empresa = await _empresaService.UpdateEmpresa(id, request.Nombre);
        if (empresa == null)
            return NotFound();
        return Ok(Map(empresa));
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = "ACCESS-GRANTED")]
    public async Task<ActionResult<bool>> Delete(Guid id)
    {
        var result = await _empresaService.DeleteEmpresa(id);
        return Ok(result);
    }

    private static EmpresaDtoResponse Map(Empresa e) => new()
    {
        Id = e.Id,
        Nombre = e.Nombre
    };
}
