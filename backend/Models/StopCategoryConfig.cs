using FlowVision.API.Models.Enums;

namespace FlowVision.API.Models;

public class StopCategoryConfig
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SiteId { get; set; }
    public StopCategory Category { get; set; }
    public string Label { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;

    public Site Site { get; set; } = null!;
}
