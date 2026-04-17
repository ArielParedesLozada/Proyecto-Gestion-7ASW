namespace Backend.Presentation.Dtos.Responses;

public class PolizaImportPreviewResponse
{
    public Guid Token { get; set; }
    public string FileName { get; set; } = "";
    public int TotalRows { get; set; }
    public int ValidRows { get; set; }
    public int ErrorRows { get; set; }
    public int IncompleteRows { get; set; }
    public int InsertCount { get; set; }
    public int UpdateCount { get; set; }
    public IReadOnlyList<string> SheetsDetected { get; set; } = Array.Empty<string>();
    public IReadOnlyList<PolizaImportPreviewRowDto> Items { get; set; } = Array.Empty<PolizaImportPreviewRowDto>();
    public IReadOnlyList<PolizaImportSheetSummaryDto> Sheets { get; set; } = Array.Empty<PolizaImportSheetSummaryDto>();
}

public class PolizaImportSheetSummaryDto
{
    public string Name { get; set; } = "";
    public int RowCount { get; set; }
}

public class PolizaImportPreviewRowDto
{
    public int ExcelRow { get; set; }
    public string SheetName { get; set; } = "";
    public string NumeroPoliza { get; set; } = "";
    public string Contratista { get; set; } = "";
    public string Ramo { get; set; } = "";
    public string Aseguradora { get; set; } = "";
    public string? FechaEmision { get; set; }
    public string? FechaExpiracion { get; set; }
    /// <summary>paraInsertar, paraActualizar, error, incompleta</summary>
    public string EstadoAnalisis { get; set; } = "";
    /// <summary>existente, seCreara, ambiguo, sinNombre</summary>
    public string EmpresaResolucion { get; set; } = "";
    public IReadOnlyList<string> Mensajes { get; set; } = Array.Empty<string>();
}
