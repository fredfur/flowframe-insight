# FlowVision — Especificação Técnica Completa do Backend (.NET 8)

> Documento **definitivo** para geração automática do backend no Cursor.
> Inclui todos os modelos, relacionamentos, endpoints, telemetria e rastreabilidade.

---

## 1. Visão Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React/Vite)                         │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │
│   │ LineLive │  │Dashboard │  │  Debug   │  │  Configurações       │  │
│   └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────────┬──────────┘  │
│        │              │              │                    │             │
│        └──────────────┴──────┬───────┴────────────────────┘             │
│                              │                                          │
│                     src/services/api.ts                                  │
│                     (Service Layer — abstração mock/real)                │
│                              │                                          │
│                 ┌────────────┼────────────┐                             │
│                 │ REST API   │ SignalR WS  │                            │
└─────────────────┼────────────┼────────────┼─────────────────────────────┘
                  │            │            │
                  ▼            ▼            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     BACKEND (.NET 8 Web API)                            │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────┐       │
│  │                      Controllers                             │       │
│  │  Auth │ Sites │ Lines │ Equipment │ Flows │ Stops │ Gateway │       │
│  │  Realtime │ Debug │ Shifts │ ProductionOrders │ Users        │       │
│  └───────────────────────┬─────────────────────────────────────┘       │
│                          │                                              │
│  ┌───────────────────────┼─────────────────────────────────────┐       │
│  │                    Services                                  │       │
│  │  OEECalculator │ TelemetryProcessor │ AuthService            │       │
│  │  StopAnalyzer  │ ShiftManager │ AlertEngine                  │       │
│  └───────────────────────┬─────────────────────────────────────┘       │
│                          │                                              │
│  ┌───────────────────────┼─────────────────────────────────────┐       │
│  │                    Hubs (SignalR)                             │       │
│  │  ProductionHub ─ real-time para frontend                     │       │
│  └───────────────────────┬─────────────────────────────────────┘       │
│                          │                                              │
│  ┌───────────────────────┼─────────────────────────────────────┐       │
│  │               Background Services                            │       │
│  │  MqttListenerService │ HeartbeatMonitor │ OEEAggregator      │       │
│  └───────────────────────┬─────────────────────────────────────┘       │
│                          │                                              │
│                    Entity Framework Core                                 │
│                          │                                              │
│                   PostgreSQL / SQL Server                                │
└─────────────────────────────────────────────────────────────────────────┘
                  ▲
                  │ HTTP POST / MQTT
                  │
┌─────────────────┴───────────────────────────────────────────────────────┐
│                     IoT Layer (ESP32)                                    │
│                                                                         │
│  ┌────────────────────┐          ┌────────────────────────┐            │
│  │  Gateway ESP32      │◄────────│  ESP32-CAM S3           │            │
│  │  (Broker/Agregador) │  UART/  │  (Visão computacional)  │            │
│  │                      │  WiFi   │                          │            │
│  │  • Coleta sensores   │         │  • Captura frames        │            │
│  │  • Agrega dados      │         │  • Detecção de status    │            │
│  │  • Heartbeat         │         │  • Contagem de peças     │            │
│  │  • Envia telemetria  │         │  • FPS monitoring        │            │
│  └────────────────────┘          └────────────────────────┘            │
└─────────────────────────────────────────────────────────────────────────┘
```

### Stack Tecnológica

| Camada          | Tecnologia                                    |
|-----------------|-----------------------------------------------|
| Frontend        | React 18 + Vite + TypeScript + Tailwind       |
| Backend         | .NET 8 Web API + SignalR                       |
| ORM             | Entity Framework Core 8                        |
| Database        | PostgreSQL 16 (ou SQL Server 2022)             |
| Time-series     | TimescaleDB extension (ou tabela particionada) |
| Auth            | JWT Bearer + ASP.NET Identity                  |
| Real-time       | SignalR (WebSocket + fallback)                 |
| IoT Protocol    | MQTT v5 (Mosquitto broker) + HTTP POST         |
| MQTT Client     | MQTTnet 4.x                                   |
| Containerização | Docker + Docker Compose                        |
| API Docs        | Swagger / OpenAPI 3.0                          |
| Logging         | Serilog → Seq/Console                          |
| Health          | ASP.NET Health Checks                          |

---

## 2. Modelo de Dados Completo (Entity Framework)

### 2.1 Site (Planta Industrial)

```csharp
public class Site
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;       // "Planta São Paulo"
    public string Location { get; set; } = string.Empty;    // "São Paulo, SP"
    public string? Timezone { get; set; } = "America/Sao_Paulo";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<ProductionLine> Lines { get; set; } = new List<ProductionLine>();
    public ICollection<AppUser> Users { get; set; } = new List<AppUser>();
}
```

### 2.2 ProductionLine (Linha Produtiva)

```csharp
public class ProductionLine
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;         // "Linha 01 — Envase"
    public string Type { get; set; } = string.Empty;         // "Envase", "Montagem"
    public Guid SiteId { get; set; }
    public int NominalSpeed { get; set; }                    // velocidade base (u/h)
    public bool IsActive { get; set; } = true;
    public Guid? ActiveFlowId { get; set; }                  // fluxo/produto em execução
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Site Site { get; set; } = null!;
    public ProductionFlow? ActiveFlow { get; set; }
    public ICollection<Equipment> Equipments { get; set; } = new List<Equipment>();
    public ICollection<Transport> Transports { get; set; } = new List<Transport>();
    public ICollection<ProductionFlow> Flows { get; set; } = new List<ProductionFlow>();
    public ICollection<ProductionOrder> Orders { get; set; } = new List<ProductionOrder>();
    public ICollection<Shift> Shifts { get; set; } = new List<Shift>();
}
```

### 2.3 Equipment (Equipamento/Máquina)

```csharp
public enum MachineStatus
{
    Running = 0,
    Fault = 1,
    Shortage = 2,
    Accumulation = 3,
    Scheduled = 4,
    Setup = 5,
    Disconnected = 6
}

public class Equipment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;         // "Alimentador"
    public string Type { get; set; } = string.Empty;         // "Feeder", "Processor", "Inspection", "Packer"
    public Guid LineId { get; set; }
    public int Position { get; set; }                        // ordem no fluxo (1, 2, 3...)
    public int NominalSpeed { get; set; }                    // velocidade nominal (u/h)
    public double X { get; set; }                            // posição visual X (canvas)
    public double Y { get; set; }                            // posição visual Y (canvas)
    public string? GatewayDeviceId { get; set; }             // ID do dispositivo no gateway ESP32
    public string? CameraDeviceId { get; set; }              // ID da câmera associada (se houver)
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ProductionLine Line { get; set; } = null!;
    public ICollection<Stop> Stops { get; set; } = new List<Stop>();
    public ICollection<MachineTelemetry> TelemetryHistory { get; set; } = new List<MachineTelemetry>();
    public ICollection<FlowEquipment> FlowEquipments { get; set; } = new List<FlowEquipment>();
    public ICollection<OperatorAssignment> OperatorAssignments { get; set; } = new List<OperatorAssignment>();
}
```

### 2.4 Transport (Transporte entre Máquinas)

```csharp
public enum TransportType
{
    Conveyor = 0,
    Buffer = 1,
    Gravity = 2
}

public enum AccumulationLevel
{
    Empty = 0,
    Low = 1,
    Normal = 2,
    High = 3,
    Critical = 4
}

public class Transport
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid LineId { get; set; }
    public int FromPosition { get; set; }                    // posição do equipamento de origem
    public int ToPosition { get; set; }                      // posição do equipamento de destino
    public TransportType Type { get; set; } = TransportType.Conveyor;
    public int Capacity { get; set; }                        // max unidades
    public string? SensorDeviceId { get; set; }              // sensor IoT de acúmulo
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ProductionLine Line { get; set; } = null!;
    public ICollection<TransportTelemetry> TelemetryHistory { get; set; } = new List<TransportTelemetry>();
}
```

### 2.5 ProductionFlow (Fluxo = Produto/SKU)

```csharp
public class ProductionFlow
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;         // "Produto A — Garrafa 500ml"
    public string SKU { get; set; } = string.Empty;          // "SKU-101"
    public Guid LineId { get; set; }
    public int NominalSpeed { get; set; }                    // velocidade da linha para este produto
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ProductionLine Line { get; set; } = null!;
    public ICollection<FlowEquipment> FlowEquipments { get; set; } = new List<FlowEquipment>();
    public ICollection<ProductionOrder> Orders { get; set; } = new List<ProductionOrder>();
}

