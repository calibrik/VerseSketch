using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using MongoDB.Driver;
using VerseSketch.Backend.Hubs;
using VerseSketch.Backend.Misc;
using VerseSketch.Backend.Models;
using VerseSketch.Backend.Repositories;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddSignalR(options =>
{
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(5);
    options.KeepAliveInterval = TimeSpan.FromSeconds(3);
    options.EnableDetailedErrors = true;
    options.MaximumReceiveMessageSize = 5 * 1024 * 1024;
});
builder.Services.AddScoped<RoomsRepository>();
builder.Services.AddScoped<PlayerRepository>();
builder.Services.AddScoped<InstructionRepository>();
builder.Services.AddScoped<StorylineRepository>();
builder.Services.AddHttpClient<PiperService>();

#if DEBUG
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy =>
        {
            policy.WithOrigins("http://localhost:5173") // React app's origin
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
            policy.WithOrigins("http://10.14.5.10:5173") // Network React app's origin
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials();
        });
});
#endif
builder.Services.Configure<MongoDBSettings>(builder.Configuration.GetSection("MongoDBSettings"));
builder.Services.AddSingleton<IMongoClient>(sp =>
{
    MongoDBSettings settings = sp.GetRequiredService<IOptions<MongoDBSettings>>().Value;
    return new MongoClient(settings.ConnectionString);
});

builder.Services.AddOpenApi();
#if DEBUG
builder.Services.AddSwaggerGen(options =>
{
    OpenApiSecurityScheme jwtSecurityScheme = new OpenApiSecurityScheme()
    {
        BearerFormat = "JWT",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = JwtBearerDefaults.AuthenticationScheme,
        Description = "JWT Authorization header using the Bearer scheme.",
        Reference = new OpenApiReference()
        {
            Id = JwtBearerDefaults.AuthenticationScheme,
            Type = ReferenceType.SecurityScheme
        }
    };
    options.AddSecurityDefinition("Bearer", jwtSecurityScheme);
    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { jwtSecurityScheme, new string[] { } }
    });
});
#endif
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme=JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme=JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme=JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    options.SaveToken = true;
    #if DEBUG
    options.RequireHttpsMetadata = false;
    #endif
    options.TokenValidationParameters = new TokenValidationParameters()
    {
        ValidIssuer = builder.Configuration["JwtConfig:Issuer"],
        ValidAudience = builder.Configuration["JwtConfig:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["JwtConfig:Key"]!)),
        ValidateIssuerSigningKey = true,
        ValidateAudience = true,
        ValidateIssuer = true,
    };
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            string? accessToken = context.Request.Query["access_token"];
            
            PathString path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/api/rooms/roomHub"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    IMongoClient client = scope.ServiceProvider.GetRequiredService<IMongoClient>();
    IOptions<MongoDBSettings> settings = scope.ServiceProvider.GetRequiredService<IOptions<MongoDBSettings>>();
    DBSetup.InitializeIndexes(client,settings);
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();

#if DEBUG
app.UseCors("AllowReactApp");
#endif

#if DEBUG
app.MapOpenApi();
app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.RoutePrefix = string.Empty;
    options.SwaggerEndpoint("swagger/v1/swagger.json", "v1");
});
#endif

app.UseAuthentication();
app.UseAuthorization();

app.MapHub<RoomHub>("/api/rooms/roomHub");
app.MapControllers();
app.MapFallbackToFile("index.html");

app.Run();

//TODO Caching where appropriate
//TODO Browser caching
//TODO Figure out how to pass errors to client from room hub (tbf, not that important?)
//TODO Bg service to delete empty rooms and unused players(only for players that didnt connect, the rest it taken care of by signalr disconnect function)
//TODO Shuffle order of lyrics lines in future
//TODO AI is the must for tts in future (mb piper with custom voice)
//TODO Image recording bug
//TODO Deploy using AWS if possible (also fuck around with Docker, kinda interesting)
//TODO Add language selector in lyrics