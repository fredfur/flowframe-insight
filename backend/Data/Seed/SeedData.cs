using FlowVision.API.Data;
using FlowVision.API.Models;
using FlowVision.API.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace FlowVision.API.Data;

public static class SeedData
{
    public static async Task IfNeeded(AppDbContext db)
    {
        if (await db.Sites.AnyAsync()) return;

        var site = new Site { Id = Guid.Parse("11111111-1111-1111-1111-111111111111"), Name = "Planta São Paulo", Location = "São Paulo, SP", Timezone = "America/Sao_Paulo" };
        db.Sites.Add(site);

        var line1 = new ProductionLine { Id = Guid.Parse("22222222-2222-2222-2222-222222222221"), Name = "Linha 01 — Envase", Type = "Envase", SiteId = site.Id, NominalSpeed = 500 };
        var line2 = new ProductionLine { Id = Guid.Parse("22222222-2222-2222-2222-222222222222"), Name = "Linha 02 — Montagem", Type = "Montagem", SiteId = site.Id, NominalSpeed = 300 };
        db.ProductionLines.AddRange(line1, line2);

        // MDM alinhado com a tela Configurações: nomes e tipos dos equipamentos
        var equipNames = new[] { ("Alimentador", "Feeder"), ("Processadora A", "Processor"), ("Inspeção Visual", "Inspection"), ("Processadora B", "Processor"), ("Embaladora", "Packer") };
        var equip1Line1Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa01");
        var visionEquipmentId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        db.Equipments.Add(new Equipment { Id = equip1Line1Id, Name = equipNames[0].Item1, Type = equipNames[0].Item2, LineId = line1.Id, Position = 1, NominalSpeed = 500, X = 100, Y = 0 });
        for (int i = 1; i < equipNames.Length; i++)
            db.Equipments.Add(new Equipment { Name = equipNames[i].Item1, Type = equipNames[i].Item2, LineId = line1.Id, Position = i + 1, NominalSpeed = 500, X = (i + 1) * 100, Y = 0 });
        for (int i = 0; i < equipNames.Length; i++)
            db.Equipments.Add(new Equipment { Name = equipNames[i].Item1, Type = equipNames[i].Item2, LineId = line2.Id, Position = i + 1, NominalSpeed = 300, X = (i + 1) * 100, Y = 0 });
        db.Equipments.Add(new Equipment { Id = visionEquipmentId, Name = "Vision OEE", Type = "Vision", LineId = line1.Id, Position = 0, NominalSpeed = 500, X = 0, Y = 0, GatewayDeviceId = "vision-oee-01" });

        var flow1 = new ProductionFlow { Id = Guid.Parse("33333333-3333-3333-3333-333333333331"), Name = "Produto A", SKU = "SKU-101", LineId = line1.Id, NominalSpeed = 500 };
        db.ProductionFlows.Add(flow1);

        var shift1 = new Shift { Id = Guid.Parse("44444444-4444-4444-4444-444444444441"), SiteId = site.Id, Name = "1º Turno", StartTime = new TimeOnly(6, 0), EndTime = new TimeOnly(14, 0) };
        var shift2 = new Shift { Id = Guid.Parse("44444444-4444-4444-4444-444444444442"), SiteId = site.Id, Name = "2º Turno", StartTime = new TimeOnly(14, 0), EndTime = new TimeOnly(22, 0) };
        var shift3 = new Shift { Id = Guid.Parse("44444444-4444-4444-4444-444444444443"), SiteId = site.Id, Name = "3º Turno", StartTime = new TimeOnly(22, 0), EndTime = new TimeOnly(6, 0), CrossesMidnight = true };
        db.Shifts.AddRange(shift1, shift2, shift3);

        foreach (var cat in new[] { StopCategory.Maintenance, StopCategory.Setup, StopCategory.MaterialShortage, StopCategory.QualityIssue, StopCategory.OperatorAbsence, StopCategory.Planned, StopCategory.Other })
            db.StopCategoryConfigs.Add(new StopCategoryConfig { SiteId = site.Id, Category = cat, Label = cat.ToString(), Color = "#888", SortOrder = (int)cat });

        db.AppUsers.Add(new AppUser { Id = Guid.Parse("55555555-5555-5555-5555-555555555551"), Name = "Admin", Email = "admin@flowvision.com", PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"), Role = UserRole.Admin, SiteId = site.Id });

        await db.SaveChangesAsync();

        line1.ActiveFlowId = flow1.Id;
        await db.SaveChangesAsync();

        if (!await db.Devices.AnyAsync())
        {
            db.Devices.Add(new Device
            {
                Id = Guid.NewGuid(),
                ExternalId = "vision-oee-01",
                Name = "Vision OEE Gateway",
                LineId = line1.Id,
                MeasuresOutputOfEquipmentId = equip1Line1Id,
                MeasuresInputOfEquipmentId = visionEquipmentId,
                IsActive = true
            });
            await db.SaveChangesAsync();
        }
    }
}