// Join table: Flow ↔ Equipment (many-to-many)
public class FlowEquipment
{
    public Guid FlowId { get; set; }
    public Guid EquipmentId { get; set; }
    public int? OverrideNominalSpeed { get; set; }           // velocidade específica desse equip para esse produto

    // Navigation
    public ProductionFlow Flow { get; set; } = null!;
    public Equipment Equipment { get; set; } = null!;
}
```

### 2.6 ProductionOrder (Ordem de Produção)

```csharp
public enum OrderStatus
{
    Planned = 0,
    InProgress = 1,
    Completed = 2,
    Cancelled = 3,
    OnHold = 4
}

public class ProductionOrder
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string OrderNumber { get; set; } = string.Empty;  // "OP-2026-0342"
    public Guid FlowId { get; set; }                         // qual produto
    public Guid LineId { get; set; }                         // em qual linha
    public int TargetQuantity { get; set; }                  // quantidade planejada
    public int ProducedQuantity { get; set; }                // quantidade produzida
    public int RejectedQuantity { get; set; }                // quantidade rejeitada
    public OrderStatus Status { get; set; } = OrderStatus.Planned;
    public DateTime PlannedStart { get; set; }
    public DateTime? PlannedEnd { get; set; }
    public DateTime? ActualStart { get; set; }
    public DateTime? ActualEnd { get; set; }
    public string? Notes { get; set; }
    public string? CreatedBy { get; set; }                   // userId
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ProductionFlow Flow { get; set; } = null!;
    public ProductionLine Line { get; set; } = null!;
    public ICollection<HourlyProduction> HourlyRecords { get; set; } = new List<HourlyProduction>();
}
```

### 2.7 HourlyProduction (Produção Hora a Hora)

```csharp
public class HourlyProduction
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }
    public Guid LineId { get; set; }
    public DateTime HourStart { get; set; }                  // início da hora (ex: 06:00, 07:00)
    public int PlannedQuantity { get; set; }
    public int ActualQuantity { get; set; }
    public int RejectedQuantity { get; set; }
    public string? Operator { get; set; }                    // operador responsável
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ProductionOrder Order { get; set; } = null!;
    public ProductionLine Line { get; set; } = null!;
}
```

### 2.8 Stop (Parada de Máquina)

```csharp
public enum StopCategory
{
    Maintenance = 0,
    Setup = 1,
    MaterialShortage = 2,
    QualityIssue = 3,
    OperatorAbsence = 4,
    Planned = 5,
    Other = 6
}

public class Stop
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid EquipmentId { get; set; }
    public string MachineName { get; set; } = string.Empty;  // denormalized for display
    public Guid LineId { get; set; }
    public StopCategory Category { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public int? DurationMinutes { get; set; }                // computed on close
    public string? Notes { get; set; }
    public string RegisteredBy { get; set; } = string.Empty; // userId
    public Guid? ProductionOrderId { get; set; }             // ordem ativa no momento
    public Guid? ShiftId { get; set; }                       // turno ativo no momento
    public bool IsAutoDetected { get; set; }                 // detectada automaticamente via telemetria?
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Equipment Equipment { get; set; } = null!;
    public ProductionLine Line { get; set; } = null!;
    public ProductionOrder? ProductionOrder { get; set; }
    public Shift? Shift { get; set; }
}
```

### 2.9 StopCategory Config (Categorias customizáveis)

```csharp
public class StopCategoryConfig
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SiteId { get; set; }
    public StopCategory Category { get; set; }
    public string Label { get; set; } = string.Empty;        // "Manutenção"
    public string Color { get; set; } = string.Empty;        // "hsl(0, 72%, 51%)"
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation
    public Site Site { get; set; } = null!;
}
```

### 2.10 Shift (Turno)

```csharp
public class Shift
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid SiteId { get; set; }
    public Guid? LineId { get; set; }                        // null = aplica a todas as linhas do site
    public string Name { get; set; } = string.Empty;         // "1º Turno"
    public TimeOnly StartTime { get; set; }                  // 06:00
    public TimeOnly EndTime { get; set; }                    // 14:00
    public bool CrossesMidnight { get; set; }                // 3º Turno: 22:00-06:00
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Site Site { get; set; } = null!;
    public ProductionLine? Line { get; set; }
    public ICollection<ShiftOperator> ShiftOperators { get; set; } = new List<ShiftOperator>();
}
```

### 2.11 User & Roles

```csharp
public enum UserRole
{
    Admin = 0,
    Lideranca = 1,
    Operacao = 2
}

public class AppUser  // extends IdentityUser
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Operacao;
    public Guid? SiteId { get; set; }                        // site do usuário
    public bool IsActive { get; set; } = true;
    public DateTime? LastLoginAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Site? Site { get; set; }
    public ICollection<OperatorAssignment> OperatorAssignments { get; set; } = new List<OperatorAssignment>();
    public ICollection<ShiftOperator> ShiftAssignments { get; set; } = new List<ShiftOperator>();
}

// Join: Operator ↔ Equipment
public class OperatorAssignment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid EquipmentId { get; set; }
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UnassignedAt { get; set; }

    public AppUser User { get; set; } = null!;
    public Equipment Equipment { get; set; } = null!;
}

// Join: Shift ↔ Operator
public class ShiftOperator
{
    public Guid ShiftId { get; set; }
    public Guid UserId { get; set; }
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

    public Shift Shift { get; set; } = null!;
    public AppUser User { get; set; } = null!;
}
```

### 2.12 Telemetria — Machine (Time-Series)

```csharp
public class MachineTelemetry
{
    public long Id { get; set; }                              // BIGINT IDENTITY
    public Guid EquipmentId { get; set; }
    public MachineStatus Status { get; set; }
    public int Throughput { get; set; }                      // u/h
    public decimal Availability { get; set; }                // 0-100
    public decimal Performance { get; set; }                 // 0-100
    public decimal Quality { get; set; }                     // 0-100
    public decimal OEE { get; set; }                         // computed
    public string? RawPayload { get; set; }                  // JSON original do ESP32 (debug)
    public DateTime Timestamp { get; set; }

    // Navigation
    public Equipment Equipment { get; set; } = null!;
}
```

### 2.13 Telemetria — Transport (Acúmulo)

```csharp
public class TransportTelemetry
{
    public long Id { get; set; }
    public Guid TransportId { get; set; }
    public AccumulationLevel AccumulationLevel { get; set; }
    public int AccumulationPercent { get; set; }             // 0-100
    public int CurrentUnits { get; set; }
    public string? RawPayload { get; set; }
    public DateTime Timestamp { get; set; }

    // Navigation
    public Transport Transport { get; set; } = null!;
}
```

### 2.14 Gateway & Camera Status Log

```csharp
public enum DeviceType
{
    Gateway = 0,
    Camera = 1
}

public enum ConnectivityEventType
{
    Connected = 0,
    Disconnected = 1,
    Timeout = 2,
    Reconnected = 3,
    LatencySpike = 4,
    HeartbeatOk = 5,
    FirmwareUpdate = 6,
    MemoryWarning = 7,
    CrcError = 8,
    BufferOverflow = 9
}

