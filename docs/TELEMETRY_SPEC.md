# FlowVision — Especificação de Telemetria IoT

> Detalha o pipeline de ingestão de dados de sensores (ESP32/ESP32-CAM),
> protocolos, payloads, frequências e processamento no backend.

---

## 1. Dispositivos IoT

| Dispositivo      | Modelo        | Função Principal                     | Protocolo    | Frequência       |
|------------------|---------------|--------------------------------------|--------------|------------------|
| Gateway          | ESP32         | Agrega sensores, envia telemetria    | HTTP/MQTT    | 1-5s             |
| Câmera           | ESP32-CAM S3  | Captura visual, contagem, detecção   | HTTP         | 1 frame/s        |
| Sensor acúmulo   | ESP32 + foto  | Detecta nível de acúmulo transporte  | MQTT         | 2-5s             |

---

## 2. Payloads Detalhados

### 2.1 Telemetria de Máquina (Gateway → Backend)

**Endpoint**: `POST /api/gateway/telemetry`
**Auth**: `X-API-Key: <gateway-api-key>`
**Content-Type**: `application/json`

```typescript
interface TelemetryPayload {
  deviceId: string;              // "gw-esp32-sp-l1-001"
  timestamp: string;             // ISO 8601 UTC
  equipmentId?: string;          // UUID do Equipment (se conhecido)
  measurements: {
    status: number;              // MachineStatus enum (0=Running, 1=Fault, etc.)
    throughput: number;          // unidades/hora instantâneo
    counters: {
      totalProduced: number;     // contador acumulado total
      goodParts: number;         // peças boas acumuladas
      rejectedParts: number;     // peças rejeitadas acumuladas
    };
    sensors?: {
      temperature?: number;      // °C
      vibration?: number;        // mm/s RMS
      current?: number;          // Amperes
      pressure?: number;         // bar
      humidity?: number;         // %
    };
  };
  meta: {
    firmwareVersion: string;     // "2.4.1"
    uptime: number;              // segundos desde boot
    freeHeap: number;            // bytes livres
    wifiRssi: number;            // dBm (sinal WiFi)
    batteryVoltage?: number;     // V (se aplicável)
  };
}
```

### 2.2 Batch de Telemetria

**Endpoint**: `POST /api/gateway/telemetry/batch`

```typescript
type TelemetryBatchPayload = TelemetryPayload[];
// Máximo: 100 registros por batch
// Use caso: ESP32 com buffer offline → envia batch ao reconectar
```

### 2.3 Heartbeat do Gateway

**Endpoint**: `POST /api/gateway/heartbeat`
**Frequência**: a cada 10 segundos

```typescript
interface HeartbeatPayload {
  deviceId: string;              // "gw-esp32-sp-l1-001"
  deviceType: 'gateway' | 'camera';
  timestamp: string;
  latencyMs: number;             // tempo de round-trip medido
  memoryUsagePercent: number;    // uso de RAM
  firmwareVersion: string;
  connectedSensors?: number;     // qtd de sensores conectados
  uptime: number;                // segundos
  wifiRssi?: number;
  cpuFreqMhz?: number;
}
```

### 2.4 Status da Câmera

**Endpoint**: `POST /api/gateway/heartbeat` (com `deviceType: 'camera'`)

```typescript
interface CameraHeartbeat {
  deviceId: string;              // "cam-esp32s3-sp-l1-001"
  deviceType: 'camera';
  timestamp: string;
  connected: boolean;
  fps: number;
  resolution: string;            // "640x480", "1280x720"
  latencyMs: number;
  bufferUsagePercent: number;
  modelLoaded?: boolean;         // se tem modelo ML carregado
  inferenceTimeMs?: number;      // tempo de inferência ML
}
```

### 2.5 Frame da Câmera (opcional)

**Endpoint**: `POST /api/gateway/camera/frame`
**Content-Type**: `multipart/form-data`

