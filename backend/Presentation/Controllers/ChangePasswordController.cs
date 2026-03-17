using Backend.Domain.Errors;
using Backend.App.Auth;
using Backend.Presentation.Dtos.Requests;
using Backend.Presentation.Dtos.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Presentation.Controllers;

[ApiController]
[Route("change-password")]
public class ChangePasswordController(ChangePasswordService changePasswordService) : ControllerBase
{
    private readonly ChangePasswordService _changePasswordService = changePasswordService;
    [HttpPost]
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
}