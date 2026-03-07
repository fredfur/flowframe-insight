# FlowVision — Especificação Técnica do Backend (.NET)

> Documento de referência para implementação do backend em .NET (Web API + SignalR).
> Gerado a partir do protótipo React/TypeScript.

---

## 1. Visão Geral

**FlowVision** é um sistema de monitoramento de produção industrial em tempo real.
Dados de sensores são capturados por **ESP32-CAM S3** e enviados ao backend via
gateway/broker. O frontend React consome dados via REST API + SignalR (WebSocket).

### Stack

| Camada       | Tecnologia                        |
|-------------|-----------------------------------|
| Frontend    | React 18 + Vite + TypeScript      |
| Backend     | .NET 8 Web API                    |
| Real-time   | SignalR                           |
| Database    | SQL Server / PostgreSQL           |
| Auth        | JWT Bearer (Identity ou custom)   |
| IoT Gateway | ESP32-CAM S3 → MQTT/HTTP → API   |

---

## 2. Modelo de Dados

### 2.1 Sites (Plantas/Unidades)

```csharp
public class Site
{
    public Guid Id { get; set; }
    public string Name { get; set; }      // "Planta São Paulo"
    public string Location { get; set; }   // "São Paulo, SP"
    
    // Navigation
    public ICollection<ProductionLine> Lines { get; set; }
}
```

### 2.2 ProductionLine (Linha Produtiva)

```csharp
public class ProductionLine
{
    public Guid Id { get; set; }
    public string Name { get; set; }          // "Linha 01 — Envase"
    public string Type { get; set; }          // "Envase", "Montagem"
    public Guid SiteId { get; set; }
    public int NominalSpeed { get; set; }     // velocidade base da linha (u/h)
    
    // Navigation
    public Site Site { get; set; }
    public ICollection<Equipment> Equipments { get; set; }
    public ICollection<ProductionFlow> Flows { get; set; }
}
```

### 2.3 Equipment (Equipamento/Máquina)

```csharp
public class Equipment
{
    public Guid Id { get; set; }
    public string Name { get; set; }          // "Alimentador"
    public string Type { get; set; }          // "Feeder", "Processor", "Inspection", "Packer"
    public Guid LineId { get; set; }
    public int Position { get; set; }         // ordem no fluxo (1, 2, 3...)
    public int NominalSpeed { get; set; }     // velocidade nominal do equipamento (u/h)
    
    // Navigation
    public ProductionLine Line { get; set; }
    public ICollection<Stop> Stops { get; set; }
}
```

### 2.4 ProductionFlow (Fluxo = Tipo de Produto)

> O fluxo define **qual produto está rodando** na linha. Dependendo do produto,
> a velocidade nominal muda. Raramente muda quais equipamentos participam.

```csharp
public class ProductionFlow
{
    public Guid Id { get; set; }
    public string Name { get; set; }          // "Produto A — Garrafa 500ml"
    public string SKU { get; set; }           // "SKU-101"
    public Guid LineId { get; set; }
    public int NominalSpeed { get; set; }     // velocidade da linha para este produto
    
    // Many-to-many (raramente alterado)
    public ICollection<Equipment> Equipments { get; set; }
    
    // Navigation
    public ProductionLine Line { get; set; }
}
```

### 2.5 Stop (Parada)

```csharp
public enum StopCategory
{
    Maintenance,        // Manutenção
    Setup,              // Setup / Troca
    MaterialShortage,   // Falta de Material
    QualityIssue,       // Problema de Qualidade
    OperatorAbsence,    // Ausência de Operador
    Planned,            // Parada Planejada
    Other               // Outros
}

public class Stop
{
    public Guid Id { get; set; }
    public Guid EquipmentId { get; set; }     // FK → Equipment
    public string MachineName { get; set; }   // denormalized for display
    public Guid LineId { get; set; }
    public StopCategory Category { get; set; }
    public DateTime StartTime { get; set; }
    public DateTime? EndTime { get; set; }
    public int? DurationMinutes { get; set; } // computed on close
    public string Notes { get; set; }
    public string RegisteredBy { get; set; }  // user email/id
}
```

### 2.6 User & Roles

```csharp
public enum UserRole
{
    Admin,       // Gestão de usuários, configurações
    Lideranca,   // Dashboards consolidados, indicadores
    Operacao     // Registro de paradas, linha ao vivo
}

public class AppUser  // extends IdentityUser or custom
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string Email { get; set; }
    public UserRole Role { get; set; }
}
```

