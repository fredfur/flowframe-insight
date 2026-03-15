namespace FlowVision.API.DTOs;

public class UserDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public Guid? SiteId { get; set; }
    public bool IsActive { get; set; }
}

public class CreateUserDto
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Role { get; set; } = "Operacao";
    public Guid? SiteId { get; set; }
}

public class UpdateUserDto
{
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? Role { get; set; }
    public Guid? SiteId { get; set; }
    public bool? IsActive { get; set; }
}

public class UserAssignEquipmentDto
{
    public List<Guid> EquipmentIds { get; set; } = new();
}
