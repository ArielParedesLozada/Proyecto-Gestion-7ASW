using Backend.App.Auth;
using Backend.Data.Repository;
using Backend.Domain.Dtos;
using Backend.Domain.Errors;
using Backend.Domain.Models;
using Backend.Domain.Services;
using Moq;
using System.Linq.Expressions;
using Xunit;

namespace TestUnitaria;

/// <summary>
/// Pruebas unitarias de LoginService.
/// Se mockea IRepository&lt;User&gt; e ITokenGenerator para aislar la lógica de autenticación.
/// </summary>
public class LoginServiceTests
{
    private readonly Mock<IRepository<User, Guid>> _userRepoMock = new();
    private readonly Mock<ITokenGenerator> _tokenGenMock = new();
    private LoginService Sut => new(_userRepoMock.Object, _tokenGenMock.Object);

    private static User CrearUsuarioMock(string username = "admin", string password = "Admin@123", string role = "ADMIN")
    {
        var hashed = BCrypt.Net.BCrypt.HashPassword(password);
        return new User(username, hashed, role, $"{username}@test.com")
        {
            Id = Guid.NewGuid(),
            MustChangePassword = false
        };
    }

    // ── 1. Login exitoso con credenciales válidas ──────────────────────
    [Fact]
    public async Task Login_ConCredencialesValidas_RetornaLoginResult()
    {
        var user = CrearUsuarioMock();
        _userRepoMock
            .Setup(r => r.FirstOrDefaultAsync(It.IsAny<Expression<Func<User, bool>>>()))
            .ReturnsAsync(user);
        _tokenGenMock
            .Setup(t => t.GenerateToken(user))
            .Returns("jwt-token-mock");

        var result = await Sut.Login("admin", "Admin@123");

        Assert.Equal("admin", result.Username);
        Assert.Equal("ADMIN", result.Role);
        Assert.Equal("jwt-token-mock", result.Token);
        Assert.False(result.MustChangePassword);
    }

    // ── 2. Usuario no encontrado lanza 404 ────────────────────────────
    [Fact]
    public async Task Login_UsuarioNoExiste_LanzaCustomError404()
    {
        _userRepoMock
            .Setup(r => r.FirstOrDefaultAsync(It.IsAny<Expression<Func<User, bool>>>()))
            .ReturnsAsync((User?)null);

        var ex = await Assert.ThrowsAsync<CustomError>(() => Sut.Login("noexiste", "pass"));
        Assert.Equal(404, ex.Code);
    }

    // ── 3. Contraseña incorrecta lanza 400 ────────────────────────────
    [Fact]
    public async Task Login_PasswordIncorrecta_LanzaCustomError400()
    {
        var user = CrearUsuarioMock(password: "CorrectPass");
        _userRepoMock
            .Setup(r => r.FirstOrDefaultAsync(It.IsAny<Expression<Func<User, bool>>>()))
            .ReturnsAsync(user);

        var ex = await Assert.ThrowsAsync<CustomError>(() => Sut.Login("admin", "WrongPass"));
        Assert.Equal(400, ex.Code);
    }

    // ── 4. Login retorna MustChangePassword = true ────────────────────
    [Fact]
    public async Task Login_UsuarioConCambioObligatorio_RetornaMustChangePasswordTrue()
    {
        var user = CrearUsuarioMock();
        user.MustChangePassword = true;
        _userRepoMock
            .Setup(r => r.FirstOrDefaultAsync(It.IsAny<Expression<Func<User, bool>>>()))
            .ReturnsAsync(user);
        _tokenGenMock.Setup(t => t.GenerateToken(user)).Returns("t");

        var result = await Sut.Login("admin", "Admin@123");

        Assert.True(result.MustChangePassword);
    }
}
