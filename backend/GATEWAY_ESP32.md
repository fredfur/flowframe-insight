# Gateway API — Acesso para ESP32

O gateway recebe os sinais do ESP32, interpreta os dados e transforma em telemetria e contadores (throughput, peças produzidas, paradas, OEE).

## URL base

- **Dentro do WSL (terminal/curl):** `http://localhost:5050`
- **Browser no Windows (WSL2):** `http://localhost:5050` **não funciona** — use o IP da WSL, ex.: `http://172.24.79.179:5050`  
  Para ver o IP atual no terminal: `bash scripts/gateway-url.sh` ou `hostname -I | awk '{print $1}'`
- **Rede (ESP32/outros):** use o IP da máquina (ex.: `http://192.168.1.100:5050`)

## Autenticação

Todas as requisições para o gateway **obrigatoriamente** devem incluir o header:

```
X-API-Key: gateway-secret-key
```

(Valor configurável em `appsettings.json` → `Gateway:ApiKey`.)

Sem este header, ou com valor errado, a resposta é **401 Unauthorized**.

## Verificar se o gateway está disponível

```http
GET /api/gateway/status
X-API-Key: gateway-secret-key
```

Resposta **200 OK** indica que o gateway está disponível para ingestão.

## Endpoints para o ESP32

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/gateway/telemetry` | Envia uma amostra de telemetria (status, throughput, contadores). **É aqui que o sinal é interpretado e transformado em contador/telemetria.** |
| POST | `/api/gateway/telemetry/batch` | Envia várias amostras de uma vez (até 100). |
| POST | `/api/gateway/heartbeat` | Heartbeat do dispositivo (latência, memória, firmware). |
| POST | `/api/gateway/transport` | Dados de acúmulo em transportes. |
| POST | `/api/gateway/error` | Reporte de erro do dispositivo. |

### Exemplo de payload de telemetria (contadores)

O backend usa este payload para atualizar contadores e throughput:

```json
{
  "deviceId": "gw-esp32-001",
  "timestamp": "2026-03-14T12:00:00Z",
  "equipmentId": null,
  "measurements": {
    "status": 0,
    "throughput": 440,
    "counters": {
      "totalProduced": 12450,
      "goodParts": 12320,
      "rejectedParts": 130
    }
  },
  "meta": {
    "firmwareVersion": "2.4.1",
    "uptime": 86400
  }
}
```

- `deviceId` deve corresponder ao `ExternalId` de um **Device** (gestão de devices) ou ao `GatewayDeviceId` do equipamento na base; `equipmentId` pode ser o UUID do equipamento.
- **Seed:** o equipamento "Vision OEE" tem Id fixo `bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb`. Use `FLOWFRAME_EQUIPMENT_ID=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb` no gateway Python. O Device com `ExternalId=vision-oee-01` associa saída do Equip 1 e entrada do Vision OEE.
- `measurements.status`: 0=Running, 1=Fault, 2=Shortage, etc.
- `measurements.throughput`: unidades/hora instantâneo.
- `measurements.counters`: contadores acumulados (são persistidos e usados no cálculo de OEE/qualidade).

O backend persiste em `machine_telemetry`, atualiza paradas automáticas e emite eventos em tempo real (SignalR).
