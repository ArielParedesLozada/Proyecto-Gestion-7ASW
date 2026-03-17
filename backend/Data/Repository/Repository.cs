using System.Linq.Expressions;
using Backend.Data.Databases;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data.Repository;

public class Repository<T, TKey> : IRepository<T, TKey> where T : class
{
    protected readonly AppDatabase _context;
    protected readonly DbSet<T> _dbSet;

    public Repository(AppDatabase context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }
    public async Task<T> CreateAsync(T entity)
    {
        await _dbSet.AddAsync(entity);
        await _context.SaveChangesAsync();
        return entity;
    }
    public async Task DeleteAsync(T entity)
    {
        _dbSet.Remove(entity);
        await _context.SaveChangesAsync();
    }
    public async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
    {
        return await _dbSet.AsNoTracking().Where(predicate).ToListAsync();
    }
    public async Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate)
    {
        return await _dbSet.AsNoTracking().FirstOrDefaultAsync(predicate);
    }
    public async Task<IEnumerable<T>> GetAllAsync()
    {
        return await _dbSet.AsNoTracking().ToListAsync();
    }
    public async Task<T?> GetByIdAsync(TKey id)
    {
        return await _dbSet.FindAsync(id);
    }
    public async Task<T> UpdateAsync(T entity)
    {
        _dbSet.Update(entity);
        await _context.SaveChangesAsync();
        return entity;
    }
    public async Task<(IEnumerable<T> Items, int TotalCount)> GetAllPagedAsync(int page, int pageSize)
    {
        if (page <= 0) page = 1;
        if (pageSize <= 0) pageSize = 10;

        var totalCount = await _dbSet.AsNoTracking().CountAsync();
        var items = await _dbSet
            .AsNoTracking()
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }
    public async Task<IEnumerable<T>> FindPagedAsync(Expression<Func<T, bool>> predicate, int page, int pageSize)
    {
        if (page <= 0) page = 1;
        if (pageSize <= 0) pageSize = 10;
        var items = await _dbSet
            .AsNoTracking()
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
        return items;
    }

    public async Task DeleteWhereAsync(Expression<Func<T, bool>> predicate)
    {
        await _dbSet
            .Where(predicate)
            .ExecuteDeleteAsync();
    }
}