```
Fields:
  - frame: binary (JPEG, max 200KB)
  - deviceId: string
  - timestamp: string
  - metadata: JSON { fps, resolution, detectedStatus?, partCount? }
```

### 2.6 Dados de Transporte

**Endpoint**: `POST /api/gateway/transport`

```typescript
interface TransportPayload {
  deviceId: string;              // "sen-photo-sp-l1-t01"
  transportId?: string;          // UUID do Transport (se conhecido)
  timestamp: string;
  accumulationPercent: number;   // 0-100
  currentUnits: number;
  sensorType: string;            // "photoelectric", "ultrasonic", "weight"
}
```

### 2.7 Reporte de Erro do Dispositivo

**Endpoint**: `POST /api/gateway/error`

```typescript
interface DeviceErrorPayload {
  deviceId: string;
  timestamp: string;
  code: string;                  // "CAM_TIMEOUT", "GW_CRC_FAIL", "SENSOR_OFFLINE"
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}
```

---

## 3. MQTT Topics (Alternativa ao HTTP)

```
flowvision/{siteId}/{lineId}/telemetry/{equipmentDeviceId}
  → TelemetryPayload (JSON)

flowvision/{siteId}/{lineId}/transport/{sensorDeviceId}
  → TransportPayload (JSON)

flowvision/{siteId}/gateway/{gatewayDeviceId}/heartbeat
  → HeartbeatPayload (JSON)

flowvision/{siteId}/camera/{cameraDeviceId}/status
  → CameraHeartbeat (JSON)

flowvision/{siteId}/camera/{cameraDeviceId}/frame
  → binary (JPEG)

flowvision/{siteId}/errors
  → DeviceErrorPayload (JSON)

flowvision/{siteId}/commands/{deviceId}
  → CommandPayload (JSON) — backend → ESP32 (OTA, restart, config)
```

### QoS Recommendations

| Topic Pattern     | QoS | Reason                              |
|-------------------|-----|-------------------------------------|
| `telemetry/*`     | 0   | Alta frequência, perda tolerável    |
| `heartbeat`       | 1   | Importante para detecção de falha   |
| `errors`          | 1   | Deve ser entregue                   |
| `commands/*`      | 2   | Garantir entrega exata              |
| `frame`           | 0   | Dados grandes, perda tolerável      |

---

## 4. Pipeline de Processamento no Backend

### 4.1 TelemetryProcessor (Service)

