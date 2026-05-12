namespace Backend.Domain.Services;

public interface ICurrentUser
{
    public Guid UserId { get; }
    public string Username { get; }
    public string Email { get; }
}