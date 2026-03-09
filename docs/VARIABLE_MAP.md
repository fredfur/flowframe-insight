# FlowVision — Mapa de Variáveis & Rastreabilidade

> Mapeamento completo: **Frontend (TypeScript)** ↔ **Backend (.NET)** ↔ **Database (PostgreSQL)** ↔ **IoT (ESP32)**
> Garante rastreabilidade ponta a ponta de cada campo.

---

## 1. Legenda

| Símbolo | Significado                    |
|---------|--------------------------------|
| `→`     | Direção do fluxo de dados       |
| `↔`     | Bidirecional (CRUD)            |
| `⚡`    | Real-time (SignalR/MQTT)       |
| `🔑`    | Identificador de rastreio      |
| `📊`    | Métrica calculada              |
| `🛰️`    | Dado de telemetria IoT         |

---

## 2. Cadeia de Identificadores (Traceability Chain)

```
Site.Id → ProductionLine.SiteId
       → ProductionLine.Id → Equipment.LineId
                           → Transport.LineId
                           → ProductionFlow.LineId
                           → ProductionOrder.LineId
                           → Shift.LineId (nullable)

Equipment.Id → MachineTelemetry.EquipmentId
             → Stop.EquipmentId
             → FlowEquipment.EquipmentId
             → OperatorAssignment.EquipmentId
             → DeviceLog.EquipmentId (nullable)
             → ErrorSignal.EquipmentId (nullable)

Equipment.GatewayDeviceId → ESP32 telemetry payload deviceId
Equipment.CameraDeviceId  → ESP32-CAM deviceId

Transport.Id → TransportTelemetry.TransportId
Transport.SensorDeviceId → ESP32 sensor payload deviceId

ProductionFlow.Id → ProductionLine.ActiveFlowId (running product)
                  → ProductionOrder.FlowId
                  → FlowEquipment.FlowId

ProductionOrder.Id → HourlyProduction.OrderId
                   → Stop.ProductionOrderId

Shift.Id → ShiftOperator.ShiftId
         → Stop.ShiftId

AppUser.Id → ShiftOperator.UserId
           → OperatorAssignment.UserId
           → Stop.RegisteredBy
           → ProductionOrder.CreatedBy
           → ErrorSignal.ResolvedBy
```

---

## 3. Mapeamento Campo a Campo

### 3.1 Equipment (Máquina)

| Frontend (TS)            | Backend (.NET)              | Database (PG)           | ESP32 Payload               | Direção |
|--------------------------|-----------------------------|-------------------------|-----------------------------|---------|
| `Machine.id`             | `Equipment.Id`              | `equipments.id`         | —                           | ↔       |
| `Machine.name`           | `Equipment.Name`            | `equipments.name`       | —                           | ↔       |
| `Machine.type`           | `Equipment.Type`            | `equipments.type`       | —                           | ↔       |
| `Machine.lineId`         | `Equipment.LineId`          | `equipments.line_id`    | —                           | ↔       |
| `Machine.position`       | `Equipment.Position`        | `equipments.position`   | —                           | ↔       |
| `Machine.x`              | `Equipment.X`               | `equipments.x`          | —                           | ↔       |
| `Machine.y`              | `Equipment.Y`               | `equipments.y`          | —                           | ↔       |
| `Machine.nominalSpeed`   | `Equipment.NominalSpeed`    | `equipments.nominal_speed`| —                         | ↔       |
| `Machine.status`         | `MachineTelemetry.Status`   | `machine_telemetry.status`| `measurements.status`     | 🛰️→📊  |
| `Machine.throughput`     | `MachineTelemetry.Throughput`| `machine_telemetry.throughput`| `measurements.throughput`| 🛰️→📊  |
| `Machine.oee.availability`| `MachineTelemetry.Availability`| `machine_telemetry.availability`| 📊 (calculated)  | 📊→     |
| `Machine.oee.performance`| `MachineTelemetry.Performance`| `machine_telemetry.performance`| 📊 (calculated)   | 📊→     |
| `Machine.oee.quality`    | `MachineTelemetry.Quality`  | `machine_telemetry.quality`| 📊 (calculated)          | 📊→     |
| `Machine.oee.oee`        | `MachineTelemetry.OEE`      | `machine_telemetry.oee` | 📊 (calculated)            | 📊→     |
| —                        | `Equipment.GatewayDeviceId` | `equipments.gateway_device_id`| `deviceId`          | 🔑      |
| —                        | `Equipment.CameraDeviceId`  | `equipments.camera_device_id`| `deviceId` (cam)     | 🔑      |