### 2.7 Real-time Telemetry (não persiste, ou persiste em time-series)

```csharp
public class MachineTelemetry
{
    public Guid EquipmentId { get; set; }
    public MachineStatus Status { get; set; }  // Running, Stopped, Setup, Idle
    public int Throughput { get; set; }         // u/h atual
    public OEEMetrics OEE { get; set; }
    public DateTime Timestamp { get; set; }
}

public class OEEMetrics
{
    public double Availability { get; set; }   // 0-100
    public double Performance { get; set; }    // 0-100
    public double Quality { get; set; }        // 0-100
    public double OEE { get; set; }            // computed: A×P×Q / 10000
}

public enum MachineStatus
{
    Running,
    Stopped,
    Setup,
    Idle
}
```

---

## 3. API Endpoints (REST)

### 3.1 Auth

| Method | Endpoint             | Body                        | Response           |
|--------|----------------------|-----------------------------|--------------------|
| POST   | `/api/auth/login`    | `{ email, password }`       | `{ user, token, refreshToken }` |
| POST   | `/api/auth/register` | `{ name, email, password, role }` | `{ user, token, refreshToken }` |
| GET    | `/api/auth/me`       | —                           | `AuthUser`         |
| POST   | `/api/auth/logout`   | —                           | 204                |
| POST   | `/api/auth/refresh`  | `{ refreshToken }`          | `{ token, refreshToken }` |

### 3.2 Sites

| Method | Endpoint             | Body                  | Response       |
|--------|----------------------|-----------------------|----------------|
| GET    | `/api/sites`         | —                     | `Site[]`       |
| GET    | `/api/sites/:id`     | —                     | `Site`         |
| POST   | `/api/sites`         | `{ name, location }`  | `Site`         |
| PUT    | `/api/sites/:id`     | `{ name, location }`  | `Site`         |
| DELETE | `/api/sites/:id`     | —                     | 204            |

### 3.3 Production Lines

| Method | Endpoint                     | Body                              | Response           |
|--------|------------------------------|-----------------------------------|--------------------|
| GET    | `/api/lines`                 | —                                 | `ProductionLine[]` |
| GET    | `/api/sites/:siteId/lines`   | —                                 | `ProductionLine[]` |
| GET    | `/api/lines/:id`             | —                                 | `ProductionLine`   |
| POST   | `/api/lines`                 | `{ name, type, siteId, nominalSpeed }` | `ProductionLine` |
| PUT    | `/api/lines/:id`             | partial update                    | `ProductionLine`   |
| DELETE | `/api/lines/:id`             | —                                 | 204                |

### 3.4 Equipment

| Method | Endpoint                         | Body                                    | Response      |
|--------|----------------------------------|-----------------------------------------|---------------|
| GET    | `/api/equipments`                | —                                       | `Equipment[]` |
| GET    | `/api/lines/:lineId/equipments`  | —                                       | `Equipment[]` |
| POST   | `/api/equipments`                | `{ name, type, lineId, position, nominalSpeed }` | `Equipment` |
| PUT    | `/api/equipments/:id`            | partial update                          | `Equipment`   |
| DELETE | `/api/equipments/:id`            | —                                       | 204           |

### 3.5 Flows (Products)

| Method | Endpoint                      | Body                                            | Response          |
|--------|-------------------------------|------------------------------------------------|-------------------|
| GET    | `/api/flows`                  | —                                               | `ProductionFlow[]`|
| GET    | `/api/lines/:lineId/flows`    | —                                               | `ProductionFlow[]`|
| POST   | `/api/flows`                  | `{ name, sku, lineId, equipmentIds, nominalSpeed }` | `ProductionFlow` |
| PUT    | `/api/flows/:id`              | partial update                                  | `ProductionFlow`  |
| DELETE | `/api/flows/:id`              | —                                               | 204               |

### 3.6 Stops

| Method | Endpoint                       | Body / Query                          | Response  |
|--------|--------------------------------|---------------------------------------|-----------|
| GET    | `/api/lines/:lineId/stops`     | `?active=true` (optional)             | `Stop[]`  |
| GET    | `/api/machines/:machineId/stops`| —                                    | `Stop[]`  |
| POST   | `/api/stops`                   | `CreateStopPayload`                   | `Stop`    |
| PATCH  | `/api/stops/:id/close`         | `{ endTime }`                         | `Stop`    |

