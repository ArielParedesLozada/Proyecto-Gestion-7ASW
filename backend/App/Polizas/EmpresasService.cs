using Backend.Data.Repository;
using Backend.Domain.Errors;
using Backend.Domain.Models;

namespace Backend.App.Polizas;

public class EmpresasService(IRepository<Empresa, Guid> empresaRepo)
{
    private readonly IRepository<Empresa, Guid> _empresaRepo = empresaRepo;

    public async Task<Empresa> CreateEmpresa(string nombre, string? email)
    {
        var nombreTrim = nombre.Trim();
        if (string.IsNullOrWhiteSpace(nombreTrim))
            throw new CustomError("El nombre es obligatorio.", 400);

        var empresa = new Empresa
        {
            Id = Guid.NewGuid(),
            Nombre = nombreTrim,
            Email = email ?? ""
        };

        return await _empresaRepo.CreateAsync(empresa);
    }

    public async Task<IEnumerable<Empresa>> GetAllEmpresas()
    {
        var items = await _empresaRepo.GetAllAsync();
        return items.OrderBy(e => e.Nombre);
    }

    public async Task<Empresa?> GetEmpresaById(Guid id)
    {
        return await _empresaRepo.GetByIdAsync(id);
    }

    public async Task<IEnumerable<Empresa>> FindEmpresa(string nombre)
    {
        return await _empresaRepo.FindAsync(e => e.Nombre.Contains(nombre));
    }

    public async Task<Empresa?> UpdateEmpresa(Guid id, string nombre)
    {
        var nombreTrim = nombre.Trim();
        if (string.IsNullOrWhiteSpace(nombreTrim))
            throw new CustomError("El nombre es obligatorio.", 400);

        var empresa = await _empresaRepo.GetByIdAsync(id);
        if (empresa == null) return null;

        empresa.Nombre = nombreTrim;

        return await _empresaRepo.UpdateAsync(empresa);
    }

    public async Task<bool> DeleteEmpresa(Guid id)
    {
        var empresa = await _empresaRepo.GetByIdAsync(id);
        if (empresa == null) return false;

        await _empresaRepo.DeleteAsync(empresa);
        return true;
    }
}
