namespace Backend.Domain.Dtos;

public class LoginResult
{
    public string Username { get; set; }
    public string Role { get; set; }
    public string Token { get; set; }
}