### 3.7 Real-time Data (polling fallback)

| Method | Endpoint                              | Response                |
|--------|---------------------------------------|-------------------------|
| GET    | `/api/realtime/lines/:lineId`         | `RealtimeLineData`      |
| GET    | `/api/lines/:lineId/dli?date=`        | `DLIDataPoint[]`        |
| GET    | `/api/lines/:lineId/oee-history`      | `OEEHistoryPoint[]`     |
| GET    | `/api/lines/:lineId/stops/pareto`     | `ParetoDataPoint[]`     |

### 3.8 Connectivity

| Method | Endpoint                     | Response             |
|--------|------------------------------|----------------------|
| GET    | `/api/connectivity/status`   | `ConnectivityStatus` |

---

## 4. Real-Time (SignalR Hub)

### Hub URL: `/hubs/production`

### Server → Client Events

| Event                    | Payload                                  | Descrição                          |
|--------------------------|------------------------------------------|------------------------------------|
| `MachineStatusChanged`   | `{ machineId, status, timestamp }`       | Mudança de status de máquina       |
| `ThroughputUpdate`       | `{ machineId, throughput, timestamp }`   | Atualização de vazão               |
| `OEEUpdate`              | `{ lineId, oee: OEEMetrics }`            | Recálculo de OEE da linha          |
| `StopStarted`            | `Stop`                                   | Nova parada registrada             |
| `StopEnded`              | `Stop`                                   | Parada encerrada                   |
| `GatewayStatusChanged`   | `{ connected, latency, lastSeen }`       | Status do gateway ESP32            |
| `CameraStatusChanged`    | `{ connected, fps, lastFrame }`          | Status da câmera                   |

### Client → Server Methods

| Method                    | Params           | Descrição                         |
|---------------------------|------------------|-----------------------------------|
| `JoinLineGroup`           | `lineId: string` | Inscrever-se nas atualizações     |
| `LeaveLineGroup`          | `lineId: string` | Sair do grupo                     |

### Implementação Sugerida (.NET)

```csharp
public class ProductionHub : Hub
{
    public async Task JoinLineGroup(string lineId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"line-{lineId}");
    }

    public async Task LeaveLineGroup(string lineId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"line-{lineId}");
    }
}

// Publicar evento (de qualquer service/controller):
await _hubContext.Clients.Group($"line-{lineId}")
    .SendAsync("ThroughputUpdate", new { machineId, throughput, timestamp });
```

### Frontend (usar com @microsoft/signalr)

```typescript
import * as signalR from '@microsoft/signalr';

const connection = new signalR.HubConnectionBuilder()
  .withUrl(`${API_BASE_URL}/hubs/production`, {
    accessTokenFactory: () => getToken(),
  })
  .withAutomaticReconnect()
  .build();

connection.on('ThroughputUpdate', (data) => {
  // atualizar estado local
});

await connection.start();
await connection.invoke('JoinLineGroup', selectedLineId);
```

---

## 5. Autenticação & Autorização

### JWT Bearer Token

- Login retorna `token` (15 min TTL) + `refreshToken` (7 dias)
- Todas as rotas (exceto `/api/auth/login` e `/api/auth/register`) requerem `Authorization: Bearer <token>`
- SignalR: token via query string `?access_token=<token>`

### Roles & Permissões

| Funcionalidade               | Operação | Liderança | Admin |
|------------------------------|----------|-----------|-------|
| Visualizar Linha ao Vivo     | ✅        | ✅         | ✅     |
| Registrar/Encerrar Paradas   | ✅        | ✅         | ✅     |
| Dashboard consolidado        | ❌        | ✅         | ✅     |
| Configurações (CRUD)         | ❌        | ❌         | ✅     |
| Gestão de Usuários           | ❌        | ❌         | ✅     |

### Implementação

```csharp
[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/sites")]
public class SitesController : ControllerBase { ... }

[Authorize(Roles = "Admin,Lideranca")]
[ApiController]
[Route("api/lines/{lineId}/stops/pareto")]
public class ParetoController : ControllerBase { ... }
```

---

## 6. IoT Integration (ESP32 → Backend)

### Fluxo de Dados

```
ESP32-CAM S3
    │
    ├── MQTT Broker (ou HTTP POST direto)
    │       │
    │       ▼
    │   Gateway Service (.NET Background Service)
    │       │
    │       ├── Persiste telemetria (time-series ou tabela)
    │       ├── Calcula OEE em tempo real
    │       └── Publica via SignalR Hub
    │
    └── Camera Stream
            │
            └── Processamento de imagem (opcional)
                └── Detecção de status (via ML/CV)
```

