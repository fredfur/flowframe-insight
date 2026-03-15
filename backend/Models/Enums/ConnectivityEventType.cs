namespace FlowVision.API.Models.Enums;

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
