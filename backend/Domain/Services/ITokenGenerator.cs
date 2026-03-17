using Backend.Domain.Models;

namespace Backend.Domain.Services;
public interface ITokenGenerator
{
    string GenerateToken(User user);
}
