using Backend.App.Dtos;
using Backend.Data.Databases;
using Backend.Data.Repository;
using Backend.Domain.Errors;
using Backend.Domain.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace Backend.App.Polizas;

public class EmpresasService(IRepository<Empresa, Guid> empresaRepo, AppDatabase database)
{
    private readonly IRepository<Empresa, Guid> _empresaRepo = empresaRepo;
    private readonly AppDatabase _database = database;

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

    public async Task<PagedResult<Empresa>> GetAllEmpresas(int page = 1, int pageSize = 10, string? nameOrEmail = "")
    {
        if (page <= 0) page = 1;
        if (pageSize <= 0) pageSize = 10;
        var query = _database.Empresas.AsQueryable();

        if (!string.IsNullOrWhiteSpace(nameOrEmail))
        {
            query = query.Where(e =>
                e.Nombre.ToLower().Contains(nameOrEmail) ||
                e.Email.ToLower().Contains(nameOrEmail)
            );
        }

        var total = await query.CountAsync();

        var items = await query
            .OrderBy(e => e.Nombre)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
        return new PagedResult<Empresa>
        {
            Items = items,
            Total = total,
            Page = page,
            PageSize = pageSize
        };
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
