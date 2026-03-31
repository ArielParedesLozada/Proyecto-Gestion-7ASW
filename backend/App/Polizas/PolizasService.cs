using Backend.Data.Repository;
using Backend.Domain.Enums;
using Backend.Domain.Models;
using Backend.Presentation.Dtos.Requests;

namespace Backend.App.Polizas;

public class PolizaService(IRepository<Poliza, Guid> polizaRepo)
{
    private readonly IRepository<Poliza, Guid> _polizaRepo = polizaRepo;

    // ✅ Crear
    public async Task<Poliza> CrearAsync(PolizaRequest request)
    {
        var poliza = new Poliza
        {
            Id = Guid.NewGuid(),
            Numero = request.Numero,
            Contratista = request.Contratista,
            Obra = request.Obra,
            Ramo = request.Ramo,
            Aseguradora = request.Aseguradora,
            FechaEmision = request.FechaEmision,
            FechaExpiracion = request.FechaExpiracion,
            ValorOriginal = request.ValorOriginal,
            ValorActual = request.ValorOriginal,
            Estado = EstadoPoliza.Vigente, // ajusta según tu enum
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        return await _polizaRepo.CreateAsync(poliza);
    }

    // ✅ Obtener paginado + búsqueda
    public async Task<(IEnumerable<Poliza>, int)> ObtenerPaginadoAsync(
        int page,
        int pageSize,
        string? search)
    {
        if (!string.IsNullOrWhiteSpace(search))
        {
            var items = await _polizaRepo.FindPagedAsync(
                p => p.Numero.Contains(search) || p.Obra.Contains(search),
                page,
                pageSize
            );

            var total = (await _polizaRepo.FindAsync(
                p => p.Numero.Contains(search) || p.Obra.Contains(search)
            )).Count();

            return (items, total);
        }

        return await _polizaRepo.GetAllPagedAsync(page, pageSize);
    }

    // ✅ Obtener por Id
    public async Task<Poliza?> ObtenerPorIdAsync(Guid id)
    {
        return await _polizaRepo.GetByIdAsync(id);
    }
}