```csharp
public class TelemetryProcessor : ITelemetryProcessor
{
    // Injetados via DI:
    // AppDbContext, IHubContext<ProductionHub>, IOEECalculator, IAlertEngine

    public async Task ProcessAsync(TelemetryPayload payload)
    {
        // 1. RESOLVE EQUIPMENT
        var equipment = await _db.Equipments
            .Include(e => e.Line)
            .FirstOrDefaultAsync(e => e.GatewayDeviceId == payload.DeviceId);
        if (equipment == null) { LogUnknownDevice(payload); return; }

        // 2. MAP STATUS
        var newStatus = (MachineStatus)payload.Measurements.Status;
        var previousStatus = await GetLastStatus(equipment.Id);

        // 3. PERSIST TELEMETRY
        var telemetry = new MachineTelemetry
        {
            EquipmentId = equipment.Id,
            Status = newStatus,
            Throughput = payload.Measurements.Throughput,
            RawPayload = JsonSerializer.Serialize(payload),
            Timestamp = payload.Timestamp
        };

        // 4. CALCULATE OEE
        var activeFlow = await _db.ProductionFlows
            .FindAsync(equipment.Line.ActiveFlowId);
        var nominalSpeed = activeFlow?.NominalSpeed ?? equipment.Line.NominalSpeed;

        var oee = _oeeCalculator.Calculate(
            equipment.Id,
            payload.Measurements,
            nominalSpeed
        );
        telemetry.Availability = oee.Availability;
        telemetry.Performance = oee.Performance;
        telemetry.Quality = oee.Quality;
        telemetry.OEE = oee.OEE;

        _db.MachineTelemetry.Add(telemetry);

        // 5. AUTO-DETECT STOP
        if (previousStatus == MachineStatus.Running && newStatus != MachineStatus.Running)
        {
            var stop = new Stop
            {
                EquipmentId = equipment.Id,
                MachineName = equipment.Name,
                LineId = equipment.LineId,
                Category = MapStatusToStopCategory(newStatus),
                StartTime = payload.Timestamp,
                IsAutoDetected = true,
                ShiftId = await _shiftManager.GetCurrentShiftId(equipment.Line.SiteId),
                ProductionOrderId = await GetActiveOrderId(equipment.LineId)
            };
            _db.Stops.Add(stop);
            await _hub.Clients.Group($"line-{equipment.LineId}")
                .SendAsync("StopStarted", stop);
        }
        else if (previousStatus != MachineStatus.Running && newStatus == MachineStatus.Running)
        {
            var activeStop = await _db.Stops
                .Where(s => s.EquipmentId == equipment.Id && s.EndTime == null && s.IsAutoDetected)
                .FirstOrDefaultAsync();
            if (activeStop != null)
            {
                activeStop.EndTime = payload.Timestamp;
                activeStop.DurationMinutes = (int)(payload.Timestamp - activeStop.StartTime).TotalMinutes;
                await _hub.Clients.Group($"line-{equipment.LineId}")
                    .SendAsync("StopEnded", activeStop);
            }
        }

        await _db.SaveChangesAsync();

        // 6. PUBLISH SIGNALR
        var lineGroup = $"line-{equipment.LineId}";
        await _hub.Clients.Group(lineGroup)
            .SendAsync("ThroughputUpdate", new {
                equipmentId = equipment.Id,
                throughput = payload.Measurements.Throughput,
                timestamp = payload.Timestamp
            });

        if (previousStatus != newStatus)
        {
            await _hub.Clients.Group(lineGroup)
                .SendAsync("MachineStatusChanged", new {
                    equipmentId = equipment.Id,
                    status = newStatus.ToString().ToLower(),
                    timestamp = payload.Timestamp
                });
        }

        // 7. RECALCULATE LINE OEE (aggregate of all machines)
        var lineOee = await _oeeCalculator.CalculateLineOEE(equipment.LineId);
        await _hub.Clients.Group(lineGroup)
            .SendAsync("OEEUpdate", new {
                lineId = equipment.LineId,
                oee = lineOee
            });

        // 8. CHECK ALERTS
        await _alertEngine.EvaluateAsync(equipment, payload);
    }

    private static StopCategory MapStatusToStopCategory(MachineStatus status) => status switch
    {
        MachineStatus.Fault => StopCategory.Maintenance,
        MachineStatus.Setup => StopCategory.Setup,
        MachineStatus.Shortage => StopCategory.MaterialShortage,
        MachineStatus.Scheduled => StopCategory.Planned,
        _ => StopCategory.Other
    };
}
```

### 4.2 HeartbeatMonitor (Background Service)

```csharp
public class HeartbeatMonitorService : BackgroundService
{
    // Roda a cada 10 segundos
    // Verifica último heartbeat de cada dispositivo
    // Se > HeartbeatTimeoutSeconds → marca como Disconnected
    // Gera DeviceLog + ErrorSignal + SignalR notification

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            var timeout = TimeSpan.FromSeconds(_config.HeartbeatTimeoutSeconds);
            var cutoff = DateTime.UtcNow - timeout;

            var staleDevices = await _db.DeviceLogs
                .FromSqlRaw(@"
                    SELECT DISTINCT ON (device_id) *
                    FROM device_logs
                    WHERE event_type IN ('connected','heartbeat_ok','reconnected')
                    ORDER BY device_id, timestamp DESC")
                .Where(d => d.Timestamp < cutoff)
                .ToListAsync(ct);

            foreach (var device in staleDevices)
            {
                // Log disconnect
                _db.DeviceLogs.Add(new DeviceLog {
                    DeviceId = device.DeviceId,
                    DeviceType = device.DeviceType,
                    EventType = ConnectivityEventType.Disconnected,
                    Detail = $"No heartbeat for {timeout.TotalSeconds}s",
                    Timestamp = DateTime.UtcNow
                });

                // Notify via SignalR
                var eventName = device.DeviceType == DeviceType.Gateway
                    ? "GatewayStatusChanged"
                    : "CameraStatusChanged";
                await _hub.Clients.All.SendAsync(eventName, new {
                    deviceId = device.DeviceId,
                    connected = false,
                    lastSeen = device.Timestamp
                });
            }

            await _db.SaveChangesAsync(ct);
            await Task.Delay(10_000, ct);
        }
    }
}
```

