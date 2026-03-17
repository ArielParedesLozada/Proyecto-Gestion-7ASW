namespace Backend.Domain.Errors;

public class CustomError : Exception
{
    public int Code { get; set; }
    public CustomError(string? message, int code) : base(message)
    {
        this.Code = code;
    }
    public CustomError(string? message) : base(message)
    {
        this.Code = 500;
    }
}