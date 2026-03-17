using System.Linq.Expressions;

namespace Backend.Data.Repository;

public interface IRepository<T, TKey> where T : class
{
    Task<IEnumerable<T>> GetAllAsync();
    Task<(IEnumerable<T> Items, int TotalCount)> GetAllPagedAsync(int page, int pageSize);
    Task<T?> GetByIdAsync(TKey id);
    Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate);
    Task<IEnumerable<T>> FindPagedAsync(Expression<Func<T, bool>> predicate, int page, int pageSize);
    Task<T?> FirstOrDefaultAsync(Expression<Func<T, bool>> predicate);
    Task<T> CreateAsync(T entity);
    Task<T> UpdateAsync(T entity);
    Task DeleteAsync(T entity);
    Task DeleteWhereAsync(Expression<Func<T, bool>> predicate);
}