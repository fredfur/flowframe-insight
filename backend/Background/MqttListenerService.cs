using System.Text;
using System.Text.Json;
using FlowVision.API.DTOs.Gateway;
using FlowVision.API.Services;
using Microsoft.Extensions.Options;

namespace FlowVision.API.Background;

public class MqttListenerService : BackgroundService
{
    private readonly IServiceProvider _sp;
    private readonly IConfiguration _config;
    private readonly ILogger<MqttListenerService> _logger;

    public MqttListenerService(IServiceProvider sp, IConfiguration config, ILogger<MqttListenerService> logger)
    {
        _sp = sp;
        _config = config;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        var host = _config["Mqtt:Host"];
        if (string.IsNullOrEmpty(host)) { _logger.LogInformation("Mqtt:Host not set; MQTT listener disabled"); return; }
        while (!ct.IsCancellationRequested)
        {
            try
            {
                await ConnectAndListen(ct);
            }
            catch (Exception ex) { _logger.LogWarning(ex, "MQTT connection error"); }
            await Task.Delay(5000, ct);
        }
    }

    private async Task ConnectAndListen(CancellationToken ct)
    {
        var factory = new MQTTnet.MqttFactory();
        var client = factory.CreateMqttClient();
        var opts = new MQTTnet.Client.MqttClientOptionsBuilder()
            .WithTcpServer(_config["Mqtt:Host"], int.TryParse(_config["Mqtt:Port"], out var p) ? p : 1883)
            .WithClientId(_config["Mqtt:ClientId"] ?? "flowvision-backend")
            .Build();
        await client.ConnectAsync(opts, ct);
        var baseTopic = _config["Mqtt:BaseTopic"] ?? "flowvision/";
        var subOpts = new MQTTnet.Client.MqttClientSubscribeOptionsBuilder()
            .WithTopicFilter(f => f.WithTopic(baseTopic + "#"))
            .Build();
        await client.SubscribeAsync(subOpts, ct);
        client.ApplicationMessageReceivedAsync += async e =>
        {
            try
            {
                var seg = e.ApplicationMessage.PayloadSegment;
                var payload = seg.Count > 0 ? Encoding.UTF8.GetString(seg.Array!, seg.Offset, seg.Count) : "";
                if (e.ApplicationMessage.Topic.Contains("/telemetry/") && payload.Length > 0)
                {
                    var dto = JsonSerializer.Deserialize<TelemetryPayloadDto>(payload);
                    if (dto != null)
                    {
                        using var scope = _sp.CreateScope();
                        var processor = scope.ServiceProvider.GetRequiredService<ITelemetryProcessor>();
                        await processor.ProcessAsync(dto);
                    }
                }
            }
            catch (Exception ex) { _logger.LogWarning(ex, "MQTT message handling failed"); }
        };
        while (!ct.IsCancellationRequested)
        {
            if (!client.IsConnected) break;
            await Task.Delay(1000, ct);
        }
    }
}
