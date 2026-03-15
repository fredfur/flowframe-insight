using FlowVision.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FlowVision.API.Data.Configurations;

public class StopConfiguration : IEntityTypeConfiguration<Stop>
{
    public void Configure(EntityTypeBuilder<Stop> b)
    {
        b.ToTable("stops");
        b.HasKey(x => x.Id);
        b.Property(x => x.EquipmentId).HasColumnName("equipment_id");
        b.Property(x => x.MachineName).HasColumnName("machine_name").HasMaxLength(200);
        b.Property(x => x.LineId).HasColumnName("line_id");
        b.Property(x => x.Category).HasColumnName("category").HasConversion<string>();
        b.Property(x => x.StartTime).HasColumnName("start_time");
        b.Property(x => x.EndTime).HasColumnName("end_time");
        b.Property(x => x.DurationMinutes).HasColumnName("duration_minutes");
        b.Property(x => x.Notes).HasColumnName("notes");
        b.Property(x => x.RegisteredBy).HasColumnName("registered_by");
        b.Property(x => x.ProductionOrderId).HasColumnName("production_order_id");
        b.Property(x => x.ShiftId).HasColumnName("shift_id");
        b.Property(x => x.IsAutoDetected).HasColumnName("is_auto_detected");
        b.Property(x => x.CreatedAt).HasColumnName("created_at");
        b.HasOne(x => x.Equipment).WithMany(x => x.Stops).HasForeignKey(x => x.EquipmentId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Line).WithMany().HasForeignKey(x => x.LineId).OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.ProductionOrder).WithMany().HasForeignKey(x => x.ProductionOrderId).OnDelete(DeleteBehavior.SetNull);
        b.HasOne(x => x.Shift).WithMany().HasForeignKey(x => x.ShiftId).OnDelete(DeleteBehavior.SetNull);
    }
}
