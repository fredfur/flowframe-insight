using FlowVision.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FlowVision.API.Data.Configurations;

public class ProductionLineConfiguration : IEntityTypeConfiguration<ProductionLine>
{
    public void Configure(EntityTypeBuilder<ProductionLine> b)
    {
        b.ToTable("production_lines");
        b.HasKey(x => x.Id);
        b.Property(x => x.Name).HasColumnName("name").HasMaxLength(200);
        b.Property(x => x.Type).HasColumnName("type").HasMaxLength(100);
        b.Property(x => x.SiteId).HasColumnName("site_id");
        b.Property(x => x.NominalSpeed).HasColumnName("nominal_speed");
        b.Property(x => x.IsActive).HasColumnName("is_active");
        b.Property(x => x.ActiveFlowId).HasColumnName("active_flow_id");
        b.Property(x => x.CreatedAt).HasColumnName("created_at");
        b.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        b.HasOne(x => x.Site).WithMany(x => x.Lines).HasForeignKey(x => x.SiteId).OnDelete(DeleteBehavior.Cascade);
        b.HasOne(x => x.ActiveFlow).WithMany().HasForeignKey(x => x.ActiveFlowId).OnDelete(DeleteBehavior.SetNull);
    }
}
