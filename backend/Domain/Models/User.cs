namespace Backend.Domain.Models;

public class User(string username, string password, string role, string email)
{
    public Guid Id { get; set; }
    public string Username { get; set; } = username;
    public string Password { get; set; } = password;
    public string Email { get; set; } = email;
    public bool MustChangePassword { get; set; }
    public string Role { get; set; } = role;
}