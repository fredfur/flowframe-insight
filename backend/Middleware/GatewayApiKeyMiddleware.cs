namespace FlowVision.API.Middleware;

public class GatewayApiKeyMiddleware
{
    private readonly RequestDelegate _next;
    private const string ApiKeyHeader = "X-API-Key";
    private const string GatewayPathPrefix = "/api/gateway";

    public GatewayApiKeyMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context, IConfiguration config)
    {
        if (!context.Request.Path.StartsWithSegments(GatewayPathPrefix, StringComparison.OrdinalIgnoreCase))
        {
            await _next(context);
            return;
        }
        var apiKey = config["Gateway:ApiKey"] ?? "gateway-secret-key";
        var provided = context.Request.Headers[ApiKeyHeader].FirstOrDefault();
        if (string.IsNullOrEmpty(provided) || provided != apiKey)
        {
            context.Response.StatusCode = 401;
            await context.Response.WriteAsJsonAsync(new { message = "Invalid or missing API Key", code = "UNAUTHORIZED" });
            return;
        }
        await _next(context);
    }
}
