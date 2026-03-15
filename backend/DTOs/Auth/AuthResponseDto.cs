namespace FlowVision.API.DTOs.Auth;

public class AuthResponseDto
{
    public AuthUserDto User { get; set; } = null!;
    public string Token { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
}

public class AuthUserDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public Guid? SiteId { get; set; }
}
