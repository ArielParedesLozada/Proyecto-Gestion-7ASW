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

    public async Task<LoginResult> Login(string usernameOrEmail, string password)
    {
        var user = await _userRepo.FirstOrDefaultAsync(u => u.Username == usernameOrEmail || u.Email == usernameOrEmail) ?? throw new CustomError("Invalid credentials found", 404);
        if (!BCrypt.Net.BCrypt.Verify(password, user.Password))
        {
            throw new CustomError("Invalid credentials", 400);
        }
        string token = _tokenGenerator.GenerateToken(user);
        return new LoginResult
        {
            Username = user.Username,
            Role = user.Role,
            Token = token,
            Email = user.Email,
            MustChangePassword = user.MustChangePassword
        };
    }
}