### 3.2 Transport (Transporte)

| Frontend (TS)                    | Backend (.NET)                     | Database (PG)                      | ESP32 Payload               | Direção |
|----------------------------------|------------------------------------|------------------------------------|-----------------------------|---------|
| `Transport.id`                   | `Transport.Id`                     | `transports.id`                    | —                           | ↔       |
| `Transport.lineId`               | `Transport.LineId`                 | `transports.line_id`               | —                           | ↔       |
| `Transport.fromPosition`         | `Transport.FromPosition`           | `transports.from_position`         | —                           | ↔       |
| `Transport.toPosition`           | `Transport.ToPosition`             | `transports.to_position`           | —                           | ↔       |
| `Transport.type`                 | `Transport.Type`                   | `transports.type`                  | —                           | ↔       |
| `Transport.capacity`             | `Transport.Capacity`               | `transports.capacity`              | —                           | ↔       |
| `Transport.accumulation`         | `TransportTelemetry.AccumulationLevel`| `transport_telemetry.accumulation_level`| 📊 (derived)        | 🛰️→📊  |
| `Transport.accumulationPercent`  | `TransportTelemetry.AccumulationPercent`| `transport_telemetry.accumulation_percent`| `accumulationPercent`| 🛰️→  |
| `Transport.currentUnits`         | `TransportTelemetry.CurrentUnits`  | `transport_telemetry.current_units`| `currentUnits`              | 🛰️→    |
| —                                | `Transport.SensorDeviceId`         | `transports.sensor_device_id`      | `deviceId`                  | 🔑      |

### 3.3 Stop (Parada)

| Frontend (TS)           | Backend (.NET)              | Database (PG)              | ESP32 Payload         | Direção |
|-------------------------|-----------------------------|----------------------------|-----------------------|---------|
| `Stop.id`               | `Stop.Id`                   | `stops.id`                 | —                     | ↔       |
| `Stop.machineId`        | `Stop.EquipmentId`          | `stops.equipment_id`       | —                     | ↔       |
| `Stop.machineName`      | `Stop.MachineName`          | `stops.machine_name`       | —                     | ↔       |
| `Stop.lineId`           | `Stop.LineId`               | `stops.line_id`            | —                     | ↔       |
| `Stop.category`         | `Stop.Category`             | `stops.category`           | 📊 (auto-mapped)     | ↔       |
| `Stop.startTime`        | `Stop.StartTime`            | `stops.start_time`         | `timestamp` (status Δ)| 🛰️→   |
| `Stop.endTime`          | `Stop.EndTime`              | `stops.end_time`           | `timestamp` (resume)  | 🛰️→   |
| `Stop.duration`         | `Stop.DurationMinutes`      | `stops.duration_minutes`   | 📊 (calculated)       | 📊→    |
| `Stop.notes`            | `Stop.Notes`                | `stops.notes`              | —                     | ↔       |
| `Stop.registeredBy`     | `Stop.RegisteredBy`         | `stops.registered_by`      | —                     | ↔       |
| —                       | `Stop.ProductionOrderId`    | `stops.production_order_id`| —                     | ↔       |
| —                       | `Stop.ShiftId`              | `stops.shift_id`           | —                     | ↔       |
| —                       | `Stop.IsAutoDetected`       | `stops.is_auto_detected`   | ⚡ (auto)             | 🛰️→   |

