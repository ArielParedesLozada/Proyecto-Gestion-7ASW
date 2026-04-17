using Backend.Data.Repository;
using Backend.Domain.Models;

namespace Backend.App.Polizas;

public class RamoService(IRepository<Ramo, Guid> ramoRepo)
{
    private readonly IRepository<Ramo, Guid> _ramoRepo = ramoRepo;

    // ✅ Crear
    public async Task<Ramo> CreateRamo(string nombre, bool cambiaValor, string descripcion)
    {
        var nombreTrim = nombre.Trim();
        var descripcionTrim = descripcion.Trim();
        var ramo = new Ramo
        {
            Id = Guid.NewGuid(),
            Nombre = nombreTrim,
            CambiaValor = cambiaValor,
            Descripcion = descripcionTrim
        };

        return await _ramoRepo.CreateAsync(ramo);
    }

    // ✅ Obtener todos
    public async Task<IEnumerable<Ramo>> GetAllRamos()
    {
        var items = await _ramoRepo.GetAllAsync();
        return items.OrderBy(r => r.Nombre);
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

        ramo.Nombre = nombre.Trim();
        ramo.CambiaValor = cambiaValor;
        ramo.Descripcion = descripcion.Trim();

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