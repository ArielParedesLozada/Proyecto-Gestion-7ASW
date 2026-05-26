using Backend.App.Dtos;
using Backend.App.Polizas;
using Backend.Data.Databases;
using Backend.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Backend.App.Reportes;

public class ControlMaestroService(AppDatabase context)
{
    private readonly AppDatabase _context = context;

    /// <summary>Ruta del logo institucional copiado al directorio de salida (misma que PolizaPdfService).</summary>
    private static string LogoPath =>
        Path.Combine(AppContext.BaseDirectory, "Assets", "Gobierno.png");
    public async Task<ControlMaestroRes> ObtenerControlMaestroAsync(
            int pageVigentes,
            int pageSizeVigentes,
            int pageVencidas,
            int pageSizeVencidas,
            decimal saldoInicial,
            DateTimeOffset? fechaInicio,
            DateTimeOffset? fechaFin,
            Guid? ramoId
    )
    {
        var baseQuery = _context.Polizas
            .AsNoTracking();
        baseQuery = ApplyVencimientoRangeFilter(baseQuery, fechaInicio, fechaFin);

        if (ramoId.HasValue)
        {
            baseQuery = baseQuery.Where(p => p.Ramo == ramoId.Value);
        }
        var vigentesQuery = baseQuery
            .Where(p => p.Estado == EstadoPoliza.Vigente);

        var totalVigentesCount = await vigentesQuery.CountAsync();
        var now = DateTimeOffset.UtcNow;
        var vigentesItems = await vigentesQuery
            .OrderByDescending(p => p.CreatedAt)
            .Skip((pageVigentes - 1) * pageSizeVigentes)
            .Take(pageSizeVigentes)
            .Select(p => new PolizaRes
            {
                Id = p.Id,
                Numero = p.Numero,
                Obra = p.Obra,
                AseguradoraId = p.AseguradoraId,
                AseguradoraNombre = p.AseguradoraNav.Nombre,
                ContratistaId = p.Contratista,
                ContratistaNombre = p.ContratistaNav.Nombre,
                RamoId = p.Ramo,
                RamoNombre = p.RamoNav.Nombre,
                FechaEmision = p.FechaEmision,
                FechaExpiracion = p.FechaExpiracion,
                ValorOriginal = p.ValorOriginal,
                ValorActual = p.ValorActual,
                Observaciones = p.Observaciones,
                Estado = PolizaEstadoDerivadoHelper.Calcular(p.FechaExpiracion, now),
            })
            .ToListAsync();

        var totalVigentes = await vigentesQuery.SumAsync(p => p.ValorActual);

        // =========================
        // VENCIDAS
        // =========================
        var vencidasQuery = baseQuery
            .Where(p => p.Estado == EstadoPoliza.Vencida);

        var totalVencidasCount = await vencidasQuery.CountAsync();

        var vencidasItems = await vencidasQuery
            .OrderByDescending(p => p.CreatedAt)
            .Skip((pageVencidas - 1) * pageSizeVencidas)
            .Take(pageSizeVencidas)
            .Select(p => new PolizaRes
            {
                Id = p.Id,
                Numero = p.Numero,
                Obra = p.Obra,
                AseguradoraId = p.AseguradoraId,
                AseguradoraNombre = p.AseguradoraNav.Nombre,
                ContratistaId = p.Contratista,
                ContratistaNombre = p.ContratistaNav.Nombre,
                RamoId = p.Ramo,
                RamoNombre = p.RamoNav.Nombre,
                FechaEmision = p.FechaEmision,
                FechaExpiracion = p.FechaExpiracion,
                ValorOriginal = p.ValorOriginal,
                ValorActual = p.ValorActual,
                Observaciones = p.Observaciones,
                Estado = EstadoPolizaDerivado.Expirado
            })
            .ToListAsync();

        var totalVencidas = await vencidasQuery.SumAsync(p => p.ValorActual);

        // =========================
        // CUADRE
        // =========================
        var cuadreTotal = saldoInicial + totalVigentes - totalVencidas;

        return new ControlMaestroRes
        {
            Vigentes = new PagedResult<PolizaRes>
            {
                Items = vigentesItems,
                Total = totalVigentesCount,
                Page = pageVigentes,
                PageSize = pageSizeVigentes
            },
            Vencidas = new PagedResult<PolizaRes>
            {
                Items = vencidasItems,
                Total = totalVencidasCount,
                Page = pageVencidas,
                PageSize = pageSizeVencidas
            },
            TotalVigentes = totalVigentes,
            TotalVencidas = totalVencidas,
            SaldoInicial = saldoInicial,
            CuadreTotal = cuadreTotal
        };
    }

