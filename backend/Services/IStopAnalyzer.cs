using FlowVision.API.DTOs.Realtime;

namespace FlowVision.API.Services;

public interface IStopAnalyzer
{
    Task<List<ParetoDataPointDto>> GetParetoAsync(Guid lineId, DateTime from, DateTime to);
}
