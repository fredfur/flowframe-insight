using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FlowVision.API.Data;
using FlowVision.API.DTOs.Auth;
using FlowVision.API.Models;
using FlowVision.API.Models.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace FlowVision.API.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public AuthService(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<AuthResponseDto?> LoginAsync(LoginDto dto)
    {
        var user = await _db.AppUsers.FirstOrDefaultAsync(u => u.Email == dto.Email && u.IsActive);
        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            return null;
        user.LastLoginAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return BuildResponse(user);
    }

    public async Task<AuthResponseDto?> RegisterAsync(RegisterDto dto)
    {
        if (await _db.AppUsers.AnyAsync(u => u.Email == dto.Email))
            return null;
        var user = new AppUser
        {
            Name = dto.Name,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = dto.Role,
            SiteId = dto.SiteId
        };
        _db.AppUsers.Add(user);
        await _db.SaveChangesAsync();
        return BuildResponse(user);
    }

    public async Task<AuthResponseDto?> RefreshAsync(string refreshToken)
    {
        var principal = ValidateToken(refreshToken, true);
        var idClaim = principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (idClaim == null || !Guid.TryParse(idClaim, out var userId))
            return null;
        var user = await _db.AppUsers.FindAsync(userId);
        return user != null && user.IsActive ? BuildResponse(user) : null;
    }

    public async Task<AuthUserDto?> GetMeAsync(Guid userId)
    {
        var user = await _db.AppUsers.FindAsync(userId);
        return user == null ? null : new AuthUserDto { Id = user.Id, Name = user.Name, Email = user.Email, Role = user.Role.ToString(), SiteId = user.SiteId };
    }

    private AuthResponseDto BuildResponse(AppUser user)
    {
        var token = GenerateToken(user, false);
        var refresh = GenerateToken(user, true);
        return new AuthResponseDto
        {
            User = new AuthUserDto { Id = user.Id, Name = user.Name, Email = user.Email, Role = user.Role.ToString(), SiteId = user.SiteId },
            Token = token,
            RefreshToken = refresh
        };
    }

    private string GenerateToken(AppUser user, bool isRefresh)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["JwtSettings:Secret"] ?? "FlowVision-SuperSecretKey-Min32Chars!!"));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = isRefresh ? DateTime.UtcNow.AddDays(7) : DateTime.UtcNow.AddMinutes(15);
        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()), new Claim(ClaimTypes.Name, user.Email), new Claim(ClaimTypes.Role, user.Role.ToString()) };
        var token = new JwtSecurityToken(_config["JwtSettings:Issuer"], _config["JwtSettings:Audience"], claims, expires: expires, signingCredentials: creds);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private ClaimsPrincipal? ValidateToken(string token, bool isRefresh)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["JwtSettings:Secret"] ?? "FlowVision-SuperSecretKey-Min32Chars!!"));
        var handler = new JwtSecurityTokenHandler();
        try
        {
            return handler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = key,
                ValidIssuer = _config["JwtSettings:Issuer"],
                ValidAudience = _config["JwtSettings:Audience"],
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            }, out _);
        }
        catch { return null; }
    }
}
