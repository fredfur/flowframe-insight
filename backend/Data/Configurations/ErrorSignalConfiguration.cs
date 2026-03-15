using FlowVision.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FlowVision.API.Data.Configurations;

public class ErrorSignalConfiguration : IEntityTypeConfiguration<ErrorSignal>
{
    public void Configure(EntityTypeBuilder<ErrorSignal> b)
    {
        b.ToTable("error_signals");
        b.HasKey(x => x.Id);
        b.Property(x => x.Source).HasColumnName("source").HasMaxLength(100);
        b.Property(x => x.Code).HasColumnName("code").HasMaxLength(50);
        b.Property(x => x.Message).HasColumnName("message");
        b.Property(x => x.Severity).HasColumnName("severity").HasConversion<string>();
        b.Property(x => x.IsResolved).HasColumnName("is_resolved");
        b.Property(x => x.ResolvedAt).HasColumnName("resolved_at");
        b.Property(x => x.ResolvedBy).HasColumnName("resolved_by");
        b.Property(x => x.ResolutionNotes).HasColumnName("resolution_notes");
        b.Property(x => x.EquipmentId).HasColumnName("equipment_id");
        b.Property(x => x.LineId).HasColumnName("line_id");
        b.Property(x => x.RawPayload).HasColumnName("raw_payload");
        b.Property(x => x.Timestamp).HasColumnName("timestamp");
        b.HasOne(x => x.Equipment).WithMany().HasForeignKey(x => x.EquipmentId).OnDelete(DeleteBehavior.SetNull);
        b.HasOne(x => x.Line).WithMany().HasForeignKey(x => x.LineId).OnDelete(DeleteBehavior.SetNull);
        b.HasIndex(x => new { x.IsResolved, x.Severity, x.Timestamp });
    }
}
