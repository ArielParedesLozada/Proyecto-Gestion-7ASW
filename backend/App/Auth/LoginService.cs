using Backend.Data.Repository;
using Backend.Domain.Dtos;
using Backend.Domain.Errors;
using Backend.Domain.Models;
using Backend.Domain.Services;

namespace Backend.App.Auth;

public class LoginService(IRepository<User, Guid> userRepo, ITokenGenerator tokenGenerator)
{
    private readonly IRepository<User, Guid> _userRepo = userRepo;
    private readonly ITokenGenerator _tokenGenerator = tokenGenerator;

    public async Task<LoginResult> Login(string username, string password)
    {
        var user = await _userRepo.FirstOrDefaultAsync(u => u.Username == username) ?? throw new CustomError("User not found", 404);
        if (!BCrypt.Net.BCrypt.Verify(password, user.Password))
        {
            throw new CustomError("Wrong password", 400);
        }
        string token = _tokenGenerator.GenerateToken(user);
        return new LoginResult
        {
            Username = user.Username,
            Role = user.Role,
            Token = token
        };
    }
}