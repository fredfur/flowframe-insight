using FlowVision.API.Models.Enums;

namespace FlowVision.API.DTOs.Auth;

public class RegisterDto
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Operacao;
    public Guid? SiteId { get; set; }
}
