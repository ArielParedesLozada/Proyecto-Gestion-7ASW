using Backend.Domain.Errors;
using Backend.Presentation.Dtos.Responses;
using System.Net;
using System.Text.Json;

namespace Backend.Presentation.Middleware;

public class ExceptionHandlingMiddleware(RequestDelegate next)
{
    private readonly RequestDelegate _next = next;

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (CustomError e)
        {
            context.Response.StatusCode = e.Code;
            context.Response.ContentType = "application/json";

            var response = new ErrorDtoResponse
            {
                StatusCode = e.Code,
                Message = e.Message,
                Details = e.StackTrace
            };

            var json = JsonSerializer.Serialize(response);
            await context.Response.WriteAsync(json);
        }
        catch (Exception e)
        {
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            context.Response.ContentType = "application/json";

            var response = new ErrorDtoResponse
            {
                StatusCode = 500,
                Message = "An internal error occurred",
                Details = e.Message
            };

            var json = JsonSerializer.Serialize(response);
            await context.Response.WriteAsync(json);
        }
    }
}