using FlowVision.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FlowVision.API.Data.Configurations;

public class StopCategoryConfigConfiguration : IEntityTypeConfiguration<StopCategoryConfig>
{
    public void Configure(EntityTypeBuilder<StopCategoryConfig> b)
    {
        b.ToTable("stop_category_configs");
        b.HasKey(x => x.Id);
        b.Property(x => x.SiteId).HasColumnName("site_id");
        b.Property(x => x.Category).HasColumnName("category").HasConversion<string>();
        b.Property(x => x.Label).HasColumnName("label").HasMaxLength(100);
        b.Property(x => x.Color).HasColumnName("color").HasMaxLength(50);
        b.Property(x => x.SortOrder).HasColumnName("sort_order");
        b.Property(x => x.IsActive).HasColumnName("is_active");
        b.HasOne(x => x.Site).WithMany().HasForeignKey(x => x.SiteId).OnDelete(DeleteBehavior.Cascade);
        b.HasIndex(x => new { x.SiteId, x.Category }).IsUnique();
    }
}
