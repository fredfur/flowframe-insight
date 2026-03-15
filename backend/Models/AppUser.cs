using FlowVision.API.Models.Enums;

namespace FlowVision.API.Models;

public class AppUser
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Operacao;
    public Guid? SiteId { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? LastLoginAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Site? Site { get; set; }
    public ICollection<OperatorAssignment> OperatorAssignments { get; set; } = new List<OperatorAssignment>();
    public ICollection<ShiftOperator> ShiftAssignments { get; set; } = new List<ShiftOperator>();
}
