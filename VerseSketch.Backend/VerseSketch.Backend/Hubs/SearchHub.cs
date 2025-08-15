using System.Collections.Concurrent;
using Microsoft.AspNetCore.SignalR;
using VerseSketch.Backend.Models;
using VerseSketch.Backend.Repositories;
using VerseSketch.Backend.ViewModels;

namespace VerseSketch.Backend.Hubs;

public interface ISearchHub
{
    Task ReceiveResult(List<RoomViewModel> rooms);
}

public class SearchHub:Hub<ISearchHub>
{
    private static readonly ConcurrentDictionary<string, CancellationTokenSource?> CancellationTokens = new();
    private readonly RoomsRepository _roomsRepository;

    public SearchHub(RoomsRepository roomsRepository)
    {
        _roomsRepository = roomsRepository;
    }

    public async Task SendResult(int page, int pageSize, string roomTitle)
    {
        if (CancellationTokens.TryRemove(Context.ConnectionId, out CancellationTokenSource? cts))
        {
            await cts?.CancelAsync();
            cts.Dispose();
        }
        CancellationTokens.TryAdd(Context.ConnectionId, cts=new CancellationTokenSource());
        List<Room> rooms=await _roomsRepository.SearchRoomsAsync(page, pageSize, roomTitle,cts.Token);
        List<RoomViewModel> roomsVM = new List<RoomViewModel>();
        foreach (Room room in rooms)
        {
            RoomViewModel roomVM = new RoomViewModel
            {
                Title = room.Title,
                MaxPlayersCount = room.MaxPlayersCount,
                PlayingPlayersCount = room.PlayingPlayersCount,
            };
            roomsVM.Add(roomVM);
        }
        await Clients.Clients(Context.ConnectionId).ReceiveResult(roomsVM);
        CancellationTokens.TryRemove(Context.ConnectionId, out CancellationTokenSource? _);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (CancellationTokens.TryRemove(Context.ConnectionId, out CancellationTokenSource? cts))
        {
            await cts?.CancelAsync();
            cts.Dispose();
        }
    }
}