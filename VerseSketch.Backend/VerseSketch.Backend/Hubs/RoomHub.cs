using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.SignalR;
using VerseSketch.Backend.Models;
using VerseSketch.Backend.Repositories;
using VerseSketch.Backend.ViewModels;

namespace VerseSketch.Backend.Hubs;

public interface IRoomHub
{
    Task ReceiveRoom(RoomViewModel model);
    Task ReceiveParams(SetParamsViewModel model);
    Task ReceivePlayerList(List<PlayerViewModel> players);
    Task RoomDeleted();
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
        Room? room = await _roomsRepository.GetRoomAsyncRO(roomTitle,true);
        string playerId = Context.User.FindFirst("PlayerId").Value;
        if (room == null||!await _playerRepository.IsPlayerInRoomAsyncRO(playerId,room.Title))
        {
            Context.Abort();
            return;
        }
        RoomViewModel model = new RoomViewModel()
        {
            Title = room.Title,
            isPublic = room.isPublic,
            MaxPlayersCount = room.MaxPlayersCount,
            PlayersCount = room.PlayersCount,
            TimeToDraw = room.TimeToDraw,
            isPlayerAdmin = playerId==room.AdminId
        };
        foreach (Player player in room.Players)
        {
            model.Players.Add(new PlayerViewModel()
            {
                isAdmin = room.AdminId == player.Id,
                Nickname = player.Nickname??"",
                isPlayer = player.Id == playerId,
            });
        }
        await Clients.Groups(roomTitle).ReceivePlayerList(model.Players);
        await Groups.AddToGroupAsync(Context.ConnectionId,room.Title);
        await Clients.Clients(Context.ConnectionId).ReceiveRoom(model);
    }

    public async Task SendParams(SetParamsViewModel model)
    {
        Room? room = await _roomsRepository.GetRoomAsync(model.RoomTitle);
        if (room == null)
        {
            throw new HubException("Room not found");
        }

        if (!Context.User.Identity.IsAuthenticated)
        {
            throw new HubException($"You must be the admin of the room {model.RoomTitle} to change it parameters.");
        }

        string playerId = Context.User.FindFirst("PlayerId")?.Value;
        if (playerId != room.AdminId)
        {
            throw new HubException($"You must be the admin of the room {model.RoomTitle} to change it parameters.");
        }
        
        ValidationContext validationContext = new ValidationContext(model);
        List<ValidationResult> validationResults = new List<ValidationResult>();
        if (!Validator.TryValidateObject(model,validationContext,validationResults))
        {
            throw new HubException("One or more parameters are invalid.");
        }

        if (model.MaxPlayersCount != null && model.MaxPlayersCount < room.PlayersCount)
        {
            throw new HubException("Max Players Count can't be greater than room players.");
        }


        room.isPublic = model.IsPublic??room.isPublic;
        room.TimeToDraw = model.TimeToDraw??room.TimeToDraw;
        room.MaxPlayersCount = model.MaxPlayersCount??room.MaxPlayersCount;
        bool res = await _roomsRepository.SaveChangesAsync();
        if (!res)
        {
            throw new HubException("Something went wrong, please try again later.");
        }
        await Clients.Groups(model.RoomTitle).ReceiveParams(model);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        Player? player = await _playerRepository.GetPlayerAsync(Context.User.FindFirst("PlayerId").Value);
        if (player == null)
            return;
        Room? room = await _roomsRepository.GetRoomAsyncRO(player.RoomTitle,true);
        _playerRepository.DeletePlayer(player);
        await _playerRepository.SaveChangesAsync();
        if (room.AdminId == player.Id)
        {
            await Clients.Groups(player.RoomTitle).RoomDeleted();
            return;
        }
        List<PlayerViewModel> model = new List<PlayerViewModel>();
        foreach (Player p in room.Players)
        {
            if (p.Id == player.Id)
                continue;
            model.Add(new PlayerViewModel()
            {
                isAdmin = room.AdminId == player.Id,
                Nickname = p.Nickname??"",
                isPlayer = player.Id == p.Id,
            });
        }
        await Clients.Groups(player.RoomTitle).ReceivePlayerList(model);
    }
}