namespace Backend.Domain.Models;

public class PasswordReset
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }

    public string TokenHash { get; set; } = null!;
    public DateTime ExpiresAt { get; set; }

    public bool Used { get; set; } = false;
}