# FlowVision — Instruções para o Cursor

> Cole este documento como contexto no Cursor para que ele gere todo o backend .NET 8.
> Referencia os demais documentos da pasta `/docs`.

---

## Objetivo

Gerar um backend completo em **.NET 8 Web API** para o sistema FlowVision,
um sistema de monitoramento de produção industrial em tempo real que recebe
dados de telemetria de dispositivos ESP32 e ESP32-CAM.

## Documentos de Referência

Leia **TODOS** os seguintes documentos antes de gerar código:

1. **`docs/BACKEND_SPEC.md`** — Especificação completa: modelos, endpoints, SignalR, SQL, estrutura
2. **`docs/VARIABLE_MAP.md`** — Mapeamento Frontend ↔ Backend ↔ Database ↔ ESP32
3. **`docs/TELEMETRY_SPEC.md`** — Pipeline de telemetria IoT, payloads, MQTT, processamento

## Ordem de Geração

Execute nesta ordem exata:

### Fase 1 — Scaffold

```bash
dotnet new webapi -n FlowVision.API --framework net8.0
cd FlowVision.API
dotnet add package Npgsql.EntityFrameworkCore.PostgreSQL
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package Microsoft.AspNetCore.SignalR
dotnet add package MQTTnet --version 4.*
dotnet add package Serilog.AspNetCore
dotnet add package Serilog.Sinks.Console
dotnet add package Swashbuckle.AspNetCore
dotnet add package BCrypt.Net-Next
```

### Fase 2 — Models + Enums

Gere **todos** os modelos listados em `BACKEND_SPEC.md` seção 2:
- `Models/Enums/` → todos os enums (MachineStatus, TransportType, etc.)
- `Models/` → todas as entidades (Site, ProductionLine, Equipment, Transport, ProductionFlow, FlowEquipment, ProductionOrder, HourlyProduction, Stop, StopCategoryConfig, Shift, ShiftOperator, OperatorAssignment, AppUser, MachineTelemetry, TransportTelemetry, DeviceLog, SystemLog, ErrorSignal)

### Fase 3 — DbContext + Configurations

Gere `Data/AppDbContext.cs` com **todos** os DbSets.
Gere `Data/Configurations/` com EntityTypeConfiguration para cada entidade:
- Chaves compostas (FlowEquipment, ShiftOperator)
- Índices (telemetry, device_logs)
- Relacionamentos FK conforme tabela de relacionamentos em BACKEND_SPEC.md seção 3
- Conversão de enums para string (PostgreSQL enum)

### Fase 4 — DTOs

Gere todos os DTOs listados em BACKEND_SPEC.md seção 10:
- `DTOs/Auth/` — Login, Register, AuthResponse, RefreshToken
- `DTOs/Gateway/` — TelemetryPayload, Heartbeat, CameraStatus, TransportPayload, ErrorReport
- `DTOs/Realtime/` — RealtimeLineData, DLI, OEEHistory, Pareto, Timeline, SpeedSample
- `DTOs/` — Create/Update DTOs para cada entidade

### Fase 5 — Services

Gere as **interfaces + implementações**:
- `IOEECalculator` / `OEECalculator` — cálculo conforme BACKEND_SPEC.md seção 12
- `ITelemetryProcessor` / `TelemetryProcessor` — pipeline conforme TELEMETRY_SPEC.md seção 4.1
- `IAuthService` / `AuthService` — JWT generation + validation
- `IStopAnalyzer` / `StopAnalyzer` — Pareto, duração, auto-detect
- `IShiftManager` / `ShiftManager` — turno atual, operadores
- `IAlertEngine` / `AlertEngine` — gera ErrorSignals, limites de latência

### Fase 6 — Hubs (SignalR)

Gere `Hubs/ProductionHub.cs` conforme BACKEND_SPEC.md seção 5:
- `JoinLineGroup(lineId)`
- `LeaveLineGroup(lineId)`
- `JoinDebugGroup()`
- `LeaveDebugGroup()`

### Fase 7 — Controllers

Gere **todos** os controllers conforme BACKEND_SPEC.md seção 4:
- AuthController (login, register, me, logout, refresh)
- SitesController (CRUD)
- LinesController (CRUD + activate-flow)
- EquipmentsController (CRUD + position update)
- TransportsController (CRUD)
- FlowsController (CRUD)
- ProductionOrdersController (CRUD + start/complete/cancel)
- HourlyProductionController (CRUD)
- StopsController (CRUD + close)
- ShiftsController (CRUD + operators)
- UsersController (CRUD + assign)
- RealtimeController (line snapshot, DLI, OEE history, pareto, timeline, speed)
- ConnectivityController (status, history, timeline)
- DebugController (logs, errors, resolve)
- GatewayController (telemetry, batch, heartbeat, camera/frame, transport, error)

