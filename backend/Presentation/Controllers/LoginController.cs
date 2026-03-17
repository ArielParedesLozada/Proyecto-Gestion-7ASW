using Backend.Domain.Errors;
using Backend.App.Auth;
using Backend.Presentation.Dtos.Requests;
using Backend.Presentation.Dtos.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Presentation.Controllers;

[ApiController]
[Route("login")]
public class LoginController : ControllerBase
{
    private readonly LoginService _loginService;

    public LoginController(LoginService loginService)
    {
        _loginService = loginService;
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<ActionResult<LoginDtoResponse>> Login([FromBody] LoginDtoRequest request)
    {
        try
        {
            var result = await _loginService.Login(request.Username, request.Password);

            return Ok(new LoginDtoResponse
            {
                Username = result.Username,
                Role = result.Role,
                Token = result.Token
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