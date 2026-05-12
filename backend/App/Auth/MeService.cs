using Backend.Data.Repository;
using Backend.Domain.Errors;
using Backend.Domain.Models;

namespace Backend.App.Auth;

public class MeService(IRepository<User, Guid> userRepo)
{
    private readonly IRepository<User, Guid> _userRepo = userRepo;
    public async Task<User> GetMe(string userId)
    {
        var user = await _userRepo.FirstOrDefaultAsync(u => u.Id.ToString() == userId) ?? throw new CustomError("User not found", 404);
        if (user.MustChangePassword)
        {
            throw new CustomError("User Must Change Password", 400);
        }
        return user;
    }
}