using FlowVision.API.DTOs.Auth;

namespace FlowVision.API.Services;

public interface IAuthService
{
    Task<AuthResponseDto?> LoginAsync(LoginDto dto);
    Task<AuthResponseDto?> RegisterAsync(RegisterDto dto);
    Task<AuthResponseDto?> RefreshAsync(string refreshToken);
    Task<AuthUserDto?> GetMeAsync(Guid userId);
}