### 4.3 OEEAggregator (Background Service)

```csharp
// Roda a cada 60 segundos
// Agrega OEE por linha e por turno
// Persiste snapshot para histórico (OEE por hora, DLI)
// Alimenta os endpoints /dli e /oee-history
```

---

## 5. Configuração do ESP32 (Firmware)

### 5.1 Variáveis de Configuração no ESP32

```c
// config.h
#define DEVICE_ID           "gw-esp32-sp-l1-001"
#define API_BASE_URL        "http://192.168.1.100:5000"
#define API_KEY             "your-gateway-api-key"
#define MQTT_HOST           "192.168.1.100"
#define MQTT_PORT           1883
#define MQTT_USER           "flowvision"
#define MQTT_PASS           "mqtt-password"
#define SITE_ID             "site-1"
#define LINE_ID             "line-1"
#define TELEMETRY_INTERVAL  2000    // ms
#define HEARTBEAT_INTERVAL  10000   // ms
#define BATCH_SIZE          10      // buffer antes de enviar
#define WIFI_SSID           "Factory-WiFi"
#define WIFI_PASS           "wifi-password"
```

### 5.2 Mapeamento de Pinos (ESP32 Gateway)

```c
// pins.h - Exemplo para linha com 5 máquinas
#define SENSOR_M1_STATUS    GPIO_NUM_32   // Sinal digital: 1=Running, 0=Stopped
#define SENSOR_M1_COUNTER   GPIO_NUM_33   // Pulso por peça produzida
#define SENSOR_M2_STATUS    GPIO_NUM_25
#define SENSOR_M2_COUNTER   GPIO_NUM_26
#define SENSOR_M3_STATUS    GPIO_NUM_27
#define SENSOR_M3_COUNTER   GPIO_NUM_14
#define SENSOR_M4_STATUS    GPIO_NUM_12
#define SENSOR_M4_COUNTER   GPIO_NUM_13
#define SENSOR_M5_STATUS    GPIO_NUM_15
#define SENSOR_M5_COUNTER   GPIO_NUM_2

// Transporte (sensores fotoelétricos)
#define SENSOR_T1_ACCUM     GPIO_NUM_34   // ADC: nível analógico 0-4095
#define SENSOR_T2_ACCUM     GPIO_NUM_35
#define SENSOR_T3_ACCUM     GPIO_NUM_36
#define SENSOR_T4_ACCUM     GPIO_NUM_39

// Status LED
#define LED_STATUS           GPIO_NUM_4
```

---

## 6. Retenção de Dados

| Tabela                 | Retenção  | Estratégia                                  |
|------------------------|-----------|---------------------------------------------|
| `machine_telemetry`    | 90 dias   | Particionamento por mês + drop old          |
| `transport_telemetry`  | 90 dias   | Particionamento por mês + drop old          |
| `device_logs`          | 30 dias   | Delete por cron job                         |
| `system_logs`          | 30 dias   | Delete por cron job                         |
| `error_signals`        | 1 ano     | Archive resolved > 6 months                 |
| `stops`                | Permanente| Core business data                          |
| `hourly_productions`   | Permanente| Core business data                          |
| `production_orders`    | Permanente| Core business data                          |

---

*Documento atualizado em 2026-03-09.*