### Endpoints para o ESP32

| Method | Endpoint                        | Body                                     |
|--------|---------------------------------|------------------------------------------|
| POST   | `/api/gateway/telemetry`        | `{ equipmentId, status, throughput, ts }` |
| POST   | `/api/gateway/heartbeat`        | `{ gatewayId, latency }`                 |
| POST   | `/api/gateway/camera/frame`     | multipart (frame JPEG)                   |

---

## 7. Database Schema (SQL)

```sql
-- Sites
CREATE TABLE Sites (
    Id          UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name        NVARCHAR(200) NOT NULL,
    Location    NVARCHAR(300),
    CreatedAt   DATETIME2 DEFAULT GETUTCDATE()
);

-- Production Lines
CREATE TABLE ProductionLines (
    Id            UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name          NVARCHAR(200) NOT NULL,
    Type          NVARCHAR(100),
    SiteId        UNIQUEIDENTIFIER NOT NULL REFERENCES Sites(Id) ON DELETE CASCADE,
    NominalSpeed  INT NOT NULL DEFAULT 0,
    CreatedAt     DATETIME2 DEFAULT GETUTCDATE()
);

-- Equipment
CREATE TABLE Equipments (
    Id            UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name          NVARCHAR(200) NOT NULL,
    Type          NVARCHAR(100),
    LineId        UNIQUEIDENTIFIER NOT NULL REFERENCES ProductionLines(Id) ON DELETE CASCADE,
    Position      INT NOT NULL,
    NominalSpeed  INT NOT NULL DEFAULT 0,
    CreatedAt     DATETIME2 DEFAULT GETUTCDATE()
);

-- Production Flows (Products)
CREATE TABLE ProductionFlows (
    Id            UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name          NVARCHAR(200) NOT NULL,
    SKU           NVARCHAR(50) NOT NULL,
    LineId        UNIQUEIDENTIFIER NOT NULL REFERENCES ProductionLines(Id) ON DELETE CASCADE,
    NominalSpeed  INT NOT NULL DEFAULT 0,
    CreatedAt     DATETIME2 DEFAULT GETUTCDATE()
);

-- Flow ↔ Equipment (many-to-many, raramente muda)
CREATE TABLE FlowEquipments (
    FlowId        UNIQUEIDENTIFIER NOT NULL REFERENCES ProductionFlows(Id) ON DELETE CASCADE,
    EquipmentId   UNIQUEIDENTIFIER NOT NULL REFERENCES Equipments(Id),
    PRIMARY KEY (FlowId, EquipmentId)
);

-- Stops
CREATE TABLE Stops (
    Id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    EquipmentId     UNIQUEIDENTIFIER NOT NULL REFERENCES Equipments(Id),
    MachineName     NVARCHAR(200),
    LineId          UNIQUEIDENTIFIER NOT NULL REFERENCES ProductionLines(Id),
    Category        INT NOT NULL,  -- enum StopCategory
    StartTime       DATETIME2 NOT NULL,
    EndTime         DATETIME2 NULL,
    DurationMinutes INT NULL,
    Notes           NVARCHAR(1000),
    RegisteredBy    NVARCHAR(200),
    CreatedAt       DATETIME2 DEFAULT GETUTCDATE()
);

-- Users (ou usar ASP.NET Identity)
CREATE TABLE AppUsers (
    Id          UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name        NVARCHAR(200) NOT NULL,
    Email       NVARCHAR(300) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(500) NOT NULL,
    Role        INT NOT NULL, -- enum UserRole
    CreatedAt   DATETIME2 DEFAULT GETUTCDATE()
);

-- Telemetry (time-series, considerar TimescaleDB ou tabela particionada)
CREATE TABLE MachineTelemetry (
    Id            BIGINT IDENTITY PRIMARY KEY,
    EquipmentId   UNIQUEIDENTIFIER NOT NULL REFERENCES Equipments(Id),
    Status        INT NOT NULL,
    Throughput    INT NOT NULL,
    Availability  DECIMAL(5,2),
    Performance   DECIMAL(5,2),
    Quality       DECIMAL(5,2),
    OEE           DECIMAL(5,2),
    Timestamp     DATETIME2 NOT NULL,
    INDEX IX_Telemetry_Equipment_Time (EquipmentId, Timestamp DESC)
);
```