public class DeviceLog
{
    public long Id { get; set; }
    public string DeviceId { get; set; } = string.Empty;     // identificador do dispositivo
    public DeviceType DeviceType { get; set; }
    public ConnectivityEventType EventType { get; set; }
    public int? LatencyMs { get; set; }
    public int? Fps { get; set; }                            // só para câmera
    public int? MemoryUsagePercent { get; set; }
    public string? FirmwareVersion { get; set; }
    public string? Detail { get; set; }                      // mensagem descritiva
    public string? RawPayload { get; set; }                  // JSON bruto (debug)
    public Guid? EquipmentId { get; set; }                   // equipamento associado (se houver)
    public Guid? LineId { get; set; }                        // linha associada
    public DateTime Timestamp { get; set; }

    // Navigation
    public Equipment? Equipment { get; set; }
    public ProductionLine? Line { get; set; }
}
```

### 2.15 System Log (Debug Page)

```csharp
public enum SystemLogLevel
{
    Info = 0,
    Warning = 1,
    Error = 2,
    Success = 3
}

public class SystemLog
{
    public long Id { get; set; }
    public SystemLogLevel Level { get; set; }
    public string Source { get; set; } = string.Empty;       // "Gateway", "Câmera", "OEE Engine", "SignalR"
    public string Message { get; set; } = string.Empty;
    public string? StackTrace { get; set; }
    public string? Metadata { get; set; }                    // JSON com dados extras
    public DateTime Timestamp { get; set; }
}
```

### 2.16 Error Signal (Sinais de Erro)

```csharp
public enum ErrorSeverity
{
    Low = 0,
    Medium = 1,
    High = 2,
    Critical = 3
}

public class ErrorSignal
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Source { get; set; } = string.Empty;       // "ESP32-CAM", "Gateway ESP32"
    public string Code { get; set; } = string.Empty;         // "CAM_TIMEOUT", "GW_LAT_SPIKE"
    public string Message { get; set; } = string.Empty;
    public ErrorSeverity Severity { get; set; }
    public bool IsResolved { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public string? ResolvedBy { get; set; }                  // userId
    public string? ResolutionNotes { get; set; }
    public Guid? EquipmentId { get; set; }
    public Guid? LineId { get; set; }
    public string? RawPayload { get; set; }
    public DateTime Timestamp { get; set; }

    // Navigation
    public Equipment? Equipment { get; set; }
    public ProductionLine? Line { get; set; }
}
```

---

## 3. Diagrama ER (Relacionamentos)

```
┌──────────┐         ┌──────────────────┐         ┌──────────────────┐
│   Site   │ 1────N  │  ProductionLine   │ 1────N  │   Equipment      │
│          │         │                    │         │                    │
│ id (PK)  │         │ id (PK)           │         │ id (PK)           │
│ name     │         │ siteId (FK→Site)  │         │ lineId (FK→Line)  │
│ location │         │ activeFlowId (FK) │         │ position          │
│ timezone │         │ nominalSpeed      │         │ gatewayDeviceId   │
└──────────┘         │ type              │         │ cameraDeviceId    │
     │               └──────────────────┘         └──────────────────┘
     │                    │  │  │  │                    │  │  │
     │ 1────N             │  │  │  │                    │  │  │
     ▼                    │  │  │  │                    │  │  │
┌──────────┐              │  │  │  │                    │  │  │
│ AppUser  │              │  │  │  │                    │  │  │
│          │              │  │  │  │                    │  │  │
│ id (PK)  │              │  │  │  │                    │  │  │
│ siteId   │              │  │  │  │                    │  │  │
│ role     │              │  │  │  │                    │  │  │
└──────────┘              │  │  │  │                    │  │  │
     │  │                 │  │  │  │                    │  │  │
     │  │                 │  │  │  │  1────N            │  │  │
     │  │                 │  │  │  └─────────┐         │  │  │
     │  │                 │  │  │            ▼         │  │  │
     │  │                 │  │  │  ┌─────────────┐    │  │  │
     │  │                 │  │  │  │  Transport   │    │  │  │
     │  │                 │  │  │  │              │    │  │  │
     │  │                 │  │  │  │ fromPosition │    │  │  │
     │  │                 │  │  │  │ toPosition   │    │  │  │
     │  │                 │  │  │  │ type         │    │  │  │
     │  │                 │  │  │  │ capacity     │    │  │  │
     │  │                 │  │  │  └─────────────┘    │  │  │
     │  │                 │  │  │         │            │  │  │
     │  │                 │  │  │         │ 1────N     │  │  │
     │  │                 │  │  │         ▼            │  │  │
     │  │                 │  │  │  ┌────────────────┐  │  │  │
     │  │                 │  │  │  │TransportTelemetry│ │  │  │
     │  │                 │  │  │  └────────────────┘  │  │  │
     │  │                 │  │  │                       │  │  │
     │  │                 │  │  │ 1────N                │  │  │
     │  │                 │  │  └──────┐                │  │  │
     │  │                 │  │         ▼                │  │  │
     │  │                 │  │  ┌────────────────┐      │  │  │
     │  │                 │  │  │     Shift      │      │  │  │
     │  │                 │  │  └────────────────┘      │  │  │
     │  │                 │  │         │                 │  │  │
     │  │                 │  │         │ N────N          │  │  │
     │  │   ShiftOperator │  │         ▼                │  │  │
     │  └─────────────────┼──┼──▶ ShiftOperator        │  │  │
     │                    │  │                           │  │  │
     │ OperatorAssignment │  │                           │  │  │
     └────────────────────┼──┼───────────────────────────┘  │  │
                          │  │ 1────N                       │  │
                          │  └─────────┐                    │  │
                          │            ▼                    │  │
                          │  ┌──────────────────┐           │  │
                          │  │ ProductionFlow   │           │  │
                          │  │                    │           │  │
                          │  │ id (PK)           │           │  │
                          │  │ lineId (FK→Line)  │           │  │
                          │  │ sku               │           │  │
                          │  │ nominalSpeed      │           │  │
                          │  └──────────────────┘           │  │
                          │       │  │                       │  │
                          │       │  │ N────N (FlowEquipment)│  │
                          │       │  └───────────────────────┘  │
                          │       │                              │
                          │       │ 1────N                       │
                          │       ▼                              │
                          │  ┌──────────────────┐               │
                          │  │ ProductionOrder  │               │
                          │  │                    │               │
                          │  │ flowId (FK→Flow)  │               │
                          │  │ lineId (FK→Line)  │               │
                          │  │ targetQuantity    │               │
                          │  │ status            │               │
                          │  └──────────────────┘               │
                          │       │                              │
                          │       │ 1────N                       │
                          │       ▼                              │
                          │  ┌──────────────────┐               │
                          │  │HourlyProduction  │               │
                          │  └──────────────────┘               │
                          │                                      │
                          │ 1────N (Stop)                        │
                          └──────────────────────────────────────┘
                                    │ 1────N
                                    ▼
                          ┌──────────────────┐
                          │MachineTelemetry  │
                          └──────────────────┘

        (standalone: DeviceLog, SystemLog, ErrorSignal — linked by EquipmentId/LineId)
