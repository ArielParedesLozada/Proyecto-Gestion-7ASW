namespace Backend.Presentation.Dtos.Responses;

public class UserDtoResponse
{
    public Guid Id { get; set; }
    public string Username { get; set; }
    public string Email { get; set; }
    public bool MustChangePassword { get; set; }
    public string Role { get; set; }

}