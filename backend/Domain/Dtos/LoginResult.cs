namespace Backend.Domain.Dtos;

public class LoginResult
{
    public string Username { get; set; } = null!;
    public string Role { get; set; } = null!;
    public string Token { get; set; } = null!;
    public string Email { get; set; } = null!;
    public bool MustChangePassword { get; set; }
}
