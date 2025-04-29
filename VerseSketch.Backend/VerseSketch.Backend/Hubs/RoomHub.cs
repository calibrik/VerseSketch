using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Protocol;
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
    Task PlayerLeft(string playerId);
    Task PlayerJoined(PlayerViewModel player);
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
        Player? player = await _playerRepository.GetPlayerAsyncRO(playerId);
        if (room == null||player==null||player.RoomTitle!=roomTitle)
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
            isPlayerAdmin = playerId==room.AdminId,
            PlayerId = player.Id,
        };
        foreach (Player p in room.Players)
        {
            model.Players.Add(new PlayerViewModel()
            {
                isAdmin = room.AdminId == p.Id,
                Nickname = p.Nickname??"",
                Id = p.Id,
            });
        }
        await Clients.Groups(roomTitle).PlayerJoined(new PlayerViewModel()
        {
            isAdmin = room.AdminId == player.Id,
            Nickname = player.Nickname,
            Id = player.Id,
        });
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

    public async Task KickPlayer(string playerId, string roomTitle)
    {
        Room? room = await _roomsRepository.GetRoomAsyncRO(roomTitle,false);
        if (room == null)
            throw new HubException("Room not found.");
        if (!Context.User.Identity.IsAuthenticated||room.AdminId!=Context.User.FindFirst("PlayerId").Value)
            throw new HubException("You are not the admin in this room.");
        Player? player = await _playerRepository.GetPlayerAsync(playerId);
        if (player == null||player.RoomTitle!=roomTitle)
            throw new HubException("Player is not in this room.");
        _playerRepository.DeletePlayer(player);
        await _playerRepository.SaveChangesAsync();
        await Clients.Groups(roomTitle).PlayerLeft(playerId);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        string playerId = Context.User.FindFirst("PlayerId").Value;
        Player? player = await _playerRepository.GetPlayerAsync(playerId);
        if (player == null)
            return;
        Room? room = await _roomsRepository.GetRoomAsyncRO(player.RoomTitle,false);
        _playerRepository.DeletePlayer(player);
        await _playerRepository.SaveChangesAsync();
        if (room.AdminId == player.Id)
        {
            await Clients.Groups(player.RoomTitle).RoomDeleted();
            return;
        }
        await Clients.Groups(player.RoomTitle).PlayerLeft(playerId);
    }
}