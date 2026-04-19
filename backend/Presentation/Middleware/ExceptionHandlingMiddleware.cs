using Backend.Domain.Errors;
using Backend.Presentation.Dtos.Responses;
using System.Net;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Backend.Presentation.Middleware;

public class ExceptionHandlingMiddleware(RequestDelegate next)
{
    private readonly RequestDelegate _next = next;

    private static string DeepestExceptionMessage(Exception e)
    {
        var x = e;
        while (x.InnerException != null)
            x = x.InnerException;
        return x.Message;
    }

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

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

            var json = JsonSerializer.Serialize(response, JsonOptions);
            await context.Response.WriteAsync(json);
        }
        catch (Exception e)
        {
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            context.Response.ContentType = "application/json";

            var detail = DeepestExceptionMessage(e);
            var response = new ErrorDtoResponse
            {
                StatusCode = 500,
                Message = "An internal error occurred",
                Details = detail
            };

            var json = JsonSerializer.Serialize(response, JsonOptions);
            await context.Response.WriteAsync(json);
        }
    }
}
