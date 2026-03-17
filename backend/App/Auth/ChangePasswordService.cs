using Backend.Data.Repository;
using Backend.Domain.Errors;
using Backend.Domain.Models;

namespace Backend.App.Auth;

public class ChangePasswordService(IRepository<User, Guid> userRepo)
{
    private readonly IRepository<User, Guid> _userRepo = userRepo;

    public async Task<User> ChangePassword(string username, string currentPassword, string newPassword)
    {
        var user = await _userRepo.FirstOrDefaultAsync(u => u.Username == username) ?? throw new CustomError("User not found", 404);
        if (!user.MustChangePassword)
        {
            throw new CustomError("User cant change password", 400);
        }
        if (!BCrypt.Net.BCrypt.Verify(currentPassword, user.Password))
        {
            throw new CustomError("Wrong current password", 400);
        }
        user.Password = BCrypt.Net.BCrypt.HashPassword(newPassword);
        user.MustChangePassword = false;
        var userUpdated = await _userRepo.UpdateAsync(user);
        return userUpdated;
    }
}