using FlowVision.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FlowVision.API.Data.Configurations;

public class ProductionOrderConfiguration : IEntityTypeConfiguration<ProductionOrder>
{
    public void Configure(EntityTypeBuilder<ProductionOrder> b)
    {
        b.ToTable("production_orders");
        b.HasKey(x => x.Id);
        b.Property(x => x.OrderNumber).HasColumnName("order_number").HasMaxLength(50);
        b.Property(x => x.FlowId).HasColumnName("flow_id");
        b.Property(x => x.LineId).HasColumnName("line_id");
        b.Property(x => x.TargetQuantity).HasColumnName("target_quantity");
        b.Property(x => x.ProducedQuantity).HasColumnName("produced_quantity");
        b.Property(x => x.RejectedQuantity).HasColumnName("rejected_quantity");
        b.Property(x => x.Status).HasColumnName("status").HasConversion<string>();
        b.Property(x => x.PlannedStart).HasColumnName("planned_start");
        b.Property(x => x.PlannedEnd).HasColumnName("planned_end");
        b.Property(x => x.ActualStart).HasColumnName("actual_start");
        b.Property(x => x.ActualEnd).HasColumnName("actual_end");
        b.Property(x => x.Notes).HasColumnName("notes");
        b.Property(x => x.CreatedBy).HasColumnName("created_by");
        b.Property(x => x.CreatedAt).HasColumnName("created_at");
        b.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        b.HasOne(x => x.Flow).WithMany(x => x.Orders).HasForeignKey(x => x.FlowId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Line).WithMany(x => x.Orders).HasForeignKey(x => x.LineId).OnDelete(DeleteBehavior.Restrict);
    }
}
