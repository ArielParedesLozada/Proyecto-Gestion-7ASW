using Backend.App.Dtos;
using Backend.Data.Databases;
using Backend.Data.Repository;
using Backend.Domain.Errors;
using Backend.Domain.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.App.Polizas;

public class AseguradorasService(IRepository<Aseguradora, Guid> aseguradoraRepo, AppDatabase database)
{
    private readonly IRepository<Aseguradora, Guid> _aseguradoraRepo = aseguradoraRepo;
    private readonly AppDatabase _database = database;

    private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();

    public async Task<Aseguradora> CreateAseguradora(string nombre, string email)
    {
        var nombreTrim = nombre.Trim();
        if (string.IsNullOrWhiteSpace(nombreTrim))
            throw new CustomError("El nombre es obligatorio.", 400);

        var normalizedEmail = NormalizeEmail(email);
        if (string.IsNullOrWhiteSpace(normalizedEmail))
            throw new CustomError("El correo es obligatorio.", 400);

        var duplicado = await _aseguradoraRepo.FirstOrDefaultAsync(e => e.Email == normalizedEmail);
        if (duplicado != null)
            throw new CustomError("Ya existe una aseguradora con ese correo electrónico.", 409);

        var aseguradora = new Aseguradora
        {
            Id = Guid.NewGuid(),
            Nombre = nombreTrim,
            Email = normalizedEmail
        };

        return await _aseguradoraRepo.CreateAsync(aseguradora);
    }

    public async Task<PagedResult<Aseguradora>> GetAllAseguradoras(int page = 1, int pageSize = 10, string? nameOrEmail = "")
    {
        if (page <= 0) page = 1;
        if (pageSize <= 0) pageSize = 10;
        var query = _database.Aseguradoras.AsQueryable();

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

        return new PagedResult<Aseguradora>
        {
            Items = items,
            Total = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<Aseguradora?> GetAseguradoraById(Guid id)
    {
        return await _aseguradoraRepo.GetByIdAsync(id);
    }

    public async Task<IEnumerable<Aseguradora>> FindAseguradora(string nombre)
    {
        return await _aseguradoraRepo.FindAsync(e => e.Nombre.Contains(nombre));
    }

    public async Task<Aseguradora?> UpdateAseguradora(Guid id, string nombre, string email)
    {
        var nombreTrim = nombre.Trim();
        if (string.IsNullOrWhiteSpace(nombreTrim))
            throw new CustomError("El nombre es obligatorio.", 400);

        var normalizedEmail = NormalizeEmail(email);
        if (string.IsNullOrWhiteSpace(normalizedEmail))
            throw new CustomError("El correo es obligatorio.", 400);

        var aseguradora = await _aseguradoraRepo.GetByIdAsync(id);
        if (aseguradora == null) return null;

        var duplicado = await _aseguradoraRepo.FirstOrDefaultAsync(e => e.Email == normalizedEmail && e.Id != id);
        if (duplicado != null)
            throw new CustomError("Ya existe una aseguradora con ese correo electrónico.", 409);

        aseguradora.Nombre = nombreTrim;
        aseguradora.Email = normalizedEmail;

        return await _aseguradoraRepo.UpdateAsync(aseguradora);
    }

    public async Task<bool> DeleteAseguradora(Guid id)
    {
        var aseguradora = await _aseguradoraRepo.GetByIdAsync(id);
        if (aseguradora == null) return false;

        await _aseguradoraRepo.DeleteAsync(aseguradora);
        return true;
    }
}
