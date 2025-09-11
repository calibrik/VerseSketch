using VerseSketch.Backend.Repositories;

namespace VerseSketch.Backend.Models;

public class BGClearingService:BackgroundService
{
    private readonly TimeSpan _timeout = TimeSpan.FromMinutes(5);
    private readonly PeriodicTimer _timer;
    private readonly IServiceScopeFactory _scopeFactory;


    public BGClearingService(IServiceScopeFactory scopeFactory)
    {
        _scopeFactory=scopeFactory;
        _timer= new PeriodicTimer(_timeout);
    }

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (await _timer.WaitForNextTickAsync(ct))
        {
            using IServiceScope scope = _scopeFactory.CreateScope();
            RoomsRepository roomsRepository=scope.ServiceProvider.GetRequiredService<RoomsRepository>();
            PlayerRepository playerRepository=scope.ServiceProvider.GetRequiredService<PlayerRepository>();
            try
            {
                await roomsRepository.DeleteTimeoutedRooms(_timeout);
                await playerRepository.DeleteTimeoutedPlayers(_timeout);
            }
            catch (Exception e)
            {
                Console.WriteLine($"Failed to execute BGClearingService task:\n{e}");
            }
        }
    }
}