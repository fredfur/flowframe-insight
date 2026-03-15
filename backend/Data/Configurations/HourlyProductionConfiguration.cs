using FlowVision.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FlowVision.API.Data.Configurations;

public class HourlyProductionConfiguration : IEntityTypeConfiguration<HourlyProduction>
{
    public void Configure(EntityTypeBuilder<HourlyProduction> b)
    {
        b.ToTable("hourly_productions");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).HasColumnName("id");
        b.Property(x => x.OrderId).HasColumnName("order_id");
        b.Property(x => x.LineId).HasColumnName("line_id");
        b.Property(x => x.HourStart).HasColumnName("hour_start");
        b.Property(x => x.PlannedQuantity).HasColumnName("planned_quantity");
        b.Property(x => x.ActualQuantity).HasColumnName("actual_quantity");
        b.Property(x => x.RejectedQuantity).HasColumnName("rejected_quantity");
        b.Property(x => x.Operator).HasColumnName("operator").HasMaxLength(200);
        b.Property(x => x.Notes).HasColumnName("notes");
        b.Property(x => x.CreatedAt).HasColumnName("created_at");
        b.HasOne(x => x.Order).WithMany(x => x.HourlyRecords).HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Cascade);
        b.HasOne(x => x.Line).WithMany().HasForeignKey(x => x.LineId).OnDelete(DeleteBehavior.Restrict);
    }
}
