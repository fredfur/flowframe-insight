using FlowVision.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace FlowVision.API.Data.Configurations;

public class SystemLogConfiguration : IEntityTypeConfiguration<SystemLog>
{
    public void Configure(EntityTypeBuilder<SystemLog> b)
    {
        b.ToTable("system_logs");
        b.HasKey(x => x.Id);
        b.Property(x => x.Id).UseIdentityByDefaultColumn();
        b.Property(x => x.Level).HasColumnName("level").HasConversion<string>();
        b.Property(x => x.Source).HasColumnName("source").HasMaxLength(100);
        b.Property(x => x.Message).HasColumnName("message");
        b.Property(x => x.StackTrace).HasColumnName("stack_trace");
        b.Property(x => x.Metadata).HasColumnName("metadata");
        b.Property(x => x.Timestamp).HasColumnName("timestamp");
        b.HasIndex(x => x.Timestamp);
        b.HasIndex(x => new { x.Level, x.Timestamp });
    }
}