    public async Task<(byte[] Bytes, string FileName)> GenerarPdfAsync(
        decimal saldoInicial,
        DateTimeOffset generadoEnUtc,
        DateTimeOffset? fechaInicio,
        DateTimeOffset? fechaFin,
        Guid? ramoId
    )
    {
        var baseQuery = _context.Polizas
           .AsNoTracking();
        baseQuery = ApplyVencimientoRangeFilter(baseQuery, fechaInicio, fechaFin);

        if (ramoId.HasValue)
        {
            baseQuery = baseQuery.Where(p => p.Ramo == ramoId.Value);
        }
        var now = DateTimeOffset.UtcNow;
        var vigentesQuery = baseQuery
            .Where(p => p.Estado == EstadoPoliza.Vigente);
        var vencidasQuery = baseQuery
            .Where(p => p.Estado == EstadoPoliza.Vencida);
        var totalVigentesCount = await vigentesQuery.CountAsync();
        var vigentesItems = await vigentesQuery
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new PolizaRes
            {
                Id = p.Id,
                Numero = p.Numero,
                Obra = p.Obra,
                AseguradoraId = p.AseguradoraId,
                AseguradoraNombre = p.AseguradoraNav.Nombre,
                ContratistaId = p.Contratista,
                ContratistaNombre = p.ContratistaNav.Nombre,
                RamoId = p.Ramo,
                RamoNombre = p.RamoNav.Nombre,
                FechaEmision = p.FechaEmision,
                FechaExpiracion = p.FechaExpiracion,
                ValorOriginal = p.ValorOriginal,
                ValorActual = p.ValorActual,
                Observaciones = p.Observaciones,
                Estado = PolizaEstadoDerivadoHelper.Calcular(p.FechaExpiracion, now),
            })
            .ToListAsync();
        var totalVigentes = await vigentesQuery.SumAsync(p => p.ValorActual);
        var totalVencidasCount = await vencidasQuery.CountAsync();
        var vencidasItems = await vencidasQuery
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new PolizaRes
            {
                Id = p.Id,
                Numero = p.Numero,
                Obra = p.Obra,
                AseguradoraId = p.AseguradoraId,
                AseguradoraNombre = p.AseguradoraNav.Nombre,
                ContratistaId = p.Contratista,
                ContratistaNombre = p.ContratistaNav.Nombre,
                RamoId = p.Ramo,
                RamoNombre = p.RamoNav.Nombre,
                FechaEmision = p.FechaEmision,
                FechaExpiracion = p.FechaExpiracion,
                ValorOriginal = p.ValorOriginal,
                ValorActual = p.ValorActual,
                Observaciones = p.Observaciones,
                Estado = EstadoPolizaDerivado.Expirado
            })
            .ToListAsync();
        var totalVencidas = await vencidasQuery.SumAsync(p => p.ValorActual);
        var cuadreTotal = saldoInicial + totalVigentes - totalVencidas;

        var data = new ControlMaestroRes
        {
            Vigentes = new PagedResult<PolizaRes>
            {
                Items = vigentesItems,
                Total = totalVigentesCount,
            },
            Vencidas = new PagedResult<PolizaRes>
            {
                Items = vencidasItems,
                Total = totalVencidasCount,
            },
            TotalVigentes = totalVigentes,
            TotalVencidas = totalVencidas,
            SaldoInicial = saldoInicial,
            CuadreTotal = cuadreTotal
        };
        var reporteCodigo = $"SICOP-CM-{Guid.NewGuid():N}".ToUpperInvariant();
        var bytes = ControlMaestroPdfComposer.Generate(data, generadoEnUtc, LogoPath, reporteCodigo);

        var fileName = $"ControlMaestro-{generadoEnUtc:yyyyMMddHHmmss}.pdf";

        return (bytes, fileName);
    }

    /// <summary>
    /// Filtra por fecha de vencimiento (UI: «Vence desde» / «Vence hasta»).
    /// El frontend envía inicio/fin de día en ISO; comparación directa traducible a SQL.
    /// </summary>
    private static IQueryable<Domain.Models.Poliza> ApplyVencimientoRangeFilter(
        IQueryable<Domain.Models.Poliza> query,
        DateTimeOffset? fechaInicio,
        DateTimeOffset? fechaFin)
    {
        if (fechaInicio.HasValue)
        {
            var desde = fechaInicio.Value;
            query = query.Where(p => p.FechaExpiracion >= desde);
        }

        if (fechaFin.HasValue)
        {
            var hasta = fechaFin.Value;
            query = query.Where(p => p.FechaExpiracion <= hasta);
        }

        return query;
    }
}