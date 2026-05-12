using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Backend.Domain.Models;
using Backend.Domain.Services;
using Microsoft.IdentityModel.Tokens;

namespace Backend.Infrastructure.Security;

public class JwtTokenGenerator(string privateKeyPath, double jwtTime, string issuer, string audience) : ITokenGenerator
{
    private readonly JwtSecurityTokenHandler _tokenHandler = new();
    private readonly string _privateKeyPath = privateKeyPath;
    private readonly string _issuer = issuer;
    private readonly string _audience = audience;
    private readonly double _time = jwtTime;

    public string GenerateToken(User user)
    {
        var rsa = KeyLoader.LoadRsaKey(_privateKeyPath);
        var expiration = DateTime.UtcNow.AddHours(_time);
        Claim[] claims =
        [
          new Claim(ClaimTypes.Role, user.Role),
          new Claim(ClaimTypes.Name, user.Username),
          new Claim("must_change_password", user.MustChangePassword.ToString().ToLower())
        ];
        var signCredentials = new SigningCredentials(new RsaSecurityKey(rsa), SecurityAlgorithms.RsaSha256);
        var tokenDesc = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = expiration,
            Issuer = _issuer,
            Audience = _audience,
            SigningCredentials = signCredentials
        };
        var token = _tokenHandler.CreateToken(tokenDesc);
        return _tokenHandler.WriteToken(token);
    }
}