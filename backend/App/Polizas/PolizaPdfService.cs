namespace Backend.App.Polizas;

public class PolizaPdfService(PolizaService polizaService)
{
    private readonly PolizaService _polizaService = polizaService;

    /// <summary>Ruta del logo institucional copiado al directorio de salida.</summary>
    private static string LogoPath =>
        Path.Combine(AppContext.BaseDirectory, "Assets", "Gobierno.png");

    /// <returns>Bytes del PDF y nombre de archivo sugerido, o null si la póliza no existe.</returns>
    public async Task<(byte[] Bytes, string FileName)?> GenerarPdfAsync(Guid polizaId, DateTimeOffset generadoEnUtc)
    {
        var poliza = await _polizaService.ObtenerPorIdAsync(polizaId);
        if (poliza == null)
            return null;

        var bytes = PolizaPdfComposer.Generate(poliza, LogoPath, generadoEnUtc);
        var fileName = SanitizeFileName($"Poliza-{poliza.Numero}.pdf");
        return (bytes, fileName);
    }

    private static string SanitizeFileName(string name)
    {
        var invalid = Path.GetInvalidFileNameChars();
        var s = string.Join("_", name.Split(invalid, StringSplitOptions.RemoveEmptyEntries)).Trim();
        return string.IsNullOrEmpty(s) ? "Poliza.pdf" : s;
    }
}
