using System.Globalization;
using System.Text;
using Backend.Data.Databases;
using Backend.Domain.Errors;
using Backend.Domain.Models;
using Backend.Presentation.Dtos.Responses;
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace Backend.App.Polizas;

public class PolizaExcelImportService(
    AppDatabase context,
    EmpresasService empresasService,
    IMemoryCache cache)
{
    private readonly AppDatabase _context = context;
    private readonly EmpresasService _empresasService = empresasService;
    private readonly IMemoryCache _cache = cache;

    private static readonly MemoryCacheEntryOptions SessionOptions = new()
    {
        SlidingExpiration = TimeSpan.FromMinutes(30),
    };

    private static string CacheKey(Guid token) => $"poliza-import:{token}";

    public async Task<PolizaImportPreviewResponse> PrevisualizarAsync(Stream excelStream, string fileName)
    {
        if (excelStream == null || !excelStream.CanRead)
            throw new CustomError("No se recibió un archivo válido.", 400);

        var name = string.IsNullOrWhiteSpace(fileName) ? "archivo.xlsx" : fileName.Trim();
        if (!name.EndsWith(".xlsx", StringComparison.OrdinalIgnoreCase))
            throw new CustomError("El archivo debe ser Excel (.xlsx).", 400);

        List<Ramo> ramos;
        List<Empresa> empresas;
        try
        {
            ramos = await _context.Ramos.AsNoTracking().ToListAsync();
            empresas = await _context.Empresas.AsNoTracking().ToListAsync();
        }
        catch (Exception ex)
        {
            throw new CustomError($"No se pudieron cargar ramos y empresas: {ex.Message}", 500);
        }

        List<ImportPreviewRowInternal> rows;
        List<string> sheetsDetected;
        try
        {
            using var wb = new XLWorkbook(excelStream);
            (rows, sheetsDetected) = ParseWorkbook(wb, ramos, empresas);
        }
        catch (CustomError)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new CustomError($"No se pudo leer el Excel: {ex.Message}", 400);
        }

        MarkDuplicateNumerosEnArchivo(rows);
        FinalizeStatuses(rows);

        var numeros = rows
            .Where(r => !string.IsNullOrWhiteSpace(r.NumeroPoliza))
            .Select(r => r.NumeroPoliza.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var existentesPorNumero = await CargarPolizasExistentesPorNumeroAsync(numeros);
        foreach (var r in rows)
        {
            if (string.IsNullOrWhiteSpace(r.NumeroPoliza))
                continue;
            var n = r.NumeroPoliza.Trim();
            if (existentesPorNumero.TryGetValue(n, out var id))
                r.PolizaExistenteId = id;
        }

        ApplyExistenceAndValidation(rows, ramos, empresas);

        var token = Guid.NewGuid();
        var session = new PolizaImportSession
        {
            FileName = name,
            CreatedAt = DateTimeOffset.UtcNow,
            Rows = rows,
        };
        _cache.Set(CacheKey(token), session, SessionOptions);

        return MapPreviewResponse(token, name, sheetsDetected, rows);
    }

    public async Task<PolizaImportResultResponse> ConfirmarAsync(Guid token)
    {
        if (!_cache.TryGetValue(CacheKey(token), out PolizaImportSession? session) || session == null)
        {
            throw new CustomError(
                "La sesión de importación expiró o no es válida. Vuelve a cargar el archivo para previsualizar de nuevo.",
                400);
        }

        var aplicables = session.Rows.Where(r => r.PuedeAplicar).ToList();
        if (aplicables.Count == 0)
            throw new CustomError("No hay filas válidas para importar en esta sesión.", 400);

        var resultado = new PolizaImportResultResponse();
        var errores = new List<PolizaImportResultErrorDto>();

        var ramos = await _context.Ramos.AsNoTracking().ToListAsync();
        var creadasPorNombre = new Dictionary<string, Guid>(StringComparer.OrdinalIgnoreCase);

        try
        {
            foreach (var row in aplicables)
            {
                var ramo = ramos.First(r => r.Id == row.RamoId!.Value);
                await using var tx = await _context.Database.BeginTransactionAsync();
                try
                {
                    var empresaId = await ResolverOcrearEmpresaAsync(row, creadasPorNombre);
                    PolizaFechaValidacion.ValidarEmisionYExpiracion(row.FechaEmision!.Value, row.FechaExpiracion!.Value);

                    var valor = row.Valor ?? 0;
                    var valorActual = valor;

                    if (row.PolizaExistenteId != null && row.EstadoAnalisis == "paraActualizar")
                    {
                        var entity = await _context.Polizas.FirstOrDefaultAsync(p => p.Id == row.PolizaExistenteId);
                        if (entity == null)
                        {
                            errores.Add(new PolizaImportResultErrorDto
                            {
                                ExcelRow = row.ExcelRow,
                                SheetName = row.SheetName,
                                NumeroPoliza = row.NumeroPoliza,
                                Message = "La póliza ya no existe en la base de datos.",
                            });
                            resultado.Failed++;
                            await tx.RollbackAsync();
                            continue;
                        }

                        entity.Contratista = empresaId;
                        entity.Obra = row.Obra!.Trim();
                        entity.Ramo = ramo.Id;
                        entity.Aseguradora = row.Aseguradora!.Trim();
                        entity.FechaEmision = row.FechaEmision!.Value;
                        entity.FechaExpiracion = row.FechaExpiracion!.Value;
                        entity.ValorOriginal = valor;
                        entity.ValorActual = valorActual;
                        entity.Estado = PolizaEstadoDerivadoHelper.EstadoPersistido(
                            row.FechaExpiracion!.Value,
                            DateTimeOffset.UtcNow);
                        entity.UpdatedAt = DateTimeOffset.UtcNow;
                        await _context.SaveChangesAsync();
                        await tx.CommitAsync();
                        resultado.Updated++;
                    }
                    else
                    {
                        var poliza = new Poliza
                        {
                            Id = Guid.NewGuid(),
                            Numero = row.NumeroPoliza.Trim(),
                            Contratista = empresaId,
                            Obra = row.Obra!.Trim(),
                            Ramo = ramo.Id,
                            Aseguradora = row.Aseguradora!.Trim(),
                            FechaEmision = row.FechaEmision!.Value,
                            FechaExpiracion = row.FechaExpiracion!.Value,
                            ValorOriginal = valor,
                            ValorActual = valorActual,
                            Estado = PolizaEstadoDerivadoHelper.EstadoPersistido(
                                row.FechaExpiracion!.Value,
                                DateTimeOffset.UtcNow),
                            CreatedAt = DateTimeOffset.UtcNow,
                            UpdatedAt = DateTimeOffset.UtcNow,
                        };
                        _context.Polizas.Add(poliza);
                        await _context.SaveChangesAsync();
                        await tx.CommitAsync();
                        resultado.Inserted++;
                    }
                }
                catch (Exception ex)
                {
                    await tx.RollbackAsync();
                    var msg = ex is CustomError ce ? ce.Message : ex.Message;
                    errores.Add(new PolizaImportResultErrorDto
                    {
                        ExcelRow = row.ExcelRow,
                        SheetName = row.SheetName,
                        NumeroPoliza = row.NumeroPoliza,
                        Message = msg,
                    });
                    resultado.Failed++;
                }
            }
        }
        finally
        {
            _cache.Remove(CacheKey(token));
        }

        resultado.Errors = errores;
        return resultado;
    }

    private async Task<Guid> ResolverOcrearEmpresaAsync(ImportPreviewRowInternal row, Dictionary<string, Guid> creadasPorNombre)
    {
        var key = row.Contratista.Trim();
        if (row.EmpresaIdExistente != null)
            return row.EmpresaIdExistente.Value;

        if (creadasPorNombre.TryGetValue(key, out var id))
            return id;

        if (string.IsNullOrEmpty(row.EmailProvisional))
            throw new CustomError("No se pudo resolver el contratista.", 400);

        var creada = await _empresasService.CreateEmpresa(key, row.EmailProvisional);
        creadasPorNombre[key] = creada.Id;
        return creada.Id;
    }

    private async Task<Dictionary<string, Guid>> CargarPolizasExistentesPorNumeroAsync(IReadOnlyList<string> numeros)
    {
        if (numeros.Count == 0)
            return new Dictionary<string, Guid>(StringComparer.OrdinalIgnoreCase);

        var list = await _context.Polizas.AsNoTracking()
            .Where(p => numeros.Contains(p.Numero))
            .Select(p => new { p.Numero, p.Id })
            .ToListAsync();

        return list.ToDictionary(x => x.Numero, x => x.Id, StringComparer.OrdinalIgnoreCase);
    }

    private static void MarkDuplicateNumerosEnArchivo(List<ImportPreviewRowInternal> rows)
    {
        var groups = rows
            .Where(r => !string.IsNullOrWhiteSpace(r.NumeroPoliza))
            .GroupBy(r => r.NumeroPoliza.Trim(), StringComparer.OrdinalIgnoreCase);
        foreach (var g in groups.Where(x => x.Count() > 1))
        {
            foreach (var r in g)
                r.Mensajes.Add("El número de póliza está duplicado en este archivo.");
        }
    }

    private static void FinalizeStatuses(List<ImportPreviewRowInternal> rows)
    {
        foreach (var r in rows)
        {
            if (r.Mensajes.Any(m => m.Contains("duplicado", StringComparison.OrdinalIgnoreCase)))
                r.EstadoAnalisis = "error";
        }
    }

    private void ApplyExistenceAndValidation(
        List<ImportPreviewRowInternal> rows,
        List<Ramo> ramos,
        List<Empresa> empresas)
    {
        foreach (var r in rows)
        {
            if (r.EstadoAnalisis == "error")
            {
                r.PuedeAplicar = false;
                continue;
            }

            r.Mensajes.Clear();
            if (string.IsNullOrWhiteSpace(r.NumeroPoliza))
                r.Mensajes.Add("Falta el número de póliza.");
            if (string.IsNullOrWhiteSpace(r.Contratista))
                r.Mensajes.Add("Falta el contratista.");
            if (string.IsNullOrWhiteSpace(r.Obra))
                r.Mensajes.Add("Falta la obra o proyecto.");
            if (string.IsNullOrWhiteSpace(r.Aseguradora))
                r.Mensajes.Add("Falta la aseguradora.");
            if (r.Valor == null || r.Valor < 0)
                r.Mensajes.Add("El valor no es válido.");
            if (r.FechaEmision == null)
                r.Mensajes.Add("Falta la fecha de emisión o no es válida.");
            if (r.FechaExpiracion == null)
                r.Mensajes.Add("Falta la vigencia (fecha hasta) o no es válida.");

            if (r.RamoId == null)
                r.Mensajes.Add("No se pudo resolver el ramo (columna o nombre de hoja).");

            var emp = ResolverEmpresa(r.Contratista, empresas);
            r.EmpresaResolucion = emp.Kind;
            r.EmpresaIdExistente = emp.IdExistente;
            r.EmailProvisional = emp.EmailProvisional;
            if (emp.Kind == "ambiguo")
                r.Mensajes.Add("Varias empresas coinciden con el nombre del contratista; usa el nombre exacto registrado.");

            if (r.Mensajes.Count > 0)
            {
                r.EstadoAnalisis = r.Mensajes.Any(m => m.Contains("Falta", StringComparison.OrdinalIgnoreCase))
                    ? "incompleta"
                    : "error";
                r.PuedeAplicar = false;
                continue;
            }

            try
            {
                PolizaFechaValidacion.ValidarEmisionYExpiracion(r.FechaEmision!.Value, r.FechaExpiracion!.Value);
            }
            catch (CustomError e)
            {
                r.Mensajes.Add(e.Message);
                r.EstadoAnalisis = "error";
                r.PuedeAplicar = false;
                continue;
            }

            if (r.PolizaExistenteId != null)
            {
                r.EstadoAnalisis = "paraActualizar";
                r.PuedeAplicar = true;
            }
            else
            {
                r.EstadoAnalisis = "paraInsertar";
                r.PuedeAplicar = true;
            }
        }
    }

    private static (string Kind, Guid? IdExistente, string? EmailProvisional) ResolverEmpresa(
        string? nombre,
        List<Empresa> empresas)
    {
        if (string.IsNullOrWhiteSpace(nombre))
            return ("sinNombre", null, null);

        var t = nombre.Trim();
        var exact = empresas.FirstOrDefault(e => string.Equals(e.Nombre.Trim(), t, StringComparison.OrdinalIgnoreCase));
        if (exact != null)
            return ("existente", exact.Id, null);

        var candidates = empresas
            .Where(e => e.Nombre.Contains(t, StringComparison.OrdinalIgnoreCase))
            .ToList();
        if (candidates.Count == 1)
            return ("existente", candidates[0].Id, null);
        if (candidates.Count > 1)
            return ("ambiguo", null, null);

        var email = $"import-{Guid.NewGuid():N}@import.sicop.local";
        return ("seCreara", null, email);
    }

    private static PolizaImportPreviewResponse MapPreviewResponse(
        Guid token,
        string fileName,
        List<string> sheetsDetected,
        List<ImportPreviewRowInternal> rows)
    {
        var insert = rows.Count(r => r.EstadoAnalisis == "paraInsertar");
        var update = rows.Count(r => r.EstadoAnalisis == "paraActualizar");
        var err = rows.Count(r => r.EstadoAnalisis == "error");
        var incom = rows.Count(r => r.EstadoAnalisis == "incompleta");
        var valid = insert + update;

        var sheetSummaries = rows
            .GroupBy(r => r.SheetName)
            .Select(g => new PolizaImportSheetSummaryDto { Name = g.Key, RowCount = g.Count() })
            .ToList();

        var items = rows.Select(r => new PolizaImportPreviewRowDto
        {
            ExcelRow = r.ExcelRow,
            SheetName = r.SheetName,
            NumeroPoliza = r.NumeroPoliza,
            Contratista = r.Contratista,
            Ramo = r.RamoNombre,
            Aseguradora = r.Aseguradora,
            FechaEmision = r.FechaEmision?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            FechaExpiracion = r.FechaExpiracion?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            EstadoAnalisis = r.EstadoAnalisis,
            EmpresaResolucion = r.EmpresaResolucion,
            Mensajes = r.Mensajes.ToList(),
        }).ToList();

        return new PolizaImportPreviewResponse
        {
            Token = token,
            FileName = fileName,
            TotalRows = rows.Count,
            ValidRows = valid,
            ErrorRows = err,
            IncompleteRows = incom,
            InsertCount = insert,
            UpdateCount = update,
            SheetsDetected = sheetsDetected,
            Sheets = sheetSummaries,
            Items = items,
        };
    }

    private static (List<ImportPreviewRowInternal> rows, List<string> sheets) ParseWorkbook(
        XLWorkbook wb,
        IReadOnlyList<Ramo> ramos,
        IReadOnlyList<Empresa> _)
    {
        var rows = new List<ImportPreviewRowInternal>();
        var sheets = new List<string>();

        foreach (var ws in wb.Worksheets)
        {
            if (ws.Visibility != XLWorksheetVisibility.Visible)
                continue;

            var sheetName = ws.Name.Trim();
            if (string.IsNullOrEmpty(sheetName))
                continue;

            sheets.Add(sheetName);
            var defaultRamo = DefaultRamoFromSheetName(sheetName);

            var header = FindHeaderRow(ws);
            if (header == null)
                continue;

            var (headerRow, colMap) = header.Value;
            var lastRow = ws.LastRowUsed()?.RowNumber() ?? headerRow;
            for (var r = headerRow + 1; r <= lastRow; r++)
            {
                var row = ws.Row(r);
                if (IsRowEmpty(row, colMap))
                    continue;

                var internalRow = ReadDataRow(ws, r, colMap, defaultRamo, ramos);
                rows.Add(internalRow);
            }
        }

        if (rows.Count == 0)
            throw new CustomError(
                "No se encontraron filas de datos con encabezados reconocibles. Revisa las hojas y los nombres de columnas.",
                400);

        return (rows, sheets);
    }

    private static bool IsRowEmpty(IXLRow row, Dictionary<string, int> colMap)
    {
        foreach (var col in colMap.Values)
        {
            var c = row.Cell(col);
            if (!c.IsEmpty() && !string.IsNullOrWhiteSpace(c.GetString()))
                return false;
            if (c.DataType == XLDataType.Number && c.TryGetValue<double>(out var d) && Math.Abs(d) > double.Epsilon)
                return false;
        }

        return true;
    }

    private static ImportPreviewRowInternal ReadDataRow(
        IXLWorksheet ws,
        int excelRow,
        Dictionary<string, int> colMap,
        string? defaultRamoCanonical,
        IReadOnlyList<Ramo> ramos)
    {
        string? G(string key) =>
            colMap.TryGetValue(key, out var col) ? GetCellStringTrim(ws.Cell(excelRow, col)) : null;

        var numero = G("numero") ?? "";
        var contratista = G("contratista") ?? "";
        var obra = G("obra") ?? "";
        var ramoCol = G("ramo");
        var aseguradora = G("aseguradora") ?? "";

        DateTime? fe = null, fv = null;
        if (colMap.TryGetValue("fechaEmision", out var cfe))
            TryParseDateFromCell(ws.Cell(excelRow, cfe), out fe);
        if (colMap.TryGetValue("vigenciaHasta", out var cfv))
            TryParseDateFromCell(ws.Cell(excelRow, cfv), out fv);

        decimal? valor = null;
        if (colMap.TryGetValue("valor", out var vcol))
            TryParseDecimalFromCell(ws.Cell(excelRow, vcol), out valor);

        var ramoResolved = ResolverRamoNombre(ramoCol, defaultRamoCanonical, ramos);

        DateTimeOffset? em = fe.HasValue ? ToMedioDiaColombia(fe.Value) : null;
        DateTimeOffset? ex = fv.HasValue ? ToMedioDiaColombia(fv.Value) : null;

        return new ImportPreviewRowInternal
        {
            ExcelRow = excelRow,
            SheetName = ws.Name.Trim(),
            NumeroPoliza = numero,
            Contratista = contratista,
            Obra = obra,
            Aseguradora = aseguradora,
            RamoNombre = ramoResolved.Nombre ?? "",
            RamoId = ramoResolved.Id,
            Valor = valor,
            FechaEmision = em,
            FechaExpiracion = ex,
            EstadoAnalisis = "incompleta",
            EmpresaResolucion = "sinNombre",
        };
    }

    private static (Guid? Id, string? Nombre) ResolverRamoNombre(
        string? ramoColumna,
        string? defaultRamoCanonical,
        IReadOnlyList<Ramo> ramos)
    {
        var target = !string.IsNullOrWhiteSpace(ramoColumna) ? ramoColumna.Trim() : defaultRamoCanonical;
        if (string.IsNullOrWhiteSpace(target))
            return (null, null);

        var exact = ramos.FirstOrDefault(r => r.Nombre.Equals(target, StringComparison.OrdinalIgnoreCase));
        if (exact != null)
            return (exact.Id, exact.Nombre);

        var canon = MapRamoAlias(target);
        if (!string.IsNullOrEmpty(canon))
        {
            var r = ramos.FirstOrDefault(x => x.Nombre.Equals(canon, StringComparison.OrdinalIgnoreCase));
            if (r != null)
                return (r.Id, r.Nombre);
        }

        var fuzzy = ramos.Where(r => r.Nombre.Contains(target, StringComparison.OrdinalIgnoreCase)).ToList();
        if (fuzzy.Count == 1)
            return (fuzzy[0].Id, fuzzy[0].Nombre);

        return (null, target);
    }

    private static string? MapRamoAlias(string s)
    {
        var n = NormalizeHeader(s);
        if ((n.Contains("BUEN") && n.Contains("USO")) || n.Contains("ANTICIPO"))
            return "Buen Uso de Anticipo";
        if (n.Contains("AMBIENTAL") || (n.Contains("MANEJO") && n.Contains("AMBIENTAL")))
            return "Cumplimiento al Manejo Ambiental";
        if (n.Contains("FIEL") || (n.Contains("CUMPLIMIENTO") && n.Contains("CONTRATO")))
            return "Fiel Cumplimiento";
        return null;
    }

    private static string? DefaultRamoFromSheetName(string sheetName)
    {
        var n = NormalizeHeader(sheetName);
        if (n.Contains("BUEN") && n.Contains("ANTICIPO"))
            return "Buen Uso de Anticipo";
        if (n.Contains("AMBIENTAL") || (n.Contains("MANEJO") && n.Contains("AMBIENTAL")))
            return "Cumplimiento al Manejo Ambiental";
        if (n.Contains("CUMPLIMIENTO") && n.Contains("CONTRATO"))
            return "Fiel Cumplimiento";
        return null;
    }

    private static (int HeaderRow, Dictionary<string, int> ColMap)? FindHeaderRow(IXLWorksheet ws)
    {
        var lastRow = Math.Min(ws.LastRowUsed()?.RowNumber() ?? 0, 80);
        for (var r = 1; r <= lastRow; r++)
        {
            var row = ws.Row(r);
            var lastCol = row.LastCellUsed()?.Address.ColumnNumber ?? 0;
            var map = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
            for (var c = 1; c <= lastCol; c++)
            {
                var h = row.Cell(c).GetString().Trim();
                if (string.IsNullOrEmpty(h))
                    continue;
                var key = MapHeaderToKey(h);
                if (key != null && !map.ContainsKey(key))
                    map[key] = c;
            }

            if (map.ContainsKey("numero") && map.ContainsKey("contratista") && map.Count >= 4)
                return (r, map);
        }

        return null;
    }

    private static string? MapHeaderToKey(string header)
    {
        var n = NormalizeHeader(header);
        if (n.Contains("POLIZ"))
            return "numero";
        if (n.Contains("CONTRATIST"))
            return "contratista";
        if (n.Contains("OBRA") || n.Contains("PROYECT"))
            return "obra";
        if (n.Contains("ASEGURADOR"))
            return "aseguradora";
        if (n.Contains("RAMO") && !n.Contains("PROYECT"))
            return "ramo";
        if (n.Contains("VALOR"))
            return "valor";
        if (n.Contains("EMISION") || n.Contains("EMISI"))
            return "fechaEmision";
        if (n.Contains("VIGENCIA") || n.Contains("HASTA"))
            return "vigenciaHasta";
        if (n.Contains("OBSERVAC"))
            return "observaciones";
        return null;
    }

    private static string NormalizeHeader(string s)
    {
        var t = s.Trim().ToUpperInvariant().Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder();
        foreach (var ch in t)
        {
            if (char.GetUnicodeCategory(ch) == System.Globalization.UnicodeCategory.NonSpacingMark)
                continue;
            sb.Append(ch);
        }

        t = sb.ToString();
        return t.Replace(" ", "").Replace(".", "").Replace("#", "").Replace("-", "");
    }

    private static string? GetCellStringTrim(IXLCell cell)
    {
        if (cell.IsEmpty())
            return null;
        try
        {
            if (cell.DataType == XLDataType.Text)
                return cell.GetString().Trim();
            return cell.GetFormattedString().Trim();
        }
        catch
        {
            return cell.Value.ToString()?.Trim();
        }
    }

    private static bool TryParseDateFromCell(IXLCell cell, out DateTime? date)
    {
        date = null;
        if (cell.IsEmpty())
            return false;

        if (cell.DataType == XLDataType.DateTime)
        {
            date = cell.GetDateTime().Date;
            return true;
        }

        if (cell.DataType == XLDataType.Number)
        {
            try
            {
                date = DateTime.FromOADate(cell.GetDouble()).Date;
                return true;
            }
            catch
            {
                // ignore
            }
        }

        var s = GetCellStringTrim(cell);
        if (string.IsNullOrEmpty(s))
            return false;

        if (DateTime.TryParse(s, CultureInfo.GetCultureInfo("es-CO"), DateTimeStyles.None, out var d))
        {
            date = d.Date;
            return true;
        }

        if (DateTime.TryParse(s, CultureInfo.InvariantCulture, DateTimeStyles.None, out var d2))
        {
            date = d2.Date;
            return true;
        }

        return false;
    }

    private static bool TryParseDecimalFromCell(IXLCell cell, out decimal? value)
    {
        value = null;
        if (cell.IsEmpty())
            return false;

        if (cell.DataType == XLDataType.Number)
        {
            value = (decimal)cell.GetDouble();
            return true;
        }

        var s = GetCellStringTrim(cell);
        if (string.IsNullOrEmpty(s))
            return false;

        if (decimal.TryParse(s, NumberStyles.Any, CultureInfo.GetCultureInfo("es-CO"), out var v))
        {
            value = v;
            return true;
        }

        if (decimal.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out var v2))
        {
            value = v2;
            return true;
        }

        return false;
    }

    private static DateTimeOffset ToMedioDiaColombia(DateTime fechaLocal)
    {
        return new DateTimeOffset(
            fechaLocal.Year,
            fechaLocal.Month,
            fechaLocal.Day,
            12,
            0,
            0,
            TimeSpan.FromHours(-5));
    }
}

internal sealed class ImportPreviewRowInternal
{
    public int ExcelRow { get; set; }
    public string SheetName { get; set; } = "";
    public string NumeroPoliza { get; set; } = "";
    public string Contratista { get; set; } = "";
    public string Obra { get; set; } = "";
    public string Aseguradora { get; set; } = "";
    public string RamoNombre { get; set; } = "";
    public Guid? RamoId { get; set; }
    public decimal? Valor { get; set; }
    public DateTimeOffset? FechaEmision { get; set; }
    public DateTimeOffset? FechaExpiracion { get; set; }
    public Guid? PolizaExistenteId { get; set; }
    public string EstadoAnalisis { get; set; } = "incompleta";
    public string EmpresaResolucion { get; set; } = "sinNombre";
    public Guid? EmpresaIdExistente { get; set; }
    public string? EmailProvisional { get; set; }
    public List<string> Mensajes { get; set; } = new();
    public bool PuedeAplicar { get; set; }
}

internal sealed class PolizaImportSession
{
    public string FileName { get; set; } = "";
    public DateTimeOffset CreatedAt { get; set; }
    public List<ImportPreviewRowInternal> Rows { get; set; } = new();
}
