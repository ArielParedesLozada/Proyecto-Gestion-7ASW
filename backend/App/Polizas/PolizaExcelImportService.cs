using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using Backend.Data.Databases;
using Backend.Domain.Errors;
using Backend.Domain.Models;
using Backend.Presentation.Dtos.Responses;
using ClosedXML.Excel;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace Backend.App.Polizas;

/// <summary>Importa pólizas desde Excel. Los ramos solo se referencian contra el catálogo en BD; nunca se crean aquí (altas vía API/UI).</summary>
public class PolizaExcelImportService(
    AppDatabase context,
    EmpresasService empresasService,
    AseguradorasService aseguradorasService,
    IMemoryCache cache)
{
    private readonly AppDatabase _context = context;
    private readonly EmpresasService _empresasService = empresasService;
    private readonly AseguradorasService _aseguradorasService = aseguradorasService;
    private readonly IMemoryCache _cache = cache;

    private static readonly MemoryCacheEntryOptions SessionOptions = new()
    {
        SlidingExpiration = TimeSpan.FromMinutes(30),
    };

    private static string CacheKey(Guid token, string usuarioId) => $"poliza-import:{usuarioId}:{token}";
    public async Task<PolizaImportPreviewResponse> PrevisualizarAsync(Stream excelStream, string fileName, Guid usuarioId)
    {
        if (excelStream == null || !excelStream.CanRead)
            throw new CustomError("No se recibió un archivo válido.", 400);

        var name = string.IsNullOrWhiteSpace(fileName) ? "archivo.xlsx" : fileName.Trim();
        if (!name.EndsWith(".xlsx", StringComparison.OrdinalIgnoreCase))
            throw new CustomError("El archivo debe ser Excel (.xlsx).", 400);

        List<Ramo> ramos;
        List<Empresa> empresas;
        List<Aseguradora> aseguradoras;
        try
        {
            ramos = await _context.Ramos.AsNoTracking().ToListAsync();
            empresas = await _context.Empresas.AsNoTracking().ToListAsync();
            aseguradoras = await _context.Aseguradoras.AsNoTracking().ToListAsync();
        }
        catch (Exception ex)
        {
            throw new CustomError($"No se pudieron cargar ramos, empresas y aseguradoras: {ex.Message}", 500);
        }

        List<ImportPreviewRowInternal> rows;
        List<string> sheetsDetected;
        try
        {
            using var wb = new XLWorkbook(excelStream);
            (rows, sheetsDetected) = ParseWorkbook(wb, ramos, empresas, aseguradoras);
        }
        catch (CustomError)
        {
            throw;
        }
        catch (Exception ex)
        {
            throw new CustomError($"No se pudo leer el Excel: {ex.Message}", 400);
        }

        ResolveIntraFileDuplicatePolicyNumbers(rows);

        var numeros = rows
            .Where(r => r.EstadoAnalisis != "ignorada")
            .Where(r => !string.IsNullOrWhiteSpace(r.NumeroPoliza))
            .Select(r => r.NumeroPoliza.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var existentesPorClave = await CargarPolizasExistentesPorNumeroYObraAsync(numeros);
        foreach (var r in rows)
        {
            if (r.EstadoAnalisis == "ignorada")
                continue;
            if (string.IsNullOrWhiteSpace(r.NumeroPoliza))
                continue;
            var clave = ClaveNegocioPoliza(r.NumeroPoliza, r.Obra);
            if (existentesPorClave.TryGetValue(clave, out var id))
                r.PolizaExistenteId = id;
        }

        ApplyExistenceAndValidation(rows, ramos, empresas, aseguradoras);

        var token = Guid.NewGuid();
        var session = new PolizaImportSession
        {
            FileName = name,
            UsuarioId = usuarioId,
            CreatedAt = DateTimeOffset.UtcNow,
            Rows = rows,
        };
        _cache.Set(CacheKey(token, usuarioId.ToString()), session, SessionOptions);

        return MapPreviewResponse(token, name, sheetsDetected, rows);
    }

    public async Task<PolizaImportResultResponse> ConfirmarAsync(Guid token, Guid usuarioId)
    {
        if (!_cache.TryGetValue(CacheKey(token, usuarioId.ToString()), out PolizaImportSession? session) || session == null)
        {
            throw new CustomError(
                "La sesión de importación expiró o no es válida. Vuelve a cargar el archivo para previsualizar de nuevo.",
                400);
        }
        if (session.UsuarioId != usuarioId)
        {
            throw new CustomError("Token no válido para este usuario.", 403);
        }

        var aplicables = session.Rows.Where(r => r.PuedeAplicar).ToList();
        if (aplicables.Count == 0)
            throw new CustomError("No hay filas válidas para importar en esta sesión.", 400);

        var resultado = new PolizaImportResultResponse();
        var errores = new List<PolizaImportResultErrorDto>();

        var ramos = await _context.Ramos.AsNoTracking().ToListAsync();
        var empresasCreadasPorNombre = new Dictionary<string, Guid>(StringComparer.OrdinalIgnoreCase);
        var aseguradorasCreadasPorNombre = new Dictionary<string, Guid>(StringComparer.OrdinalIgnoreCase);

        try
        {
            foreach (var row in aplicables)
            {
                var ramo = ramos.First(r => r.Id == row.RamoId!.Value);
                await using var tx = await _context.Database.BeginTransactionAsync();
                try
                {
                    // Resolver contratista (empresa)
                    var empresaId = await ResolverOcrearEmpresaAsync(row, empresasCreadasPorNombre);

                    // Resolver aseguradora (NUEVA LÓGICA)
                    var aseguradoraId = await ResolverOcrearAseguradoraAsync(row, aseguradorasCreadasPorNombre);

                    var emisionUtc = AUtc(row.FechaEmision!.Value);
                    var expiracionUtc = AUtc(row.FechaExpiracion!.Value);
                    PolizaFechaValidacion.ValidarEmisionYExpiracion(emisionUtc, expiracionUtc);

                    var valor = row.Valor ?? 0;
                    var valorActual = valor;

                    // Calcular periodicidad automáticamente (punto 8)
                    var periodicidad = expiracionUtc - emisionUtc;

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
                        entity.AseguradoraId = aseguradoraId; // CORREGIDO
                        entity.UsuarioId = usuarioId;
                        entity.PeriodicidadRenovacion = periodicidad; // NUEVO
                        entity.FechaEmision = emisionUtc;
                        entity.FechaExpiracion = expiracionUtc;
                        entity.ValorOriginal = valor;
                        entity.ValorActual = valorActual;
                        entity.Observaciones = NormalizeObservaciones(row.Observaciones);
                        entity.Estado = PolizaEstadoDerivadoHelper.EstadoPersistido(
                            expiracionUtc,
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
                            AseguradoraId = aseguradoraId, // CORREGIDO
                            UsuarioId = usuarioId,
                            PeriodicidadRenovacion = periodicidad, // NUEVO
                            FechaEmision = emisionUtc,
                            FechaExpiracion = expiracionUtc,
                            ValorOriginal = valor,
                            ValorActual = valorActual,
                            Observaciones = NormalizeObservaciones(row.Observaciones),
                            Estado = PolizaEstadoDerivadoHelper.EstadoPersistido(
                                expiracionUtc,
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
            _cache.Remove(CacheKey(token, usuarioId.ToString()));
        }

        resultado.Errors = errores;
        return resultado;
    }

    private async Task<Guid> ResolverOcrearAseguradoraAsync(
        ImportPreviewRowInternal row,
        Dictionary<string, Guid> creadasPorNombre)
    {
        var key = NormalizeNombreContratista(row.Aseguradora);
        if (row.AseguradoraIdExistente != null)
            return row.AseguradoraIdExistente.Value;

        if (creadasPorNombre.TryGetValue(key, out var id))
            return id;

        if (string.IsNullOrEmpty(row.EmailAseguradoraProvisional))
            throw new CustomError("No se pudo resolver la aseguradora.", 400);

        var creada = await _aseguradorasService.CreateAseguradora(key, row.EmailAseguradoraProvisional);
        creadasPorNombre[key] = creada.Id;
        return creada.Id;
    }

    private async Task<Guid> ResolverOcrearEmpresaAsync(
            ImportPreviewRowInternal row,
            Dictionary<string, Guid> creadasPorNombre)
    {
        var key = NormalizeNombreContratista(row.Contratista);
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
    /// <summary>Clave de negocio alineada con lectura de fila y con índice único (Numero, Obra) en BD.</summary>
    private static string ClaveNegocioPoliza(string? numeroPoliza, string? obra) =>
        $"{(numeroPoliza ?? "").Trim()}\u001F{CollapseWhitespace(obra).Trim()}";

    private async Task<Dictionary<string, Guid>> CargarPolizasExistentesPorNumeroYObraAsync(IReadOnlyList<string> numeros)
    {
        if (numeros.Count == 0)
            return new Dictionary<string, Guid>(StringComparer.OrdinalIgnoreCase);

        var list = await _context.Polizas.AsNoTracking()
            .Where(p => numeros.Contains(p.Numero))
            .Select(p => new { p.Numero, p.Obra, p.Id })
            .ToListAsync();

        var comparer = StringComparer.OrdinalIgnoreCase;
        var dict = new Dictionary<string, Guid>(comparer);
        foreach (var x in list)
        {
            var k = ClaveNegocioPoliza(x.Numero, x.Obra);
            dict.TryAdd(k, x.Id);
        }

        return dict;
    }

    /// <summary>
    /// Misma fila lógica repetida en el archivo (mismo número y misma obra): una sola se importa.
    /// Criterio: mayor fecha de expiración; empate → última fila en el Excel.
    /// Las demás pasan a <c>ignorada</c> con mensaje informativo (no es error de negocio).
    /// </summary>
    private static void ResolveIntraFileDuplicatePolicyNumbers(List<ImportPreviewRowInternal> rows)
    {
        var candidatos = rows
            .Where(r => r.EstadoAnalisis != "ignorada")
            .Where(r => !string.IsNullOrWhiteSpace(r.NumeroPoliza))
            .ToList();

        var comparer = StringComparer.OrdinalIgnoreCase;
        var grupos = candidatos
            .GroupBy(r => ClaveNegocioPoliza(r.NumeroPoliza, r.Obra), comparer)
            .Where(g => g.Count() > 1);

        foreach (var g in grupos)
        {
            var ordered = g
                .OrderBy(x => x.FechaExpiracion ?? DateTimeOffset.MinValue)
                .ThenBy(x => x.OrdenLectura)
                .ToList();

            var ganadora = ordered[^1];
            foreach (var r in ordered)
            {
                if (ReferenceEquals(r, ganadora))
                    continue;
                r.EstadoAnalisis = "ignorada";
                r.PuedeAplicar = false;
                r.Mensajes.Clear();
                r.Mensajes.Add("Duplicado: se conserva el registro con mayor fecha de expiración");
            }
        }
    }

    private void ApplyExistenceAndValidation(
            List<ImportPreviewRowInternal> rows,
            List<Ramo> ramos,
            List<Empresa> empresas,
            List<Aseguradora> aseguradoras) // NUEVO parámetro
    {
        foreach (var r in rows)
        {
            if (r.EstadoAnalisis == "ignorada")
            {
                r.PuedeAplicar = false;
                continue;
            }

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
                r.Mensajes.Add("El ramo no existe en el sistema o no coincide con los ramos configurados.");

            // Resolver contratista (empresa)
            var emp = ResolverEmpresa(NormalizeNombreContratista(r.Contratista), empresas);
            r.EmpresaResolucion = emp.Kind;
            r.EmpresaIdExistente = emp.IdExistente;
            r.EmailProvisional = emp.EmailProvisional;
            if (emp.Kind == "ambiguo")
                r.Mensajes.Add("Varias empresas coinciden con el nombre del contratista; usa el nombre exacto registrado.");

            // NUEVO: Resolver aseguradora
            var ase = ResolverAseguradora(NormalizeNombreContratista(r.Aseguradora), aseguradoras);
            r.AseguradoraResolucion = ase.Kind;
            r.AseguradoraIdExistente = ase.IdExistente;
            r.EmailAseguradoraProvisional = ase.EmailProvisional;
            if (ase.Kind == "ambiguo")
                r.Mensajes.Add("Varias aseguradoras coinciden con el nombre; usa el nombre exacto registrado.");

            if (r.Mensajes.Count > 0)
            {
                var soloFaltantes = r.Mensajes.All(m => m.Contains("Falta", StringComparison.OrdinalIgnoreCase));
                r.EstadoAnalisis = r.RamoId == null ? "error" : (soloFaltantes ? "incompleta" : "error");
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

        var t = NormalizeNombreContratista(nombre);
        var exact = empresas.FirstOrDefault(e => string.Equals(e.Nombre.Trim(), t, StringComparison.OrdinalIgnoreCase));
        if (exact != null)
            return ("existente", exact.Id, null);

        var candidates = empresas
            .Where(e => NormalizeNombreContratista(e.Nombre).Contains(t, StringComparison.OrdinalIgnoreCase))
            .ToList();
        if (candidates.Count == 1)
            return ("existente", candidates[0].Id, null);
        if (candidates.Count > 1)
            return ("ambiguo", null, null);

        var email = $"import-{Guid.NewGuid():N}@import.sicop.local";
        return ("seCreara", null, email);
    }

    // NUEVO MÉTODO: Resolver aseguradora (similar a empresa)
    private static (string Kind, Guid? IdExistente, string? EmailProvisional) ResolverAseguradora(
        string? nombre,
        List<Aseguradora> aseguradoras)
    {
        if (string.IsNullOrWhiteSpace(nombre))
            return ("sinNombre", null, null);

        var t = NormalizeNombreContratista(nombre);
        var exact = aseguradoras.FirstOrDefault(a => string.Equals(a.Nombre.Trim(), t, StringComparison.OrdinalIgnoreCase));
        if (exact != null)
            return ("existente", exact.Id, null);

        var candidates = aseguradoras
            .Where(a => NormalizeNombreContratista(a.Nombre).Contains(t, StringComparison.OrdinalIgnoreCase))
            .ToList();
        if (candidates.Count == 1)
            return ("existente", candidates[0].Id, null);
        if (candidates.Count > 1)
            return ("ambiguo", null, null);

        var email = $"aseguradora-import-{Guid.NewGuid():N}@import.sicop.local";
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
        var ign = rows.Count(r => r.EstadoAnalisis == "ignorada");
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
            Obra = r.Obra,
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
            IgnoredRows = ign,
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
            IReadOnlyList<Empresa> empresas,
            IReadOnlyList<Aseguradora> aseguradoras) // NUEVO parámetro
    {
        var rows = new List<ImportPreviewRowInternal>();
        var sheets = new List<string>();
        var ordenLectura = 0;

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

                if (TryDetectIgnorableNonPolicyRow(ws, r, colMap, out var motivoIgnorar))
                {
                    var ig = CreateIgnoradaRow(ws, r, motivoIgnorar);
                    ig.OrdenLectura = ordenLectura++;
                    rows.Add(ig);
                    continue;
                }

                var internalRow = ReadDataRow(ws, r, colMap, defaultRamo, ramos, empresas, aseguradoras);
                internalRow.OrdenLectura = ordenLectura++;
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

    /// <summary>Fila de mes, encabezado duplicado u otra fila “decorativa” del Excel del cliente.</summary>
    private static bool TryDetectIgnorableNonPolicyRow(
        IXLWorksheet ws,
        int excelRow,
        Dictionary<string, int> colMap,
        out string motivo)
    {
        motivo = "";

        string? Cell(string key) =>
            colMap.TryGetValue(key, out var col) ? GetCellStringTrim(ws.Cell(excelRow, col)) : null;

        var numero = Cell("numero");
        var contratista = Cell("contratista");
        var obra = Cell("obra");
        var ramo = Cell("ramo");
        var aseguradora = Cell("aseguradora");

        foreach (var fragment in new[] { numero, contratista, obra, ramo, aseguradora })
        {
            if (string.IsNullOrWhiteSpace(fragment))
                continue;
            if (Regex.IsMatch(fragment, @"MES\s+DE\s+\w+", RegexOptions.IgnoreCase))
            {
                motivo = "Fila de título por mes (no es un registro de póliza).";
                return true;
            }
        }

        var nNum = NormalizeHeader(numero ?? "");
        var nCon = NormalizeHeader(contratista ?? "");
        // Repetición de encabezados: texto típico de cabecera en celda de dato
        if (nNum.Contains("DEPOLIZ") || nNum.Contains("NUMERODEPOLIZ") || (nNum.Contains("POLIZ") && nNum.Contains("NUMERO")))
        {
            motivo = "Fila de encabezado repetido (no es un registro de póliza).";
            return true;
        }
        if (nCon == "CONTRATISTA" || nCon == "CONTRATIST")
        {
            motivo = "Fila de encabezado repetido (no es un registro de póliza).";
            return true;
        }
        if (NormalizeHeader(ramo ?? "") == "RAMO")
        {
            motivo = "Fila de encabezado repetido (no es un registro de póliza).";
            return true;
        }

        return false;
    }

    private static ImportPreviewRowInternal CreateIgnoradaRow(IXLWorksheet ws, int excelRow, string motivo)
    {
        return new ImportPreviewRowInternal
        {
            ExcelRow = excelRow,
            SheetName = ws.Name.Trim(),
            EstadoAnalisis = "ignorada",
            EmpresaResolucion = "sinNombre",
            Mensajes = new List<string> { motivo },
            PuedeAplicar = false,
        };
    }

    private static ImportPreviewRowInternal ReadDataRow(
            IXLWorksheet ws,
            int excelRow,
            Dictionary<string, int> colMap,
            string? defaultRamoCanonical,
            IReadOnlyList<Ramo> ramos,
            IReadOnlyList<Empresa> empresas,
            IReadOnlyList<Aseguradora> aseguradoras)
    {
        string? G(string key) =>
            colMap.TryGetValue(key, out var col) ? GetCellStringTrim(ws.Cell(excelRow, col)) : null;

        var numero = G("numero") ?? "";
        var contratista = G("contratista") ?? "";
        var obra = G("obra") ?? "";
        var ramoCol = G("ramo");
        var aseguradora = G("aseguradora") ?? "";
        var observaciones = G("observaciones");

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
            NumeroPoliza = numero.Trim(),
            Contratista = NormalizeNombreContratista(contratista),
            Obra = CollapseWhitespace(obra).Trim(),
            Aseguradora = CollapseWhitespace(aseguradora).Trim(),
            Observaciones = observaciones?.Trim(),
            RamoNombre = ramoResolved.Nombre ?? "",
            RamoId = ramoResolved.Id,
            Valor = valor,
            FechaEmision = em,
            FechaExpiracion = ex,
            EstadoAnalisis = "incompleta",
            EmpresaResolucion = "sinNombre",
            AseguradoraResolucion = "sinNombre",
        };
    }

    /// <summary>Resuelve ramo: texto columna → alias → coincidencia flexible con nombres en BD → fallback nombre de hoja.</summary>
    private static (Guid? Id, string? Nombre) ResolverRamoNombre(
        string? ramoColumna,
        string? defaultRamoCanonical,
        IReadOnlyList<Ramo> ramos)
    {
        if (TryResolveRamoSingleSource(ramoColumna, ramos, out var id1, out var nom1))
            return (id1, nom1);

        if (TryResolveRamoSingleSource(defaultRamoCanonical, ramos, out var id2, out var nom2))
            return (id2, nom2);

        var etiqueta = !string.IsNullOrWhiteSpace(ramoColumna)
            ? CollapseWhitespace(ramoColumna).Trim()
            : CollapseWhitespace(defaultRamoCanonical ?? "").Trim();
        return (null, string.IsNullOrEmpty(etiqueta) ? null : etiqueta);
    }

    private static bool TryResolveRamoSingleSource(string? texto, IReadOnlyList<Ramo> ramos, out Guid? id, out string? nombre)
    {
        id = null;
        nombre = null;
        if (string.IsNullOrWhiteSpace(texto))
            return false;

        var display = CollapseWhitespace(texto).Trim();

        // 1) Igualdad directa (espacios colapsados, sin distinguir mayúsculas)
        var direct = ramos.FirstOrDefault(r =>
            string.Equals(CollapseWhitespace(r.Nombre).Trim(), display, StringComparison.OrdinalIgnoreCase));
        if (direct != null)
        {
            id = direct.Id;
            nombre = direct.Nombre;
            return true;
        }

        // 2) Nombre canónico por alias (variaciones BUEN USO DE/DEL ANTICIPO, etc.)
        var canon = MapRamoToCanonicalNombre(display);
        if (canon != null)
        {
            var r = ramos.FirstOrDefault(x => string.Equals(x.Nombre, canon, StringComparison.OrdinalIgnoreCase));
            if (r != null)
            {
                id = r.Id;
                nombre = r.Nombre;
                return true;
            }
        }

        // 3) Clave sin espacios ni acentos: igualdad o contención con nombres de BD
        var keyInput = RamoNormalizeKey(display);
        if (keyInput.Length == 0)
            return false;

        foreach (var r in ramos)
        {
            var keyDb = RamoNormalizeKey(r.Nombre);
            if (keyDb.Length > 0 && keyInput == keyDb)
            {
                id = r.Id;
                nombre = r.Nombre;
                return true;
            }
        }

        // 4) Fuzzy por contención de claves (solo si no hay ambigüedad)
        List<Ramo> fuzzyHits = new();
        foreach (var r in ramos)
        {
            var keyDb = RamoNormalizeKey(r.Nombre);
            if (keyDb.Length < 6 || keyInput.Length < 6)
                continue;
            if (keyInput.Contains(keyDb, StringComparison.OrdinalIgnoreCase)
                || keyDb.Contains(keyInput, StringComparison.OrdinalIgnoreCase))
                fuzzyHits.Add(r);
        }
        fuzzyHits = fuzzyHits.DistinctBy(x => x.Id).ToList();
        if (fuzzyHits.Count == 1)
        {
            id = fuzzyHits[0].Id;
            nombre = fuzzyHits[0].Nombre;
            return true;
        }

        return false;
    }

    /// <summary>Mapea variaciones típicas del Excel cliente a los tres nombres oficiales del sistema.</summary>
    private static string? MapRamoToCanonicalNombre(string textoVisible)
    {
        var n = NormalizeHeader(CollapseWhitespace(textoVisible));
        if (n.Length == 0)
            return null;

        // Buen uso (de/del) anticipo — "ANTICIPO" ancla bien; también BUEN+USO sin depender de espacios
        if (n.Contains("ANTICIPO") || (n.Contains("BUEN") && n.Contains("USO")))
            return "Buen Uso de Anticipo";

        if (n.Contains("AMBIENTAL") || (n.Contains("MANEJO") && n.Contains("AMBIENTAL")))
            return "Cumplimiento al Manejo Ambiental";

        if (n.Contains("FIEL") || (n.Contains("CUMPLIMIENTO") && n.Contains("CONTRATO")))
            return "Fiel Cumplimiento";

        return null;
    }

    private static string RamoNormalizeKey(string s)
    {
        var t = CollapseWhitespace(s).ToUpperInvariant().Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder();
        foreach (var ch in t)
        {
            if (char.GetUnicodeCategory(ch) == System.Globalization.UnicodeCategory.NonSpacingMark)
                continue;
            if (char.IsWhiteSpace(ch) || ch is '.' or '#' or '-' or '_' or '/')
                continue;
            sb.Append(ch);
        }
        return sb.ToString();
    }

    private static string? DefaultRamoFromSheetName(string sheetName)
    {
        if (string.IsNullOrWhiteSpace(sheetName))
            return null;
        var collapsed = CollapseWhitespace(sheetName).Trim();
        return MapRamoToCanonicalNombre(collapsed);
    }

    /// <summary>Espacios internos repetidos → uno; trim.</summary>
    private static string CollapseWhitespace(string? s)
    {
        if (string.IsNullOrEmpty(s))
            return "";
        return Regex.Replace(s.Trim(), @"\s+", " ");
    }

    /// <summary>Contratista u otros nombres libres: trim + espacios colapsados (evita <c>sinNombre</c> fantasma).</summary>
    private static string NormalizeNombreContratista(string? s)
    {
        return CollapseWhitespace(s);
    }

    private static string? NormalizeObservaciones(string? s)
    {
        if (string.IsNullOrWhiteSpace(s))
            return null;
        return s.Trim();
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

    /// <summary>
    /// Alineado con el flujo manual: Npgsql solo permite persistir <c>timestamptz</c> con offset UTC.
    /// </summary>
    private static DateTimeOffset AUtc(DateTimeOffset dto) => dto.ToUniversalTime();
}

internal sealed class ImportPreviewRowInternal
{
    public int ExcelRow { get; set; }
    public string SheetName { get; set; } = "";
    public string NumeroPoliza { get; set; } = "";
    public string Contratista { get; set; } = "";
    public string Obra { get; set; } = "";
    public string Aseguradora { get; set; } = "";
    public string? Observaciones { get; set; }
    public string RamoNombre { get; set; } = "";
    public Guid? RamoId { get; set; }
    public decimal? Valor { get; set; }
    public DateTimeOffset? FechaEmision { get; set; }
    public DateTimeOffset? FechaExpiracion { get; set; }
    public Guid? PolizaExistenteId { get; set; }
    public string EstadoAnalisis { get; set; } = "incompleta";
    // Resolución de empresa (contratista)
    public string EmpresaResolucion { get; set; } = "sinNombre";
    public Guid? EmpresaIdExistente { get; set; }
    public string? EmailProvisional { get; set; }
    // NUEVO: Resolución de aseguradora
    public string AseguradoraResolucion { get; set; } = "sinNombre";
    public Guid? AseguradoraIdExistente { get; set; }
    public string? EmailAseguradoraProvisional { get; set; }
    public List<string> Mensajes { get; set; } = new();
    public bool PuedeAplicar { get; set; }
    public int OrdenLectura { get; set; }
}

internal sealed class PolizaImportSession
{
    public string FileName { get; set; } = "";
    public Guid UsuarioId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public List<ImportPreviewRowInternal> Rows { get; set; } = new();
}