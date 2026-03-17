namespace Backend.Domain.Models;

public class User(string username, string password, string role)
{
    public Guid Id { get; set; }
    public string Username { get; set; } = username;
    public string Password { get; set; } = password;
    public bool MustChangePassword { get; set; }
    public string Role { get; set; } = role;
}