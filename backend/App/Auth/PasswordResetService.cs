using System.Security.Cryptography;
using System.Text;
using Backend.Data.Repository;
using Backend.Domain.Errors;
using Backend.Domain.Models;
using Backend.Domain.Services;

namespace Backend.App.Auth;

public class PasswordResetService(IRepository<User, Guid> userRepo, IRepository<PasswordReset, Guid> tokenRepo, INotifier notifier, string resetLink)
{
    private readonly IRepository<User, Guid> _userRepo = userRepo;
    private readonly IRepository<PasswordReset, Guid> _tokenRepo = tokenRepo;
    private readonly INotifier _notifier = notifier;
    private readonly string _baseLink = resetLink;

    private const int TOKEN_EXPIRATION_MINUTES = 15;

    public async Task RequestPasswordReset(string email)
    {
        var user = await _userRepo.FirstOrDefaultAsync(u => u.Email == email)
            ?? throw new CustomError("User not found", 404);
        var existingTokens = await _tokenRepo.FindAsync(t => t.UserId == user.Id && !t.Used);
        foreach (var t in existingTokens)
        {
            t.Used = true;
            await _tokenRepo.UpdateAsync(t);
        }
        var rawToken = GenerateSecureToken();
        var tokenHash = HashToken(rawToken);
        var resetToken = new PasswordReset
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            TokenHash = tokenHash,
            ExpiresAt = DateTime.UtcNow.AddMinutes(TOKEN_EXPIRATION_MINUTES),
            Used = false
        };

        await _tokenRepo.CreateAsync(resetToken);

        // 🌐 5. Generar link (esto debería venir de config)
        var resetLink = $"{_baseLink}/reset-password?token={rawToken}";

        // ✉️ 6. Enviar notificación
        await _notifier.SendAsync(
            user.Email,
            "Recuperación de contraseña",
            BuildEmailTemplate(resetLink)
        );
    }
    public async Task ResetPassword(string token, string newPassword)
    {
        // 🔐 1. Hashear token recibido
        var tokenHash = HashToken(token);

        // 🔍 2. Buscar token en DB
        var reset = await _tokenRepo.FirstOrDefaultAsync(t => t.TokenHash == tokenHash)
            ?? throw new CustomError("Invalid or expired token", 400);

        // ⛔ 3. Validaciones
        if (reset.Used)
            throw new CustomError("Token already used", 400);

        if (reset.ExpiresAt < DateTime.UtcNow)
            throw new CustomError("Token expired", 400);

        // 👤 4. Obtener usuario
        var user = await _userRepo.GetByIdAsync(reset.UserId)
            ?? throw new CustomError("User not found", 404);

        // 🔐 5. Hashear nueva contraseña
        var hashedPassword = BCrypt.Net.BCrypt.HashPassword(newPassword);

        user.Password = hashedPassword;
        user.MustChangePassword = false;

        await _userRepo.UpdateAsync(user);

        // ✅ 6. Marcar token como usado
        reset.Used = true;
        await _tokenRepo.UpdateAsync(reset);
    }


    private static string GenerateSecureToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(bytes);
    }

    private static string HashToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToBase64String(bytes);
    }

    private static string BuildEmailTemplate(string link)
    {
        return $@"
        <h3>Recuperación de contraseña</h3>
        <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
        <a href='{link}'>Restablecer contraseña</a>
        <p>Este enlace expirará en 15 minutos.</p>
        <p>Si no solicitaste este cambio, ignora este mensaje.</p>
        ";
    }
}