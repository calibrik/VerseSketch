using Microsoft.AspNetCore.SignalR;
using VerseSketch.Backend.Models;
using VerseSketch.Backend.ViewModels;

namespace VerseSketch.Backend.Repositories;

public interface IRoomHub
{
    Task ReceiveRoom(RoomViewModel model);
}

public class RoomHub:Hub<IRoomHub>
{
    private readonly PlayerRepository _playerRepository;
    private readonly RoomsRepository _roomsRepository;

    public RoomHub(PlayerRepository playerRepository,RoomsRepository roomsRepository)
    {
        _playerRepository = playerRepository;
        _roomsRepository = roomsRepository;
    }
    public override async Task OnConnectedAsync()
    {
        if (!Context.User.Identity.IsAuthenticated)
        {
            Context.Abort();
            return;
        }
        string roomTitle=Context.GetHttpContext().Request.Query["roomTitle"];
        Room? room = await _roomsRepository.GetRoomAsyncRO(roomTitle);
        string playerId = Context.User.FindFirst("PlayerId").Value;
        if (room == null||!await _playerRepository.IsPlayerInRoomAsyncRO(playerId,room.Title))
        {
            Context.Abort();
            return;
        }
        await Groups.AddToGroupAsync(Context.ConnectionId,room.Title);
    }
}