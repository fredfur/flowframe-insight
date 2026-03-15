namespace FlowVision.API.DTOs;

public class SiteDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string? Timezone { get; set; }
    public bool IsActive { get; set; }
}

public class CreateSiteDto
{
    public string Name { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string? Timezone { get; set; }
}

public class UpdateSiteDto
{
    public string? Name { get; set; }
    public string? Location { get; set; }
    public string? Timezone { get; set; }
    public bool? IsActive { get; set; }
}
