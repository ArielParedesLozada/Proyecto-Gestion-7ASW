using System.Threading.Tasks;
using Backend.Data.Repository;
using Backend.Domain.Errors;
using Backend.Domain.Models;

namespace Backend.App.Auth;

public class UserService(IRepository<User, Guid> userRepo)
{
    private readonly IRepository<User, Guid> _userRepo = userRepo;

    public async Task<(IEnumerable<User>, int)> ListUsers(int page, int pageSize)
    {
        var usersPaginated = await _userRepo.GetAllPagedAsync(page, pageSize);
        return usersPaginated;
    }
    public async Task<User> FindUserById(Guid id)
    {
        var user = await _userRepo.GetByIdAsync(id) ?? throw new CustomError("User not found", 404);
        return user;
    }
    public async Task<User> FindUserByUsername(string username)
    {
        var user = await _userRepo.FirstOrDefaultAsync(u => u.Username == username) ?? throw new CustomError("User not found", 404);
        return user;
    }
    public async Task<User> CreateUser(string username, string password, string role, string email)
    {
        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(password);
        var user = new User(username, hashedPassword, role, email)
        {
            MustChangePassword = true
        };
        var created = await _userRepo.CreateAsync(user);
        return created;
    }
    public async Task<User> UpdateUser(Guid id, string username, string password, string role)
    {
        var user = await _userRepo.GetByIdAsync(id) ?? throw new CustomError("User not found", 404);
        if (!string.IsNullOrWhiteSpace(username))
        {
            user.Username = username;
        }
        if (!string.IsNullOrWhiteSpace(password))
        {
            var hashedPassword = BCrypt.Net.BCrypt.HashPassword(password);
            user.Password = hashedPassword;
            user.MustChangePassword = true;
        }
        if (!string.IsNullOrWhiteSpace(role))
        {
            user.Role = role;
        }
        var updated = await _userRepo.UpdateAsync(user);
        return updated;
    }
    public async Task<User> DeleteUser(Guid id)
    {
        var user = await _userRepo.GetByIdAsync(id) ?? throw new CustomError("User not found", 404);
        await _userRepo.DeleteAsync(user);
        return user;
    }
}