using Backend.Domain.Errors;
using Backend.App.Auth;
using Backend.Presentation.Dtos.Requests;
using Backend.Presentation.Dtos.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Presentation.Controllers;

[ApiController]
[Route("auth")]
public class AuthController(MeService meService, LoginService loginService, ChangePasswordService changePasswordService, PasswordResetService passwordResetService) : ControllerBase
{
    private readonly MeService _meService = meService;
    private readonly LoginService _loginService = loginService;
    private readonly ChangePasswordService _changePasswordService = changePasswordService;
    private readonly PasswordResetService _passwordResetService = passwordResetService;

    [HttpPost("login")]
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

    [HttpGet("me")]
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
    [HttpPost("change-password")]
    [Authorize(Policy = "MUST-CHANGE-PASSWORD")]
    public async Task<ActionResult<UserDtoResponse>> ChangePassword([FromBody] ChangePasswordRequest changePasswordRequest)
    {
        var username = User.Identity.Name;
        var oldPassword = changePasswordRequest.OldPassword;
        var newPassword = changePasswordRequest.NewPassword;
        try
        {
            var response = await _changePasswordService.ChangePassword(username, oldPassword, newPassword);
            return Ok(new UserDtoResponse
            {
                Id = response.Id,
                MustChangePassword = response.MustChangePassword,
                Role = response.Role,
                Username = response.Username
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

    [HttpPost("request-password-reset")]
    [AllowAnonymous]
    public async Task<ActionResult> RequestPasswordReset([FromBody] RequestPasswordResetRequest request)
    {
        try
        {
            await _passwordResetService.RequestPasswordReset(request.Email);

            // ⚠️ Mensaje genérico por seguridad (no revelar si existe el usuario)
            return Ok(new
            {
                message = "Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña."
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
    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<ActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        try
        {
            await _passwordResetService.ResetPassword(request.Token, request.NewPassword);

            return Ok(new
            {
                message = "Password updated successfully"
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