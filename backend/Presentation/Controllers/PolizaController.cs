using Backend.App.Dtos;
using Backend.App.Polizas;
using Backend.Presentation.Dtos.Requests;
using Backend.Presentation.Dtos.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Presentation.Controllers;

[ApiController]
[Route("polizas")]
public class PolizaController(
    PolizaService polizaService,
    PolizaExcelImportService excelImportService,
    PolizaPdfService polizaPdfService) : ControllerBase
{
    private readonly PolizaService _polizaService = polizaService;
    private readonly PolizaExcelImportService _excelImportService = excelImportService;
    private readonly PolizaPdfService _polizaPdfService = polizaPdfService;

    /// <summary>
    /// Rutas <c>import/*</c> antes de <c>{id:guid}</c> para evitar ambigüedad en el enrutador.
    /// Sin <see cref="FromFormAttribute"/> en <see cref="IFormFile"/>: Swashbuckle no lo documenta y lanza 500 al generar <c>swagger.json</c>.
    /// </summary>
    [HttpPost("import/preview")]
    [Authorize(Policy = "ACCESS-GRANTED")]
    [RequestSizeLimit(25_000_000)]
    public async Task<ActionResult<PolizaImportPreviewResponse>> ImportPreview(IFormFile? file)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { message = "Debes adjuntar un archivo Excel (.xlsx)." });

        await using var stream = file.OpenReadStream();
        var preview = await _excelImportService.PrevisualizarAsync(stream, file.FileName);
        return Ok(preview);
    }

    [HttpPost("import/confirm")]
    [Authorize(Policy = "ACCESS-GRANTED")]
    public async Task<ActionResult<PolizaImportResultResponse>> ImportConfirm([FromBody] PolizaImportConfirmRequest request)
    {
        var result = await _excelImportService.ConfirmarAsync(request.Token);
        return Ok(result);
    }

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

    [HttpGet("{id:guid}")]
    [Authorize(Policy = "ACCESS-GRANTED")]
    public async Task<ActionResult<PolizaDtoResponse>> GetById(Guid id)
    {
        var poliza = await _polizaService.ObtenerPorIdAsync(id);
        if (poliza == null)
            return NotFound();
        return Ok(Map(poliza));
    }

    /// <summary>Reporte PDF individual de la póliza (QuestPDF).</summary>
    [HttpGet("{id:guid}/pdf")]
    [Authorize(Policy = "ACCESS-GRANTED")]
    public async Task<IActionResult> GetPdf(Guid id)
    {
        var result = await _polizaPdfService.GenerarPdfAsync(id, DateTimeOffset.UtcNow);
        if (result == null)
            return NotFound();

        return File(result.Value.Bytes, "application/pdf", result.Value.FileName);
    }

    [HttpPost]
    [Authorize(Policy = "ACCESS-GRANTED")]
    public async Task<ActionResult<PolizaDtoResponse>> Create([FromBody] PolizaRequest request)
    {
        var poliza = await _polizaService.CrearAsync(request);
        return Ok(Map(poliza));
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = "ACCESS-GRANTED")]
    public async Task<ActionResult<PolizaDtoResponse>> Update(Guid id, [FromBody] PolizaUpdateRequest request)
    {
        var poliza = await _polizaService.ActualizarAsync(id, request);
        if (poliza == null)
            return NotFound();
        return Ok(Map(poliza));
    }

    private static PolizaDtoResponse Map(PolizaRes p) => new()
    {
        Id = p.Id,
        Numero = p.Numero,
        Obra = p.Obra,
        Aseguradora = p.Aseguradora,
        ContratistaId = p.ContratistaId,
        Contratista = p.ContratistaNombre,
        RamoId = p.RamoId,
        Ramo = p.RamoNombre,
        RamoCambiaValor = p.RamoCambiaValor,
        ValorOriginal = p.ValorOriginal,
        ValorActual = p.ValorActual,
        FechaEmision = p.FechaEmision,
        FechaExpiracion = p.FechaExpiracion,
        Observaciones = p.Observaciones,
        Estado = p.Estado
    };
}
