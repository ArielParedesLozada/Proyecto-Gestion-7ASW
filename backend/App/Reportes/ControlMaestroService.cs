using Backend.App.Dtos;
using Backend.App.Polizas;
using Backend.Data.Databases;
using Backend.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Backend.App.Reportes;

public class ControlMaestroService(AppDatabase context)
{
    private readonly AppDatabase _context = context;
    public async Task<ControlMaestroRes> ObtenerControlMaestroAsync(
        int pageVigentes,
        int pageSizeVigentes,
        int pageVencidas,
        int pageSizeVencidas,
        decimal saldoInicial
    )
    {
        var baseQuery = _context.Polizas
            .AsNoTracking();
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
        int pageVigentes,
        int pageSizeVigentes,
        int pageVencidas,
        int pageSizeVencidas,
        decimal saldoInicial,
        DateTimeOffset generadoEnUtc
    )
    {
        var data = await ObtenerControlMaestroAsync(
            pageVigentes,
            pageSizeVigentes,
            pageVencidas,
            pageSizeVencidas,
            saldoInicial
        );

        var bytes = ControlMaestroPdfComposer.Generate(data, generadoEnUtc);

        var fileName = $"ControlMaestro-{generadoEnUtc:yyyyMMddHHmmss}.pdf";

        return (bytes, fileName);
    }
}