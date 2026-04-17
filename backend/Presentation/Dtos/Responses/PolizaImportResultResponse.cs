namespace Backend.Presentation.Dtos.Responses;

public class PolizaImportResultResponse
{
    public int Inserted { get; set; }
    public int Updated { get; set; }
    public int Failed { get; set; }
    public IReadOnlyList<PolizaImportResultErrorDto> Errors { get; set; } = Array.Empty<PolizaImportResultErrorDto>();
}

public class PolizaImportResultErrorDto
{
    public int ExcelRow { get; set; }
    public string SheetName { get; set; } = "";
    public string NumeroPoliza { get; set; } = "";
    public string Message { get; set; } = "";
}
