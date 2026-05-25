using Backend.Data.Repository;
using Backend.Domain.Errors;
using Backend.Domain.Models;

namespace Backend.App.Auth;

public class ChangePasswordService(IRepository<User, Guid> userRepo)
{
    private readonly IRepository<User, Guid> _userRepo = userRepo;

    public async Task<User> ChangePassword(
        Guid userId,
        string currentPassword,
        string newPassword,
        string confirmNewPassword)
    {
        var user = await _userRepo.GetByIdAsync(userId)
            ?? throw new CustomError("Usuario no encontrado.", 404);
        if (!user.MustChangePassword)
        {
            throw new CustomError("No es necesario cambiar la contraseña en este momento.", 400);
        }
        if (string.IsNullOrWhiteSpace(currentPassword))
        {
            throw new CustomError("La contraseña actual es obligatoria.", 400);
        }
        if (string.IsNullOrWhiteSpace(newPassword))
        {
            throw new CustomError("La nueva contraseña es obligatoria.", 400);
        }
        if (newPassword.Length < 4)
        {
            throw new CustomError("La nueva contraseña debe tener al menos 4 caracteres.", 400);
        }
        if (string.IsNullOrWhiteSpace(confirmNewPassword))
        {
            throw new CustomError("Debe confirmar la nueva contraseña.", 400);
        }
        if (!string.Equals(newPassword, confirmNewPassword, StringComparison.Ordinal))
        {
            throw new CustomError("La confirmación no coincide con la nueva contraseña.", 400);
        }
        if (string.Equals(newPassword, currentPassword, StringComparison.Ordinal))
        {
            throw new CustomError("La nueva contraseña debe ser distinta de la actual.", 400);
        }
        if (!BCrypt.Net.BCrypt.Verify(currentPassword, user.Password))
        {
            throw new CustomError("La contraseña actual no es correcta.", 400);
        }
        user.Password = BCrypt.Net.BCrypt.HashPassword(newPassword);
        user.MustChangePassword = false;
        var userUpdated = await _userRepo.UpdateAsync(user);
        return userUpdated;
    }
}