### 3.4 MachineStatus Enum Mapping

| Frontend (TS)    | Backend (.NET)           | Database (PG)     | ESP32 (int) | Cor CSS Token           |
|------------------|--------------------------|-------------------|-------------|-------------------------|
| `'running'`      | `MachineStatus.Running`  | `'running'`       | `0`         | `--status-running`      |
| `'fault'`        | `MachineStatus.Fault`    | `'fault'`         | `1`         | `--status-fault`        |
| `'shortage'`     | `MachineStatus.Shortage` | `'shortage'`      | `2`         | `--status-shortage`     |
| `'accumulation'` | `MachineStatus.Accumulation`| `'accumulation'`| `3`         | `--status-accumulation` |
| `'scheduled'`    | `MachineStatus.Scheduled`| `'scheduled'`     | `4`         | `--status-scheduled`    |
| `'setup'`        | `MachineStatus.Setup`    | `'setup'`         | `5`         | `--status-setup`        |
| `'disconnected'` | `MachineStatus.Disconnected`| `'disconnected'`| `6`         | `--status-disconnected` |

### 3.5 StopCategory Enum Mapping

| Frontend (TS)           | Backend (.NET)                    | Database (PG)         | Auto-detect from Status |
|-------------------------|-----------------------------------|-----------------------|-------------------------|
| `'maintenance'`         | `StopCategory.Maintenance`        | `'maintenance'`       | `Fault`                 |
| `'setup'`               | `StopCategory.Setup`              | `'setup'`             | `Setup`                 |
| `'material_shortage'`   | `StopCategory.MaterialShortage`   | `'material_shortage'` | `Shortage`              |
| `'quality_issue'`       | `StopCategory.QualityIssue`       | `'quality_issue'`     | — (manual only)         |
| `'operator_absence'`    | `StopCategory.OperatorAbsence`    | `'operator_absence'`  | — (manual only)         |
| `'planned'`             | `StopCategory.Planned`            | `'planned'`           | `Scheduled`             |
| `'other'`               | `StopCategory.Other`              | `'other'`             | `Disconnected`          |

### 3.6 AccumulationLevel Mapping

| Frontend (TS)    | Backend (.NET)               | Database (PG)   | Derivação                    |
|------------------|------------------------------|-----------------|------------------------------|
| `'empty'`        | `AccumulationLevel.Empty`    | `'empty'`       | `accPercent == 0`            |
| `'low'`          | `AccumulationLevel.Low`      | `'low'`         | `accPercent > 0 && <= 25`    |
| `'normal'`       | `AccumulationLevel.Normal`   | `'normal'`      | `accPercent > 25 && <= 60`   |
| `'high'`         | `AccumulationLevel.High`     | `'high'`        | `accPercent > 60 && <= 85`   |
| `'critical'`     | `AccumulationLevel.Critical` | `'critical'`    | `accPercent > 85`            |

### 3.7 ConnectivityEvent Mapping (Debug Page)

| Frontend (TS)           | Backend (.NET)                          | Database (PG)              | ESP32 Origin          |
|-------------------------|-----------------------------------------|----------------------------|-----------------------|
| `'connected'`           | `ConnectivityEventType.Connected`       | `'connected'`              | heartbeat OK          |
| `'disconnected'`        | `ConnectivityEventType.Disconnected`    | `'disconnected'`           | heartbeat timeout     |
| `'timeout'`             | `ConnectivityEventType.Timeout`         | `'timeout'`                | no response > 15s     |
| `'reconnected'`         | `ConnectivityEventType.Reconnected`     | `'reconnected'`            | heartbeat after gap   |
| `'latency_spike'`       | `ConnectivityEventType.LatencySpike`    | `'latency_spike'`          | latency > 100ms       |

### 3.8 SignalR Event → Frontend Handler Mapping

