namespace FlowVision.API.Models;

public class Site
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string? Timezone { get; set; } = "America/Sao_Paulo";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<ProductionLine> Lines { get; set; } = new List<ProductionLine>();
    public ICollection<AppUser> Users { get; set; } = new List<AppUser>();
}
