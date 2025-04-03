using Microsoft.EntityFrameworkCore;
using VerseSketch.Backend.Models;
using VerseSketch.Backend.Repositories;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddScoped<RoomsRepository>();
builder.Services.AddDbContext<VerseSketchDbContext>(options =>
{
    options.UseNpgsql(builder.Configuration.GetConnectionString("LocalConnection"));
});
builder.Services.AddOpenApi();

var app = builder.Build();


app.MapOpenApi();


app.UseSwaggerUI(options =>
{
    options.RoutePrefix = string.Empty;
    options.SwaggerEndpoint("openapi/v1.json", "v1");
});


app.UseHttpsRedirection();

app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();

app.MapControllers();
app.Run();
