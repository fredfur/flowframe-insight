using FlowVision.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FlowVision.API.Data.Configurations;

public class ProductionFlowConfiguration : IEntityTypeConfiguration<ProductionFlow>
{
    public void Configure(EntityTypeBuilder<ProductionFlow> b)
    {
        b.ToTable("production_flows");
        b.HasKey(x => x.Id);
        b.Property(x => x.Name).HasColumnName("name").HasMaxLength(200);
        b.Property(x => x.SKU).HasColumnName("sku").HasMaxLength(50);
        b.Property(x => x.LineId).HasColumnName("line_id");
        b.Property(x => x.NominalSpeed).HasColumnName("nominal_speed");
        b.Property(x => x.IsActive).HasColumnName("is_active");
        b.Property(x => x.CreatedAt).HasColumnName("created_at");
        b.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        b.HasOne(x => x.Line).WithMany(x => x.Flows).HasForeignKey(x => x.LineId).OnDelete(DeleteBehavior.Cascade);
    }
}