```

### Resumo de Relacionamentos

| Entidade pai        | Relacionamento | Entidade filha       | FK                      |
|---------------------|----------------|----------------------|-------------------------|
| Site                | 1:N            | ProductionLine       | Line.SiteId             |
| Site                | 1:N            | AppUser              | User.SiteId             |
| Site                | 1:N            | StopCategoryConfig   | Config.SiteId           |
| Site                | 1:N            | Shift                | Shift.SiteId            |
| ProductionLine      | 1:N            | Equipment            | Equipment.LineId        |
| ProductionLine      | 1:N            | Transport            | Transport.LineId        |
| ProductionLine      | 1:N            | ProductionFlow       | Flow.LineId             |
| ProductionLine      | 1:N            | ProductionOrder      | Order.LineId            |
| ProductionLine      | 1:N            | Shift                | Shift.LineId (nullable) |
| ProductionLine      | 0..1:1         | ProductionFlow       | Line.ActiveFlowId       |
| ProductionFlow      | N:N            | Equipment            | FlowEquipment (join)    |
| ProductionFlow      | 1:N            | ProductionOrder      | Order.FlowId            |
| ProductionOrder     | 1:N            | HourlyProduction     | Hourly.OrderId          |
| Equipment           | 1:N            | Stop                 | Stop.EquipmentId        |
| Equipment           | 1:N            | MachineTelemetry     | Telemetry.EquipmentId   |
| Equipment           | N:N            | AppUser              | OperatorAssignment      |
| Transport           | 1:N            | TransportTelemetry   | TelTrans.TransportId    |
| Shift               | N:N            | AppUser              | ShiftOperator (join)    |
| Stop                | N:1            | ProductionOrder      | Stop.ProductionOrderId  |
| Stop                | N:1            | Shift                | Stop.ShiftId            |

---

## 4. API Endpoints Completos (REST)

### 4.1 Auth

| Method | Endpoint                | Body                                | Response                          |
|--------|-------------------------|-------------------------------------|-----------------------------------|
| POST   | `/api/auth/login`       | `{ email, password }`               | `{ user, token, refreshToken }`   |
| POST   | `/api/auth/register`    | `{ name, email, password, role }`   | `{ user, token, refreshToken }`   |
| GET    | `/api/auth/me`          | —                                   | `AuthUser`                        |
| POST   | `/api/auth/logout`      | —                                   | 204                               |
| POST   | `/api/auth/refresh`     | `{ refreshToken }`                  | `{ token, refreshToken }`         |

### 4.2 Sites

| Method | Endpoint             | Body                           | Response  | Auth    |
|--------|----------------------|--------------------------------|-----------|---------|
| GET    | `/api/sites`         | —                              | `Site[]`  | All     |
| GET    | `/api/sites/:id`     | —                              | `Site`    | All     |
| POST   | `/api/sites`         | `{ name, location, timezone }` | `Site`    | Admin   |
| PUT    | `/api/sites/:id`     | partial update                 | `Site`    | Admin   |
| DELETE | `/api/sites/:id`     | —                              | 204       | Admin   |

### 4.3 Production Lines

| Method | Endpoint                   | Body                                        | Response           | Auth         |
|--------|----------------------------|---------------------------------------------|--------------------|--------------|
| GET    | `/api/lines`               | —                                           | `ProductionLine[]` | All          |
| GET    | `/api/sites/:siteId/lines` | —                                           | `ProductionLine[]` | All          |
| GET    | `/api/lines/:id`           | —                                           | `ProductionLine`   | All          |
| POST   | `/api/lines`               | `{ name, type, siteId, nominalSpeed }`      | `ProductionLine`   | Admin        |
| PUT    | `/api/lines/:id`           | partial                                     | `ProductionLine`   | Admin        |
| DELETE | `/api/lines/:id`           | —                                           | 204                | Admin        |
| PATCH  | `/api/lines/:id/activate-flow` | `{ flowId }`                            | `ProductionLine`   | Lideranca+   |

### 4.4 Equipment

| Method | Endpoint                        | Body                                              | Response      | Auth   |
|--------|---------------------------------|---------------------------------------------------|---------------|--------|
| GET    | `/api/equipments`               | —                                                 | `Equipment[]` | All    |
| GET    | `/api/lines/:lineId/equipments` | —                                                 | `Equipment[]` | All    |
| POST   | `/api/equipments`               | `{ name,type,lineId,position,nominalSpeed,x,y }`  | `Equipment`   | Admin  |
| PUT    | `/api/equipments/:id`           | partial                                           | `Equipment`   | Admin  |
| DELETE | `/api/equipments/:id`           | —                                                 | 204           | Admin  |
| PATCH  | `/api/equipments/:id/position`  | `{ x, y, position }`                              | `Equipment`   | Admin  |

### 4.5 Transports

| Method | Endpoint                        | Body                                               | Response       | Auth   |
|--------|---------------------------------|----------------------------------------------------|----------------|--------|
| GET    | `/api/lines/:lineId/transports` | —                                                  | `Transport[]`  | All    |
| POST   | `/api/transports`               | `{ lineId,fromPos,toPos,type,capacity,sensorId }`  | `Transport`    | Admin  |
| PUT    | `/api/transports/:id`           | partial                                            | `Transport`    | Admin  |
| DELETE | `/api/transports/:id`           | —                                                  | 204            | Admin  |

### 4.6 Flows (Products)

| Method | Endpoint                     | Body                                               | Response          | Auth   |
|--------|------------------------------|----------------------------------------------------|--------------------|--------|
| GET    | `/api/flows`                 | —                                                  | `ProductionFlow[]` | All    |
| GET    | `/api/lines/:lineId/flows`   | —                                                  | `ProductionFlow[]` | All    |
| POST   | `/api/flows`                 | `{ name,sku,lineId,equipmentIds,nominalSpeed }`     | `ProductionFlow`   | Admin  |
| PUT    | `/api/flows/:id`             | partial                                            | `ProductionFlow`   | Admin  |
| DELETE | `/api/flows/:id`             | —                                                  | 204               | Admin  |

### 4.7 Production Orders

| Method | Endpoint                        | Body                                                    | Response            | Auth       |
|--------|---------------------------------|---------------------------------------------------------|---------------------|------------|
| GET    | `/api/orders`                   | `?lineId=&status=`                                      | `ProductionOrder[]` | All        |
| GET    | `/api/orders/:id`               | —                                                       | `ProductionOrder`   | All        |
| POST   | `/api/orders`                   | `{ orderNumber,flowId,lineId,targetQty,plannedStart }`  | `ProductionOrder`   | Lideranca+ |
| PUT    | `/api/orders/:id`               | partial                                                 | `ProductionOrder`   | Lideranca+ |
| PATCH  | `/api/orders/:id/start`         | —                                                       | `ProductionOrder`   | Operacao+  |
| PATCH  | `/api/orders/:id/complete`      | —                                                       | `ProductionOrder`   | Lideranca+ |
| PATCH  | `/api/orders/:id/cancel`        | `{ reason }`                                            | `ProductionOrder`   | Lideranca+ |

### 4.8 Hourly Production

| Method | Endpoint                             | Body                                               | Response              | Auth      |
|--------|--------------------------------------|----------------------------------------------------|-----------------------|-----------|
| GET    | `/api/orders/:orderId/hourly`        | —                                                  | `HourlyProduction[]`  | All       |
| POST   | `/api/orders/:orderId/hourly`        | `{ hourStart,plannedQty,actualQty,rejectedQty }`   | `HourlyProduction`    | Operacao+ |
| PUT    | `/api/hourly/:id`                    | partial                                            | `HourlyProduction`    | Operacao+ |

### 4.9 Stops

| Method | Endpoint                          | Body / Query                                            | Response  | Auth      |
|--------|-----------------------------------|---------------------------------------------------------|-----------|-----------|
| GET    | `/api/lines/:lineId/stops`        | `?active=true&from=&to=&category=`                      | `Stop[]`  | All       |
| GET    | `/api/machines/:machineId/stops`  | `?from=&to=`                                            | `Stop[]`  | All       |
| POST   | `/api/stops`                      | `{ equipmentId,lineId,category,startTime,notes }`       | `Stop`    | Operacao+ |
| PATCH  | `/api/stops/:id/close`            | `{ endTime, notes? }`                                   | `Stop`    | Operacao+ |
| DELETE | `/api/stops/:id`                  | —                                                       | 204       | Admin     |

### 4.10 Real-time Data

| Method | Endpoint                             | Response               | Auth |
|--------|--------------------------------------|------------------------|------|
| GET    | `/api/realtime/lines/:lineId`        | `RealtimeLineData`     | All  |
| GET    | `/api/lines/:lineId/dli?date=`       | `DLIDataPoint[]`       | All  |
| GET    | `/api/lines/:lineId/oee-history`     | `OEEHistoryPoint[]`    | All  |
| GET    | `/api/lines/:lineId/stops/pareto`    | `ParetoDataPoint[]`    | All  |
| GET    | `/api/lines/:lineId/timeline?date=`  | `MachineTimeline[]`    | All  |
| GET    | `/api/lines/:lineId/speed-samples`   | `SpeedSample[]`        | All  |

### 4.11 Shifts

| Method | Endpoint                          | Body                                               | Response   | Auth   |
|--------|-----------------------------------|------------------------------------------------------|-----------|--------|
| GET    | `/api/sites/:siteId/shifts`       | —                                                    | `Shift[]` | All    |
| POST   | `/api/shifts`                     | `{ siteId,lineId?,name,startTime,endTime,crosses }`  | `Shift`   | Admin  |
| PUT    | `/api/shifts/:id`                 | partial                                              | `Shift`   | Admin  |
| DELETE | `/api/shifts/:id`                 | —                                                    | 204       | Admin  |
| POST   | `/api/shifts/:id/operators`       | `{ userIds: [] }`                                    | 200       | Admin  |

### 4.12 Users

| Method | Endpoint                    | Body                                       | Response     | Auth   |
|--------|-----------------------------|-------------------------------------------|--------------|--------|
| GET    | `/api/users`                | `?role=&siteId=`                          | `AppUser[]`  | Admin  |
| GET    | `/api/users/:id`            | —                                          | `AppUser`    | Admin  |
| POST   | `/api/users`                | `{ name,email,password,role,siteId }`      | `AppUser`    | Admin  |
| PUT    | `/api/users/:id`            | partial                                    | `AppUser`    | Admin  |
| DELETE | `/api/users/:id`            | —                                          | 204          | Admin  |
| POST   | `/api/users/:id/assign`     | `{ equipmentIds: [] }`                     | 200          | Admin  |

### 4.13 Connectivity (Gateway + Camera)

| Method | Endpoint                             | Response                | Auth |
|--------|--------------------------------------|-------------------------|------|
| GET    | `/api/connectivity/status`           | `ConnectivityStatus`    | All  |
| GET    | `/api/connectivity/history`          | `DeviceLog[]`           | Admin|
| GET    | `/api/connectivity/timeline?hours=2` | `ConnTimelinePoint[]`   | Admin|

### 4.14 Debug (Admin Only)

| Method | Endpoint                      | Query                           | Response         | Auth  |
|--------|-------------------------------|---------------------------------|------------------|-------|
| GET    | `/api/debug/logs`             | `?level=&source=&limit=100`    | `SystemLog[]`    | Admin |
| GET    | `/api/debug/errors`           | `?resolved=false&severity=`    | `ErrorSignal[]`  | Admin |
| PATCH  | `/api/debug/errors/:id/resolve`| `{ notes }`                   | `ErrorSignal`    | Admin |

### 4.15 Gateway Ingestion (ESP32 → Backend)

| Method | Endpoint                        | Body                                                  | Auth           |
|--------|---------------------------------|-------------------------------------------------------|----------------|
| POST   | `/api/gateway/telemetry`        | `TelemetryPayload` (ver seção 6)                      | API Key        |
| POST   | `/api/gateway/telemetry/batch`  | `TelemetryPayload[]`                                  | API Key        |
| POST   | `/api/gateway/heartbeat`        | `{ deviceId, deviceType, latency, memUsage, fw }`     | API Key        |
| POST   | `/api/gateway/camera/frame`     | multipart: frame JPEG + metadata                       | API Key        |
| POST   | `/api/gateway/transport`        | `{ transportId, accPercent, currentUnits }`            | API Key        |
| POST   | `/api/gateway/error`            | `{ deviceId, code, message, severity }`                | API Key        |

---

## 5. Real-Time (SignalR Hub)

### Hub URL: `/hubs/production`

### Server → Client Events

| Event                      | Payload                                                          | Descrição                                  |
|----------------------------|------------------------------------------------------------------|--------------------------------------------|
| `MachineStatusChanged`     | `{ equipmentId, status, timestamp }`                             | Mudança de status de máquina               |
| `ThroughputUpdate`         | `{ equipmentId, throughput, timestamp }`                         | Atualização de vazão                       |
| `OEEUpdate`                | `{ lineId, oee: { availability, performance, quality, oee } }`  | Recálculo de OEE da linha                  |
| `TransportUpdate`          | `{ transportId, accLevel, accPercent, currentUnits }`            | Acúmulo no transporte                     |
| `StopStarted`              | `Stop`                                                           | Nova parada registrada                     |
| `StopEnded`                | `Stop`                                                           | Parada encerrada                           |
| `GatewayStatusChanged`     | `{ deviceId, connected, latency, lastSeen, memUsage, fw }`      | Status do gateway ESP32                    |
| `CameraStatusChanged`      | `{ deviceId, connected, fps, lastFrame }`                        | Status da câmera                           |
| `OrderStatusChanged`       | `ProductionOrder`                                                | Mudança de status da ordem                 |
| `ErrorSignalRaised`        | `ErrorSignal`                                                    | Novo erro detectado                        |
| `ErrorSignalResolved`      | `ErrorSignal`                                                    | Erro resolvido                             |
| `SystemAlert`              | `{ level, source, message, timestamp }`                          | Alerta do sistema                          |

### Client → Server Methods

| Method                  | Params              | Descrição                          |
|-------------------------|---------------------|------------------------------------|
| `JoinLineGroup`         | `lineId: string`    | Inscrever-se na linha              |
| `LeaveLineGroup`        | `lineId: string`    | Sair do grupo da linha             |
| `JoinDebugGroup`        | —                   | Admin: receber logs em tempo real  |
| `LeaveDebugGroup`       | —                   | Admin: parar de receber logs       |

---

## 6. Telemetria IoT — Especificação Completa

### 6.1 Payload de Telemetria do ESP32 → Backend

```json
{
  "deviceId": "gw-esp32-001",
  "timestamp": "2026-03-08T22:35:12.456Z",
  "equipmentId": "eq-1",
  "measurements": {
    "status": 0,
    "throughput": 440,
    "counters": {
      "totalProduced": 12450,
      "goodParts": 12320,
      "rejectedParts": 130
    },
    "sensors": {
      "temperature": 42.5,
      "vibration": 0.23,
      "current": 3.8
    }
  },
  "meta": {
    "firmwareVersion": "2.4.1",
    "uptime": 86400,
    "freeHeap": 45000,
    "wifiRssi": -62
  }
}
```

### 6.2 Heartbeat do Gateway

```json
{
  "deviceId": "gw-esp32-001",
  "deviceType": "gateway",
  "timestamp": "2026-03-08T22:35:00Z",
  "latencyMs": 18,
  "memoryUsagePercent": 65,
  "firmwareVersion": "2.4.1",
  "connectedSensors": 5,
  "uptime": 86400
}
```

### 6.3 Status da Câmera

```json
{
  "deviceId": "cam-esp32s3-001",
  "deviceType": "camera",
  "timestamp": "2026-03-08T22:35:00Z",
  "connected": true,
  "fps": 24,
  "resolution": "640x480",
  "latencyMs": 28,
  "bufferUsagePercent": 35
}
```

### 6.4 Dados de Transporte/Acúmulo

```json
{
  "deviceId": "sensor-transport-01",
  "transportId": "t-001",
  "timestamp": "2026-03-08T22:35:00Z",
  "accumulationPercent": 78,
  "currentUnits": 31,
  "sensorType": "photoelectric"
}
```

### 6.5 MQTT Topics (se usar MQTT)

```
flowvision/
├── {siteId}/
│   ├── {lineId}/
│   │   ├── telemetry/
│   │   │   ├── {equipmentId}          → TelemetryPayload
│   │   │   └── transport/{transportId} → TransportPayload
│   │   ├── status/
│   │   │   ├── {equipmentId}          → { status, timestamp }
│   │   │   └── line                    → { oee, throughput }
│   │   └── stops/
│   │       └── {equipmentId}          → StopEvent
│   ├── gateway/
│   │   ├── heartbeat                   → HeartbeatPayload
│   │   └── errors                      → ErrorPayload
│   └── camera/
│       ├── status                      → CameraStatusPayload
│       └── frames                      → binary (JPEG)
```

### 6.6 Fluxo de Processamento

```
ESP32 → POST /api/gateway/telemetry (ou MQTT)
         │
         ▼
    TelemetryProcessor (Background Service)
         │
         ├── 1. Valida payload (schema + deviceId)
         ├── 2. Persiste em MachineTelemetry
         ├── 3. Atualiza status do Equipment (se mudou)
         ├── 4. Detecta parada automática (status != Running → cria Stop)
         ├── 5. Recalcula OEE (via OEECalculator)
         ├── 6. Atualiza DLI (throughput acumulado)
         ├── 7. Publica via SignalR para clientes conectados
         │       ├── MachineStatusChanged
         │       ├── ThroughputUpdate
         │       └── OEEUpdate
         └── 8. Verifica alertas (latência, desconexão, etc.)
                 └── Se alerta → ErrorSignal + SignalR ErrorSignalRaised