| SignalR Event            | Frontend Handler                        | State Update                     | UI Component          |
|--------------------------|-----------------------------------------|----------------------------------|-----------------------|
| `MachineStatusChanged`   | `onMachineStatusChanged(data)`          | Update Machine.status            | FlowNode, MachineNode |
| `ThroughputUpdate`       | `onThroughputUpdate(data)`              | Update Machine.throughput        | MachineNode, Gauge    |
| `OEEUpdate`              | `onOEEUpdate(data)`                     | Update Line.oee                  | OEEGauge, Dashboard   |
| `TransportUpdate`        | `onTransportUpdate(data)`               | Update Transport.accumulation    | FlowConnector         |
| `StopStarted`            | `onStopStarted(stop)`                   | Add to stops list                | Stops page, Timeline  |
| `StopEnded`              | `onStopEnded(stop)`                     | Update stop.endTime              | Stops page, Timeline  |
| `GatewayStatusChanged`   | `onGatewayStatus(data)`                 | Update gateway indicator         | ConnectionIndicator   |
| `CameraStatusChanged`    | `onCameraStatus(data)`                  | Update camera indicator          | ConnectionIndicator   |
| `OrderStatusChanged`     | `onOrderChanged(order)`                 | Update order in list             | ProductionOrders      |
| `ErrorSignalRaised`      | `onErrorRaised(error)`                  | Add to errors list               | Debug page            |
| `ErrorSignalResolved`    | `onErrorResolved(error)`                | Update error.resolved            | Debug page            |

---

## 4. ESP32 Device ID Convention

```
Device ID Format: {type}-{model}-{siteCode}-{lineCode}-{sequence}

Examples:
  gw-esp32-sp-l1-001      → Gateway ESP32, São Paulo, Linha 1, #001
  cam-esp32s3-sp-l1-001    → Câmera ESP32-CAM S3, SP, Linha 1, #001
  sen-photo-sp-l1-t01      → Sensor fotoelétrico, SP, Linha 1, Transporte 01
```

### Binding no Backend

```
Equipment.GatewayDeviceId = "gw-esp32-sp-l1-001"
Equipment.CameraDeviceId  = "cam-esp32s3-sp-l1-001"
Transport.SensorDeviceId  = "sen-photo-sp-l1-t01"
```

Quando o ESP32 envia telemetria com `deviceId`, o `TelemetryProcessor`:
1. Lookup `Equipment` by `GatewayDeviceId` → encontra o equipamento
2. Obtém `LineId` do equipamento → identifica a linha
3. Obtém `ActiveFlowId` da linha → identifica o produto (para velocidade nominal)
4. Calcula OEE com base no produto ativo
5. Persiste + publica via SignalR para o grupo `line-{lineId}`

---

## 5. Fluxo de Rastreabilidade Completa

```
ESP32 envia:
{
  "deviceId": "gw-esp32-sp-l1-001",     ← 🔑 identifica Equipment
  "measurements": {
    "status": 0,                          ← 🛰️ MachineStatus.Running
    "throughput": 440                     ← 🛰️ u/h
  }
}

Backend resolve:
  Equipment (gateway_device_id = "gw-esp32-sp-l1-001")
    → line_id = "line-1"
    → ProductionLine.active_flow_id = "flow-1"
    → ProductionFlow.nominal_speed = 500
    → Performance = (440 / 500) × 100 = 88%

Backend persiste:
  machine_telemetry {
    equipment_id: <Equipment.Id>,
    status: 'running',
    throughput: 440,
    performance: 88.0,
    ...
    timestamp: now()
  }

Backend publica (SignalR):
  Group "line-line-1" → ThroughputUpdate {
    equipmentId: <Equipment.Id>,
    throughput: 440,
    timestamp: now()
  }

Frontend recebe → atualiza Machine.throughput → re-render MachineNode
```

---

*Documento atualizado em 2026-03-09.*
