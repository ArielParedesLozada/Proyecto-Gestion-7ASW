using Backend.Data.Repository;
using Backend.Domain.Models;

namespace Backend.App.Polizas;

public class RamoService(IRepository<Ramo, Guid> ramoRepo)
{
    private readonly IRepository<Ramo, Guid> _ramoRepo = ramoRepo;

    // ✅ Crear
    public async Task<Ramo> CreateRamo(string nombre, bool cambiaValor, string descripcion)
    {
        var ramo = new Ramo
        {
            Id = Guid.NewGuid(),
            Nombre = nombre,
            CambiaValor = cambiaValor,
            Descripcion = descripcion
        };

        return await _ramoRepo.CreateAsync(ramo);
    }

    // ✅ Obtener todos
    public async Task<IEnumerable<Ramo>> GetAllRamos()
    {
        return await _ramoRepo.GetAllAsync();
    }

    // ✅ Obtener por Id
    public async Task<Ramo?> GetRamoById(Guid id)
    {
        return await _ramoRepo.GetByIdAsync(id);
    }

    // ✅ Buscar
    public async Task<IEnumerable<Ramo>> FindEmpresas(string nombre)
    {
        return await _ramoRepo.FindAsync(r => r.Nombre.Contains(nombre));
    }

    public async Task<Ramo?> UpdateRamo(Guid id, string nombre, bool cambiaValor, string descripcion)
    {
        var ramo = await _ramoRepo.GetByIdAsync(id);
        if (ramo == null) return null;

        ramo.Nombre = nombre;
        ramo.CambiaValor = cambiaValor;
        ramo.Descripcion = descripcion;

        return await _ramoRepo.UpdateAsync(ramo);
    }

    public async Task<bool> DeleteRamo(Guid id)
    {
        var ramo = await _ramoRepo.GetByIdAsync(id);
        if (ramo == null) return false;

        await _ramoRepo.DeleteAsync(ramo);
        return true;
    }
}