```

---

## 7. Database Schema Completo (SQL / PostgreSQL)

```sql
-- =============================================
-- ENUMS (PostgreSQL)
-- =============================================

CREATE TYPE machine_status AS ENUM ('running','fault','shortage','accumulation','scheduled','setup','disconnected');
CREATE TYPE transport_type AS ENUM ('conveyor','buffer','gravity');
CREATE TYPE accumulation_level AS ENUM ('empty','low','normal','high','critical');
CREATE TYPE stop_category AS ENUM ('maintenance','setup','material_shortage','quality_issue','operator_absence','planned','other');
CREATE TYPE order_status AS ENUM ('planned','in_progress','completed','cancelled','on_hold');
CREATE TYPE user_role AS ENUM ('admin','lideranca','operacao');
CREATE TYPE device_type AS ENUM ('gateway','camera');
CREATE TYPE connectivity_event_type AS ENUM ('connected','disconnected','timeout','reconnected','latency_spike','heartbeat_ok','firmware_update','memory_warning','crc_error','buffer_overflow');
CREATE TYPE system_log_level AS ENUM ('info','warning','error','success');
CREATE TYPE error_severity AS ENUM ('low','medium','high','critical');

-- =============================================
-- CORE TABLES
-- =============================================

CREATE TABLE sites (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(200) NOT NULL,
    location    VARCHAR(300),
    timezone    VARCHAR(100) DEFAULT 'America/Sao_Paulo',
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT now(),
    updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE app_users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(200) NOT NULL,
    email           VARCHAR(300) NOT NULL UNIQUE,
    password_hash   VARCHAR(500) NOT NULL,
    role            user_role NOT NULL DEFAULT 'operacao',
    site_id         UUID REFERENCES sites(id) ON DELETE SET NULL,
    is_active       BOOLEAN DEFAULT true,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE production_lines (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(200) NOT NULL,
    type            VARCHAR(100),
    site_id         UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    nominal_speed   INT NOT NULL DEFAULT 0,
    is_active       BOOLEAN DEFAULT true,
    active_flow_id  UUID,  -- FK added after production_flows created
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE equipments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                VARCHAR(200) NOT NULL,
    type                VARCHAR(100),
    line_id             UUID NOT NULL REFERENCES production_lines(id) ON DELETE CASCADE,
    position            INT NOT NULL,
    nominal_speed       INT NOT NULL DEFAULT 0,
    x                   DOUBLE PRECISION DEFAULT 0,
    y                   DOUBLE PRECISION DEFAULT 0,
    gateway_device_id   VARCHAR(100),    -- ID do dispositivo no ESP32
    camera_device_id    VARCHAR(100),    -- ID da câmera associada
    is_active           BOOLEAN DEFAULT true,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE transports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    line_id         UUID NOT NULL REFERENCES production_lines(id) ON DELETE CASCADE,
    from_position   INT NOT NULL,
    to_position     INT NOT NULL,
    type            transport_type DEFAULT 'conveyor',
    capacity        INT NOT NULL DEFAULT 50,
    sensor_device_id VARCHAR(100),       -- sensor IoT para acúmulo
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE production_flows (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(200) NOT NULL,
    sku             VARCHAR(50) NOT NULL,
    line_id         UUID NOT NULL REFERENCES production_lines(id) ON DELETE CASCADE,
    nominal_speed   INT NOT NULL DEFAULT 0,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Add FK after production_flows exists
ALTER TABLE production_lines 
    ADD CONSTRAINT fk_active_flow 
    FOREIGN KEY (active_flow_id) REFERENCES production_flows(id) ON DELETE SET NULL;

CREATE TABLE flow_equipments (
    flow_id                 UUID NOT NULL REFERENCES production_flows(id) ON DELETE CASCADE,
    equipment_id            UUID NOT NULL REFERENCES equipments(id) ON DELETE CASCADE,
    override_nominal_speed  INT,
    PRIMARY KEY (flow_id, equipment_id)
);

-- =============================================
-- PRODUCTION ORDERS
-- =============================================

CREATE TABLE production_orders (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number        VARCHAR(50) NOT NULL UNIQUE,
    flow_id             UUID NOT NULL REFERENCES production_flows(id),
    line_id             UUID NOT NULL REFERENCES production_lines(id),
    target_quantity     INT NOT NULL,
    produced_quantity   INT DEFAULT 0,
    rejected_quantity   INT DEFAULT 0,
    status              order_status DEFAULT 'planned',
    planned_start       TIMESTAMPTZ NOT NULL,
    planned_end         TIMESTAMPTZ,
    actual_start        TIMESTAMPTZ,
    actual_end          TIMESTAMPTZ,
    notes               TEXT,
    created_by          UUID REFERENCES app_users(id),
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE hourly_productions (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID NOT NULL REFERENCES production_orders(id) ON DELETE CASCADE,
    line_id             UUID NOT NULL REFERENCES production_lines(id),
    hour_start          TIMESTAMPTZ NOT NULL,
    planned_quantity    INT DEFAULT 0,
    actual_quantity     INT DEFAULT 0,
    rejected_quantity   INT DEFAULT 0,
    operator            VARCHAR(200),
    notes               TEXT,
    created_at          TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- SHIFTS
-- =============================================

CREATE TABLE shifts (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id          UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    line_id          UUID REFERENCES production_lines(id) ON DELETE CASCADE,
    name             VARCHAR(100) NOT NULL,
    start_time       TIME NOT NULL,
    end_time         TIME NOT NULL,
    crosses_midnight BOOLEAN DEFAULT false,
    is_active        BOOLEAN DEFAULT true,
    created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE shift_operators (
    shift_id    UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (shift_id, user_id)
);

CREATE TABLE operator_assignments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    equipment_id    UUID NOT NULL REFERENCES equipments(id) ON DELETE CASCADE,
    assigned_at     TIMESTAMPTZ DEFAULT now(),
    unassigned_at   TIMESTAMPTZ
);

-- =============================================
-- STOPS
-- =============================================

CREATE TABLE stops (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id        UUID NOT NULL REFERENCES equipments(id),
    machine_name        VARCHAR(200),
    line_id             UUID NOT NULL REFERENCES production_lines(id),
    category            stop_category NOT NULL,
    start_time          TIMESTAMPTZ NOT NULL,
    end_time            TIMESTAMPTZ,
    duration_minutes    INT,
    notes               TEXT,
    registered_by       UUID REFERENCES app_users(id),
    production_order_id UUID REFERENCES production_orders(id),
    shift_id            UUID REFERENCES shifts(id),
    is_auto_detected    BOOLEAN DEFAULT false,
    created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE stop_category_configs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    site_id     UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    category    stop_category NOT NULL,
    label       VARCHAR(100) NOT NULL,
    color       VARCHAR(50) NOT NULL,
    sort_order  INT DEFAULT 0,
    is_active   BOOLEAN DEFAULT true,
    UNIQUE(site_id, category)
);

-- =============================================
-- TELEMETRY (TIME-SERIES)
-- =============================================

CREATE TABLE machine_telemetry (
    id              BIGSERIAL PRIMARY KEY,
    equipment_id    UUID NOT NULL REFERENCES equipments(id),
    status          machine_status NOT NULL,
    throughput      INT NOT NULL,
    availability    DECIMAL(5,2),
    performance     DECIMAL(5,2),
    quality         DECIMAL(5,2),
    oee             DECIMAL(5,2),
    raw_payload     JSONB,
    timestamp       TIMESTAMPTZ NOT NULL
);

CREATE INDEX ix_telemetry_eq_time ON machine_telemetry (equipment_id, timestamp DESC);

-- TimescaleDB (optional): SELECT create_hypertable('machine_telemetry', 'timestamp');

CREATE TABLE transport_telemetry (
    id                      BIGSERIAL PRIMARY KEY,
    transport_id            UUID NOT NULL REFERENCES transports(id),
    accumulation_level      accumulation_level NOT NULL,
    accumulation_percent    INT NOT NULL,
    current_units           INT NOT NULL,
    raw_payload             JSONB,
    timestamp               TIMESTAMPTZ NOT NULL
);

CREATE INDEX ix_transport_tel_time ON transport_telemetry (transport_id, timestamp DESC);

-- =============================================
-- DEVICE LOGS & ERROR SIGNALS (DEBUG)
-- =============================================

CREATE TABLE device_logs (
    id                      BIGSERIAL PRIMARY KEY,
    device_id               VARCHAR(100) NOT NULL,
    device_type             device_type NOT NULL,
    event_type              connectivity_event_type NOT NULL,
    latency_ms              INT,
    fps                     INT,
    memory_usage_percent    INT,
    firmware_version        VARCHAR(50),
    detail                  TEXT,
    raw_payload             JSONB,
    equipment_id            UUID REFERENCES equipments(id),
    line_id                 UUID REFERENCES production_lines(id),
    timestamp               TIMESTAMPTZ NOT NULL
);

CREATE INDEX ix_device_logs_time ON device_logs (timestamp DESC);
CREATE INDEX ix_device_logs_device ON device_logs (device_id, timestamp DESC);

CREATE TABLE error_signals (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source              VARCHAR(100) NOT NULL,
    code                VARCHAR(50) NOT NULL,
    message             TEXT NOT NULL,
    severity            error_severity NOT NULL,
    is_resolved         BOOLEAN DEFAULT false,
    resolved_at         TIMESTAMPTZ,
    resolved_by         UUID REFERENCES app_users(id),
    resolution_notes    TEXT,
    equipment_id        UUID REFERENCES equipments(id),
    line_id             UUID REFERENCES production_lines(id),
    raw_payload         JSONB,
    timestamp           TIMESTAMPTZ NOT NULL
);

CREATE INDEX ix_errors_unresolved ON error_signals (is_resolved, severity, timestamp DESC);

CREATE TABLE system_logs (
    id          BIGSERIAL PRIMARY KEY,
    level       system_log_level NOT NULL,
    source      VARCHAR(100) NOT NULL,
    message     TEXT NOT NULL,
    stack_trace TEXT,
    metadata    JSONB,
    timestamp   TIMESTAMPTZ NOT NULL
);

CREATE INDEX ix_system_logs_time ON system_logs (timestamp DESC);
CREATE INDEX ix_system_logs_level ON system_logs (level, timestamp DESC);

-- =============================================
-- VIEWS (Performance)
-- =============================================

CREATE OR REPLACE VIEW v_active_stops AS
SELECT s.*, e.name as equipment_name, pl.name as line_name
FROM stops s
JOIN equipments e ON e.id = s.equipment_id
JOIN production_lines pl ON pl.id = s.line_id
WHERE s.end_time IS NULL;

CREATE OR REPLACE VIEW v_line_oee_latest AS
SELECT DISTINCT ON (mt.equipment_id)
    mt.equipment_id,
    e.line_id,
    mt.status,
    mt.throughput,
    mt.availability,
    mt.performance,
    mt.quality,
    mt.oee,
    mt.timestamp
FROM machine_telemetry mt
JOIN equipments e ON e.id = mt.equipment_id
ORDER BY mt.equipment_id, mt.timestamp DESC;

CREATE OR REPLACE VIEW v_device_status AS
SELECT DISTINCT ON (device_id)
    device_id,
    device_type,
    event_type,
    latency_ms,
    fps,
    memory_usage_percent,
    firmware_version,
    timestamp
FROM device_logs
ORDER BY device_id, timestamp DESC;
```

---

## 8. Autenticação & Autorização

### JWT Bearer Token

- Login retorna `token` (15 min TTL) + `refreshToken` (7 dias)
- Todas as rotas (exceto `/api/auth/login`, `/api/auth/register`, `/api/gateway/*`) requerem `Authorization: Bearer <token>`
- Rotas `/api/gateway/*` usam `X-API-Key: <gateway-api-key>` (chave fixa do ESP32)
- SignalR: token via query string `?access_token=<token>`

### Roles & Permissões (Matriz)

| Funcionalidade                 | Operação | Liderança | Admin |
|--------------------------------|----------|-----------|-------|
| Visualizar Linha ao Vivo       | ✅        | ✅         | ✅     |
| Registrar/Encerrar Paradas     | ✅        | ✅         | ✅     |
| Produção H/H                   | ✅        | ✅         | ✅     |
| Dashboard consolidado          | ❌        | ✅         | ✅     |
| Ordens de Produção (criar)     | ❌        | ✅         | ✅     |
| Configurações (CRUD)           | ❌        | ❌         | ✅     |
| Gestão de Usuários             | ❌        | ❌         | ✅     |
| Debug (Logs/Errors)            | ❌        | ❌         | ✅     |

---

## 9. Variáveis de Ambiente

### Backend (appsettings.json)

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=flowvision;Username=flowvision;Password=<password>"
  },
  "Jwt": {
    "Secret": "<jwt-secret-256-bits>",
    "Issuer": "FlowVision",
    "Audience": "FlowVisionApp",
    "TokenExpirationMinutes": 15,
    "RefreshTokenExpirationDays": 7
  },
  "Gateway": {
    "ApiKey": "<gateway-api-key>",
    "HeartbeatTimeoutSeconds": 30,
    "TelemetryRetentionDays": 90
  },
  "Mqtt": {
    "Host": "localhost",
    "Port": 1883,
    "ClientId": "flowvision-backend",
    "Username": "flowvision",
    "Password": "<mqtt-password>",
    "BaseTopic": "flowvision/"
  },
  "Cors": {
    "AllowedOrigins": ["http://localhost:8080", "https://app.flowvision.com.br"]
  },
  "Serilog": {
    "MinimumLevel": "Information",
    "WriteTo": [
      { "Name": "Console" },
      { "Name": "PostgreSQL", "Args": { "connectionString": "...", "tableName": "system_logs" } }
    ]
  }
}
```

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:5000
```

---

## 10. Projeto .NET — Estrutura de Pastas

```
FlowVision.API/
├── Controllers/
│   ├── AuthController.cs
│   ├── SitesController.cs
│   ├── LinesController.cs
│   ├── EquipmentsController.cs
│   ├── TransportsController.cs
│   ├── FlowsController.cs
│   ├── ProductionOrdersController.cs
│   ├── HourlyProductionController.cs
│   ├── StopsController.cs
│   ├── ShiftsController.cs
│   ├── UsersController.cs
│   ├── RealtimeController.cs
│   ├── ConnectivityController.cs
│   ├── DebugController.cs
│   └── GatewayController.cs             ← recebe dados do ESP32
├── Hubs/
│   └── ProductionHub.cs                  ← SignalR hub
├── Services/
│   ├── IOEECalculator.cs                 ← interface
│   ├── OEECalculator.cs                  ← cálculo de OEE em tempo real
│   ├── ITelemetryProcessor.cs
│   ├── TelemetryProcessor.cs             ← processa dados do ESP32
│   ├── IAuthService.cs
│   ├── AuthService.cs
│   ├── IStopAnalyzer.cs
│   ├── StopAnalyzer.cs                   ← pareto, durações, auto-detect
│   ├── IShiftManager.cs
│   ├── ShiftManager.cs                   ← turno atual, operadores
│   ├── IAlertEngine.cs
│   └── AlertEngine.cs                    ← gera ErrorSignals
├── Models/
│   ├── Site.cs
│   ├── ProductionLine.cs
│   ├── Equipment.cs
│   ├── Transport.cs
│   ├── ProductionFlow.cs
│   ├── FlowEquipment.cs
│   ├── ProductionOrder.cs
│   ├── HourlyProduction.cs
│   ├── Stop.cs
│   ├── StopCategoryConfig.cs
│   ├── Shift.cs
│   ├── ShiftOperator.cs
│   ├── OperatorAssignment.cs
│   ├── AppUser.cs
│   ├── MachineTelemetry.cs
│   ├── TransportTelemetry.cs
│   ├── DeviceLog.cs
│   ├── ErrorSignal.cs
│   ├── SystemLog.cs
│   └── Enums/
│       ├── MachineStatus.cs
│       ├── TransportType.cs
│       ├── AccumulationLevel.cs
│       ├── StopCategory.cs
│       ├── OrderStatus.cs
│       ├── UserRole.cs
│       ├── DeviceType.cs
│       ├── ConnectivityEventType.cs
│       ├── SystemLogLevel.cs
│       └── ErrorSeverity.cs
├── DTOs/
│   ├── Auth/
│   │   ├── LoginDto.cs
│   │   ├── RegisterDto.cs
│   │   ├── AuthResponseDto.cs
│   │   └── RefreshTokenDto.cs
│   ├── Gateway/
│   │   ├── TelemetryPayloadDto.cs
│   │   ├── HeartbeatDto.cs
│   │   ├── CameraStatusDto.cs
│   │   ├── TransportPayloadDto.cs
│   │   └── ErrorReportDto.cs
│   ├── Realtime/
│   │   ├── RealtimeLineDataDto.cs
│   │   ├── DLIDataPointDto.cs
│   │   ├── OEEHistoryPointDto.cs
│   │   ├── ParetoDataPointDto.cs
│   │   ├── MachineTimelineDto.cs
│   │   └── SpeedSampleDto.cs
│   ├── CreateSiteDto.cs
│   ├── CreateLineDto.cs
│   ├── CreateEquipmentDto.cs
│   ├── CreateTransportDto.cs
│   ├── CreateFlowDto.cs
│   ├── CreateOrderDto.cs
│   ├── CreateHourlyDto.cs
│   ├── CreateStopDto.cs
│   ├── CloseStopDto.cs
│   ├── CreateShiftDto.cs
│   ├── CreateUserDto.cs
│   └── ConnTimelinePointDto.cs
├── Data/
│   ├── AppDbContext.cs
│   ├── Configurations/
│   │   ├── SiteConfiguration.cs
│   │   ├── ProductionLineConfiguration.cs
│   │   ├── EquipmentConfiguration.cs
│   │   ├── TransportConfiguration.cs
│   │   ├── ProductionFlowConfiguration.cs
│   │   ├── FlowEquipmentConfiguration.cs
│   │   ├── ProductionOrderConfiguration.cs
│   │   ├── StopConfiguration.cs
│   │   ├── ShiftConfiguration.cs
│   │   ├── AppUserConfiguration.cs
│   │   ├── MachineTelemetryConfiguration.cs
│   │   ├── TransportTelemetryConfiguration.cs
│   │   ├── DeviceLogConfiguration.cs
│   │   ├── ErrorSignalConfiguration.cs
│   │   └── SystemLogConfiguration.cs
│   ├── Migrations/
│   └── Seed/
│       └── SeedData.cs
├── Background/
│   ├── MqttListenerService.cs            ← Background Service para MQTT
│   ├── HeartbeatMonitorService.cs        ← Detecta desconexões
│   └── OEEAggregatorService.cs           ← Agrega OEE a cada N segundos
├── Middleware/
│   ├── GatewayApiKeyMiddleware.cs        ← Valida X-API-Key do ESP32
│   └── ExceptionHandlingMiddleware.cs
├── Extensions/
│   ├── ServiceCollectionExtensions.cs
│   └── ClaimsPrincipalExtensions.cs
├── Program.cs
├── appsettings.json
├── appsettings.Development.json
├── Dockerfile
└── docker-compose.yml
```

---

## 11. Docker Compose

```yaml
version: '3.8'

services:
  postgres:
    image: timescale/timescaledb:latest-pg16
    environment:
      POSTGRES_DB: flowvision
      POSTGRES_USER: flowvision
      POSTGRES_PASSWORD: ${DB_PASSWORD:-flowvision123}
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  mqtt:
    image: eclipse-mosquitto:2
    ports:
      - "1883:1883"
    volumes:
      - ./mosquitto.conf:/mosquitto/config/mosquitto.conf

  api:
    build: .
    ports:
      - "5000:8080"
    environment:
      - ConnectionStrings__DefaultConnection=Host=postgres;Database=flowvision;Username=flowvision;Password=${DB_PASSWORD:-flowvision123}
      - Mqtt__Host=mqtt
    depends_on:
      - postgres
      - mqtt

volumes:
  pgdata:
```

---

## 12. Regras de Negócio

### Cálculo de OEE

```
OEE = (Availability × Performance × Quality) / 10000

Availability = (Tempo Operando / Tempo Planejado) × 100
Performance  = (Throughput Real / Throughput Nominal) × 100
Quality      = (Peças Boas / Total Produzido) × 100
```

**IMPORTANTE**: O `Throughput Nominal` vem do **Fluxo/Produto ativo** na linha, não da velocidade base da linha.

### Detecção Automática de Paradas

1. Se `status` muda de `Running` para qualquer outro → criar `Stop` com `IsAutoDetected = true`
2. Se `status` volta para `Running` → fechar `Stop` ativa com `EndTime = now()`
3. Categorização automática:
   - `Fault` → `Maintenance`
   - `Setup` → `Setup`
   - `Shortage` → `MaterialShortage`
   - `Scheduled` → `Planned`
   - `Disconnected` → `Other` (requer verificação manual)

### Turnos

- `CrossesMidnight = true` → 3º Turno (22:00 → 06:00)
- Ao calcular métricas, filtrar pelo turno ativo baseado em `DateTime.Now` e `Shift.StartTime/EndTime`
- Cada parada recebe o `ShiftId` ativo no momento da criação

---

## 13. Checklist de Implementação

### Backend (.NET) — Em Ordem

- [ ] `dotnet new webapi -n FlowVision.API --framework net8.0`
- [ ] Instalar NuGets: `Npgsql.EntityFrameworkCore.PostgreSQL`, `Microsoft.AspNetCore.SignalR`, `MQTTnet`, `Serilog`, `Swashbuckle`
- [ ] Criar Models + Enums
- [ ] Criar AppDbContext + EntityTypeConfigurations
- [ ] Configurar JWT Auth + Middleware
- [ ] Criar GatewayApiKeyMiddleware
- [ ] Implementar Controllers CRUD
- [ ] Implementar GatewayController (recebe telemetria)
- [ ] Implementar ProductionHub (SignalR)
- [ ] Criar Services (OEECalculator, TelemetryProcessor, StopAnalyzer, ShiftManager, AlertEngine)
- [ ] Criar Background Services (MqttListener, HeartbeatMonitor, OEEAggregator)
- [ ] Configurar CORS
- [ ] Adicionar Health Checks (`/health`)
- [ ] Configurar Swagger/OpenAPI
- [ ] Seed data (Sites, Lines, Equipments, Flows, Shifts, Admin user)
- [ ] Migrations: `dotnet ef migrations add InitialCreate`
- [ ] Docker + docker-compose

### Frontend (atualizar)
- [ ] Definir `VITE_API_BASE_URL` → ativa modo real em `api.ts`
- [ ] Instalar `@microsoft/signalr`
- [ ] Criar `useSignalR` hook
- [ ] Adicionar JWT interceptor em `apiFetch`
- [ ] Implementar refresh token automático
- [ ] Route guards por role

---

*Documento atualizado em 2026-03-09. Versão definitiva para geração no Cursor.*
