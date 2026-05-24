using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Backend.App.Auth;
using Backend.Domain.Services;
using Backend.Presentation.Dtos.Requests;
using Backend.Presentation.Dtos.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Presentation.Controllers;

[ApiController]
[Route("auth")]
public class AuthController(
    MeService meService,
    LoginService loginService,
    ChangePasswordService changePasswordService,
    PasswordResetService passwordResetService,
    ITokenGenerator tokenGenerator) : ControllerBase
{
    private readonly MeService _meService = meService;
    private readonly LoginService _loginService = loginService;
    private readonly ChangePasswordService _changePasswordService = changePasswordService;
    private readonly PasswordResetService _passwordResetService = passwordResetService;
    private readonly ITokenGenerator _tokenGenerator = tokenGenerator;

    /// <summary>
    /// Con MapInboundClaims = false el JWT expone el id como "nameid", no como ClaimTypes.NameIdentifier.
    /// </summary>
    private static Guid? ResolveUserId(ClaimsPrincipal user)
    {
        string?[] claimTypes =
        [
            ClaimTypes.NameIdentifier,
            JwtRegisteredClaimNames.Sub,
            "nameid",
        ];

        foreach (var claimType in claimTypes)
        {
            var value = user.FindFirst(claimType)?.Value;
            if (Guid.TryParse(value, out var userId))
            {
                return userId;
            }
        }

        return null;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginDtoResponse>> Login([FromBody] LoginDtoRequest request)
    {
        var result = await _loginService.Login(request.Username, request.Password);

        return Ok(new LoginDtoResponse
        {
            Username = result.Username,
            Role = result.Role,
            Token = result.Token,
            Email = result.Email,
            MustChangePassword = result.MustChangePassword
        });
    }

    [HttpGet("me")]
    [Authorize(Policy = "ACCESS-GRANTED")]
    public async Task<ActionResult<UserDtoResponse>> Me()
    {
        var userId = ResolveUserId(User);
        if (userId is null)
        {
            return Unauthorized();
        }

        var response = await _meService.GetMe(userId.Value.ToString());
        return Ok(new UserDtoResponse
        {
            Id = response.Id,
            Role = response.Role,
            Username = response.Username,
            MustChangePassword = response.MustChangePassword,
            Email = response.Email
        });
    }
    [HttpPost("change-password")]
    [Authorize(Policy = "MUST-CHANGE-PASSWORD")]
    public async Task<ActionResult<LoginDtoResponse>> ChangePassword([FromBody] ChangePasswordRequest changePasswordRequest)
    {
        var userId = ResolveUserId(User);
        if (userId is null)
        {
            return Unauthorized();
        }

        var user = await _changePasswordService.ChangePassword(
            userId.Value,
            changePasswordRequest.OldPassword,
            changePasswordRequest.NewPassword,
            changePasswordRequest.ConfirmNewPassword);
        var token = _tokenGenerator.GenerateToken(user);
        return Ok(new LoginDtoResponse
        {
            Username = user.Username,
            Role = user.Role,
            Token = token,
            Email = user.Email,
            MustChangePassword = user.MustChangePassword
        });
    }

    [HttpPost("request-password-reset")]
    [AllowAnonymous]
    public async Task<ActionResult> RequestPasswordReset([FromBody] RequestPasswordResetRequest request)
    {
        await _passwordResetService.RequestPasswordReset(request.Email);

        // ⚠️ Mensaje genérico por seguridad (no revelar si existe el usuario)
        return Ok(new
        {
            message = "Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña."
        });
    }
    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<ActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        await _passwordResetService.ResetPassword(request.Token, request.NewPassword);

        return Ok(new
        {
            message = "Password updated successfully"
        });
    }
}
