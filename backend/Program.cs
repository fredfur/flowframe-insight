using System.Text;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using FlowVision.API.Data;
using FlowVision.API.Services;
using FlowVision.API.Hubs;
using FlowVision.API.Middleware;
using FlowVision.API.Background;

var builder = WebApplication.CreateBuilder(args);

// DbContext
builder.Services.AddDbContext<AppDbContext>(options =>
{
    var conn = builder.Configuration.GetConnectionString("DefaultConnection")
        ?? "Host=localhost;Database=flowvision;Username=flowvision;Password=flowvision";
    options.UseNpgsql(conn);
});

// JWT
var jwtSecret = builder.Configuration["JwtSettings:Secret"] ?? "FlowVision-SuperSecretKey-Min32Chars!!";
var key = Encoding.UTF8.GetBytes(jwtSecret);
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["JwtSettings:Audience"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                    context.Token = accessToken;
                return Task.CompletedTask;
            }
        };
    });
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("Admin", p => p.RequireRole("Admin"));
    options.AddPolicy("Lideranca", p => p.RequireRole("Admin", "Lideranca"));
    options.AddPolicy("Operacao", p => p.RequireRole("Admin", "Lideranca", "Operacao"));
});

// SignalR
builder.Services.AddSignalR();

// CORS
var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? new[] { "http://localhost:8080", "http://localhost:8081", "http://localhost:5173", "http://127.0.0.1:8080", "http://127.0.0.1:8081", "http://127.0.0.1:5173" };
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(origins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IOEECalculator, OEECalculator>();
builder.Services.AddScoped<ITelemetryProcessor, TelemetryProcessor>();
builder.Services.AddScoped<IShiftManager, ShiftManager>();
builder.Services.AddScoped<IStopAnalyzer, StopAnalyzer>();
builder.Services.AddScoped<IAlertEngine, AlertEngine>();
builder.Services.AddSingleton<IGatewayStateStore, GatewayStateStore>();
builder.Services.AddHostedService<MqttListenerService>();
builder.Services.AddHostedService<HeartbeatMonitorService>();
builder.Services.AddHostedService<OEEAggregatorService>();

// Controllers + JSON
builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        opts.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        opts.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter(System.Text.Json.JsonNamingPolicy.CamelCase));
    });

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "FlowVision API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey
    });
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        { new Microsoft.OpenApi.Models.OpenApiSecurityScheme { Reference = new Microsoft.OpenApi.Models.OpenApiReference { Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme, Id = "Bearer" } }, Array.Empty<string>() }
    });
});

// Health
builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>("db");

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors();
app.UseMiddleware<GatewayApiKeyMiddleware>();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<ProductionHub>("/hubs/production");
app.MapHealthChecks("/health");

// Em WSL2: localhost no browser (Windows) não atinge o servidor — use o IP da WSL
var host = System.Net.Dns.GetHostName();
var ips = System.Net.Dns.GetHostAddresses(host);
var wslIp = ips.FirstOrDefault(a => a.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)?.ToString() ?? "localhost";
app.Logger.LogInformation("Gateway a escutar em http://0.0.0.0:5050 — No browser (Windows) use: http://{WslIp}:5050", wslIp);

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
    await SeedData.IfNeeded(db);
}

app.Run();