**IMPORTANTE**: Aplique `[Authorize(Roles = "...")]` conforme a matriz em BACKEND_SPEC.md seção 8.
GatewayController usa `[ApiKey]` middleware em vez de JWT.

### Fase 8 — Background Services

- `MqttListenerService` — subscribe aos topics do MQTT, roteia para TelemetryProcessor
- `HeartbeatMonitorService` — detecta desconexões (conforme TELEMETRY_SPEC.md seção 4.2)
- `OEEAggregatorService` — agrega OEE por hora/turno

### Fase 9 — Middleware

- `GatewayApiKeyMiddleware` — valida `X-API-Key` para rotas `/api/gateway/*`
- `ExceptionHandlingMiddleware` — padroniza respostas de erro

### Fase 10 — Program.cs

Configure tudo em `Program.cs`:
```csharp
// Services
builder.Services.AddDbContext<AppDbContext>(o => o.UseNpgsql(...));
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(...);
builder.Services.AddSignalR();
builder.Services.AddScoped<ITelemetryProcessor, TelemetryProcessor>();
builder.Services.AddScoped<IOEECalculator, OEECalculator>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IStopAnalyzer, StopAnalyzer>();
builder.Services.AddScoped<IShiftManager, ShiftManager>();
builder.Services.AddScoped<IAlertEngine, AlertEngine>();
builder.Services.AddHostedService<MqttListenerService>();
builder.Services.AddHostedService<HeartbeatMonitorService>();
builder.Services.AddHostedService<OEEAggregatorService>();
builder.Services.AddCors(...);
builder.Services.AddSwaggerGen();
builder.Services.AddHealthChecks().AddNpgSql(...);

// Middleware
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<ProductionHub>("/hubs/production");
app.MapHealthChecks("/health");
```

### Fase 11 — Seed Data + Migration

Gere `Data/Seed/SeedData.cs` com dados iniciais:
- 1 Site (Planta São Paulo)
- 2 Linhas (Envase, Montagem)
- 5 Equipments por linha
- 4 Transports por linha
- 3 Flows (produtos)
- 3 Shifts (1º, 2º, 3º turno)
- 7 StopCategoryConfigs
- 1 Admin user (admin@flowvision.com / Admin123!)

Execute: `dotnet ef migrations add InitialCreate`

### Fase 12 — Docker

Gere `Dockerfile` e `docker-compose.yml` conforme BACKEND_SPEC.md seção 11.

---

## Regras Críticas

1. **Naming**: Database usa `snake_case`, C# usa `PascalCase`, Frontend usa `camelCase`
2. **Enums em PostgreSQL**: Usar `HasConversion<string>()` no EF Core
3. **Timestamps**: Sempre `DateTime UTC` no backend, `TIMESTAMPTZ` no PostgreSQL
4. **Telemetria**: A tabela `machine_telemetry` deve ter índice em `(equipment_id, timestamp DESC)`
5. **OEE**: Sempre usar `ActiveFlow.NominalSpeed` (não `Line.NominalSpeed`) para calcular Performance
6. **Paradas auto-detectadas**: `IsAutoDetected = true` quando criadas pelo TelemetryProcessor
7. **SignalR groups**: Formato `line-{lineId}` para agrupar clientes por linha
8. **Gateway auth**: Usar `X-API-Key` header, não JWT
9. **CORS**: Permitir origin do frontend (localhost:8080 + produção)
10. **Health check**: Endpoint `/health` obrigatório

## Validações

Após gerar, verifique:
- [ ] Todos os 16 controllers implementados
- [ ] Todos os 19 modelos criados
- [ ] AppDbContext tem todos os DbSets
- [ ] Todas as EntityTypeConfigurations
- [ ] SignalR hub com 4 métodos
- [ ] 3 Background Services
- [ ] Middleware de API Key
- [ ] Docker compose com PostgreSQL + MQTT + API
- [ ] Seed data
- [ ] Swagger configurado
- [ ] Health checks

---

*Instruções geradas em 2026-03-09. Usar em conjunto com BACKEND_SPEC.md, VARIABLE_MAP.md e TELEMETRY_SPEC.md.*
