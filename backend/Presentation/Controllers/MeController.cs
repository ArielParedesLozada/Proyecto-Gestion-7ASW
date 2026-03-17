using Backend.Domain.Errors;
using Backend.App.Auth;
using Backend.Presentation.Dtos.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Presentation.Controllers;

[ApiController]
[Route("me")]
public class MeController(MeService meService) : ControllerBase
{
    private readonly MeService _meService = meService;
    [HttpGet]
    [Authorize(Policy = "ACCESS-GRANTED")]
    public async Task<ActionResult<UserDtoResponse>> Me()
    {
        var username = User.Identity?.Name;
        try
        {
            var response = await _meService.GetMe(username);
            return Ok(new UserDtoResponse
            {
                Id = response.Id,
                Role = response.Role,
                Username = response.Username,
                MustChangePassword = response.MustChangePassword
            });
        }
        catch (CustomError e)
        {
            return StatusCode(e.Code, new ErrorDtoResponse
            {
                Message = e.Message,
                StatusCode = e.Code,
                Details = e.StackTrace,
            });
        }
        catch (System.Exception e)
        {
            return StatusCode(500, new ErrorDtoResponse
            {
                StatusCode = 500,
                Message = "An internal error occurred",
                Details = e.Message
            });
        }
    }
}