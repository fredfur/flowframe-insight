namespace FlowVision.API.Services;

public interface IShiftManager
{
    Task<Guid?> GetCurrentShiftIdAsync(Guid siteId, Guid? lineId = null);
}
