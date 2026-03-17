using Microsoft.AspNetCore.Mvc;

namespace Backend.Presentation.Dtos.Responses;

public class ErrorDtoResponse
{
    public int StatusCode { get; set; }
    public string Message { get; set; } = "";
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? Details { get; set; }
}