using FlowVision.API.Models;
using Microsoft.EntityFrameworkCore;

namespace FlowVision.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Site> Sites => Set<Site>();
    public DbSet<ProductionLine> ProductionLines => Set<ProductionLine>();
    public DbSet<Equipment> Equipments => Set<Equipment>();
    public DbSet<Transport> Transports => Set<Transport>();
    public DbSet<ProductionFlow> ProductionFlows => Set<ProductionFlow>();
    public DbSet<FlowEquipment> FlowEquipments => Set<FlowEquipment>();
    public DbSet<ProductionOrder> ProductionOrders => Set<ProductionOrder>();
    public DbSet<HourlyProduction> HourlyProductions => Set<HourlyProduction>();
    public DbSet<Stop> Stops => Set<Stop>();
    public DbSet<StopCategoryConfig> StopCategoryConfigs => Set<StopCategoryConfig>();
    public DbSet<Shift> Shifts => Set<Shift>();
    public DbSet<ShiftOperator> ShiftOperators => Set<ShiftOperator>();
    public DbSet<OperatorAssignment> OperatorAssignments => Set<OperatorAssignment>();
    public DbSet<AppUser> AppUsers => Set<AppUser>();
    public DbSet<MachineTelemetry> MachineTelemetry => Set<MachineTelemetry>();
    public DbSet<TransportTelemetry> TransportTelemetry => Set<TransportTelemetry>();
    public DbSet<Device> Devices => Set<Device>();
    public DbSet<DeviceLog> DeviceLogs => Set<DeviceLog>();
    public DbSet<SystemLog> SystemLogs => Set<SystemLog>();
    public DbSet<ErrorSignal> ErrorSignals => Set<ErrorSignal>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
