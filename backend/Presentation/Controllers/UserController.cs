using Backend.Domain.Errors;
using Backend.Domain.Models;
using Backend.App.Auth;
using Backend.Presentation.Dtos.Requests;
using Backend.Presentation.Dtos.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Presentation.Controllers;

[ApiController]
[Route("users")]
public class UserController(UserService userService) : ControllerBase
{
    private readonly UserService _userService = userService;
    [HttpGet]
    [Authorize(Policy = "ADMIN-ACCESS")]
    public async Task<ActionResult<PagedDtoResponse<UserDtoResponse>>> GetUsersPaged(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10)
    {
        var (users, total) = await _userService.ListUsers(pageNumber, pageSize); //return Task<(IEnumerable<Domain.Models.User>, int)> 
        var usersMapped = users.Select(Map);
        return Ok(new PagedDtoResponse<UserDtoResponse>
        {
            Items = usersMapped,
            TotalCount = total
        });
    }
    [HttpGet("{id}")]
    [Authorize(Policy = "ADMIN-ACCESS")]
    public async Task<ActionResult<UserDtoResponse>> GetUserById(Guid id)
    {
        var user = await _userService.FindUserById(id);
        return Ok(Map(user));
    }
    [HttpGet("by-username/{username}")]
    [Authorize(Policy = "ADMIN-ACCESS")]
    public async Task<ActionResult<UserDtoResponse>> GetUserByUsername(string username)
    {
        var user = await _userService.FindUserByUsername(username);
        return Ok(Map(user));
    }
    [HttpPost]
    [Authorize(Policy = "ADMIN-ACCESS")]
    public async Task<ActionResult<UserDtoResponse>> CreateUser([FromBody] UserRequest userRequest)
    {
        var username = userRequest.Username;
        var password = userRequest.Password;
        var role = userRequest.Role;
        var email = userRequest.Email;
        var user = await _userService.CreateUser(username, password, role, email);
        return Ok(Map(user));
    }
    [HttpPut("{id}")]
    [Authorize(Policy = "ADMIN-ACCESS")]
    public async Task<ActionResult<UserDtoResponse>> UpdateUser(Guid id, [FromBody] UserRequest userRequest)
    {
        var username = userRequest.Username;
        var password = userRequest.Password;
        var role = userRequest.Role;
        var email = userRequest.Email;
        var user = await _userService.UpdateUser(id, username, password, role, email, User.Identity?.Name);
        return Ok(Map(user));
    }
    [HttpDelete("{id}")]
    [Authorize(Policy = "ADMIN-ACCESS")]
    public async Task<ActionResult<UserDtoResponse>> DeleteUser(Guid id)
    {
        var user = await _userService.DeleteUser(id);
        return Ok(Map(user));
    }

    private static UserDtoResponse Map(User user)
    {
        var response = new UserDtoResponse
        {
            Id = user.Id,
            MustChangePassword = user.MustChangePassword,
            Role = user.Role,
            Username = user.Username,
            Email = user.Email
        };
        return response;
    }
}