using System.Security.Claims;
using Backend.Domain.Services;

namespace Backend.Infrastructure.Http;

public class CurrentUser : ICurrentUser
{
    public Guid UserId { get; }
    public string? Username { get; }
    public string? Email { get; }

    public CurrentUser(ClaimsPrincipal user)
    {
        var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? user.FindFirst("nameid")?.Value
            ?? throw new UnauthorizedAccessException("UserId claim not found");

        if (!Guid.TryParse(userIdClaim, out var userId))
            throw new UnauthorizedAccessException("Invalid UserId format");

        UserId = userId;

        Username = user.FindFirst(ClaimTypes.Name)?.Value
            ?? user.FindFirst("unique_name")?.Value;

        Email = user.FindFirst(ClaimTypes.Email)?.Value;
    }
}