---

## 8. Projeto .NET — Estrutura Sugerida

```
FlowVision.API/
├── Controllers/
│   ├── AuthController.cs
│   ├── SitesController.cs
│   ├── LinesController.cs
│   ├── EquipmentsController.cs
│   ├── FlowsController.cs
│   ├── StopsController.cs
│   ├── RealtimeController.cs
│   └── GatewayController.cs        ← recebe dados do ESP32
├── Hubs/
│   └── ProductionHub.cs             ← SignalR hub
├── Services/
│   ├── OEECalculator.cs             ← cálculo de OEE em tempo real
│   ├── TelemetryProcessor.cs        ← processa dados do ESP32
│   └── AuthService.cs
├── Models/
│   ├── Site.cs
│   ├── ProductionLine.cs
│   ├── Equipment.cs
│   ├── ProductionFlow.cs
│   ├── Stop.cs
│   ├── MachineTelemetry.cs
│   └── AppUser.cs
├── Data/
│   ├── AppDbContext.cs
│   └── Migrations/
├── DTOs/
│   ├── CreateSiteDto.cs
│   ├── LoginDto.cs
│   └── ...
├── Background/
│   └── MqttListenerService.cs       ← Background Service para MQTT
├── Program.cs
└── appsettings.json
```

---

## 9. Variáveis de Ambiente (Frontend)

Para conectar o frontend ao backend .NET, configurar no `.env`:

```env
VITE_API_BASE_URL=https://api.flowvision.com.br
```

O service layer (`src/services/api.ts`) detecta automaticamente:
- Sem `VITE_API_BASE_URL` → usa dados mock
- Com `VITE_API_BASE_URL` → faz chamadas HTTP reais

---

## 10. Checklist de Implementação

### Backend (.NET)
- [ ] Criar projeto ASP.NET Web API (.NET 8)
- [ ] Configurar Entity Framework Core + migrations
- [ ] Implementar controllers CRUD (Sites, Lines, Equipment, Flows, Stops)
- [ ] Configurar JWT Authentication
- [ ] Implementar Role-based Authorization
- [ ] Configurar SignalR Hub (`/hubs/production`)
- [ ] Criar Background Service para receber telemetria ESP32 (MQTT ou HTTP)
- [ ] Implementar OEECalculator service
- [ ] Configurar CORS para o frontend
- [ ] Adicionar Health Checks
- [ ] Configurar Swagger/OpenAPI

### Frontend (já implementado no protótipo)
- [ ] Substituir mock por `VITE_API_BASE_URL`
- [ ] Integrar `@microsoft/signalr` para real-time
- [ ] Implementar React Query hooks consumindo `src/services/api.ts`
- [ ] Adicionar interceptor de token JWT no `apiFetch`
- [ ] Implementar refresh token automático
- [ ] Proteger rotas por role (react-router guards)

### IoT / ESP32
- [ ] Configurar ESP32 para enviar telemetria via HTTP POST ou MQTT
- [ ] Definir frequência de envio (sugerido: 1-5 segundos)
- [ ] Implementar heartbeat do gateway
- [ ] Configurar stream de câmera (se aplicável)

---

## 11. Regras de Negócio

### Cálculo de OEE

```
OEE = (Availability × Performance × Quality) / 10000

Availability = (Tempo Operando / Tempo Planejado) × 100
Performance  = (Throughput Real / Throughput Nominal) × 100  
Quality      = (Peças Boas / Total Produzido) × 100
```

### Classificação OEE

| Faixa       | Classificação |
|-------------|---------------|
| ≥ 85%       | Excelente     |
| 70% – 84%   | Bom           |
| 50% – 69%   | Atenção       |
| < 50%       | Crítico       |

### Paradas

- Parada **ativa** = `EndTime IS NULL`
- Ao encerrar, calcular `DurationMinutes = DATEDIFF(MINUTE, StartTime, EndTime)`
- Uma máquina pode ter **múltiplas paradas ativas** (ex: falha elétrica + falta de material)
- Pareto = agrupamento por categoria, soma de minutos, ordenado DESC

### Fluxo/Produto

- Quando um fluxo é selecionado como "ativo" na linha, a velocidade nominal da linha
  passa a ser a do fluxo (produto), não a velocidade base da linha
- A lista de equipamentos do fluxo raramente muda — por default herda todos da linha

---

*Documento gerado em 2026-03-07. Manter atualizado conforme o backend evolui.*
