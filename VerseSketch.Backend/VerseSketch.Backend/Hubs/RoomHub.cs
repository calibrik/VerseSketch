using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Protocol;
using MongoDB.Driver;
using VerseSketch.Backend.Controllers;
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
    Task PlayerKicked(string playerId);
    Task PlayerJoined(PlayerViewModel player);
    Task StageSet(int stage);
    Task PlayerCompletedTask();
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
        Room? room = await _roomsRepository.GetRoomAsync(roomTitle);
        string playerId = Context.User.FindFirst("PlayerId").Value;
        Player? player = await _playerRepository.GetPlayerAsync(playerId);
        if (room == null||player==null)
        {
            Context.Abort();
            return;
        }
        try
        {
            UpdateDefinition<Player> update = Builders<Player>.Update.Set(p => p.ConnectionID, Context.ConnectionId);
            await _playerRepository.UpdatePlayerAsync(player,update,false);
        }
        catch (Exception e)
        {
            Context.Abort();
            return;
        }
        RoomViewModel model = new RoomViewModel()
        {
            Title = room.Title,
            isPublic = room.IsPublic,
            MaxPlayersCount = room.MaxPlayersCount,
            PlayersCount = room.PlayersCount,
            TimeToDraw = room.TimeToDraw,
            isPlayerAdmin = playerId==room.AdminId,
            PlayerId = player._Id,
        };
        List<Player> players = await _playerRepository.GetPlayersInRoomAsync(room.Title);
        foreach (Player p in players)
        {
            model.Players.Add(new PlayerViewModel()
            {
                isAdmin = room.AdminId == p._Id,
                Nickname = p.Nickname??"",
                Id = p._Id,
            });
        }
        await Clients.Clients(Context.ConnectionId).ReceiveRoom(model);
        await Groups.AddToGroupAsync(Context.ConnectionId,roomTitle);
    }

    public async Task Join(string roomTitle)
    {
        if (!Context.User.Identity.IsAuthenticated)
        {
            throw new HubException("You are not in this room.");
        }
        string playerId = Context.User.FindFirst("PlayerId").Value;
        Player? player = await _playerRepository.GetPlayerAsync(playerId);
        Room? room=await _roomsRepository.GetRoomAsync(roomTitle);
        if (player == null)
        {
            throw new HubException("Player not found.");
        }
    
        if (room == null)
        {
            throw new HubException("Room not found.");
        }
        await Clients.Groups(roomTitle).PlayerJoined(new PlayerViewModel()
        {
            isAdmin = room.AdminId == player._Id,
            Nickname = player.Nickname,
            Id = player._Id,
        });
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
        
        try
        {
            UpdateDefinition<Room> update = Builders<Room>.Update
                .Set(r => r.IsPublic, model.IsPublic??room.IsPublic)
                .Set(r => r.MaxPlayersCount, model.MaxPlayersCount??room.MaxPlayersCount)
                .Set(r => r.TimeToDraw, model.TimeToDraw??room.TimeToDraw);
            await _roomsRepository.UpdateRoomAsync(room.Title,update);
        }
        catch (Exception e)
        {
            throw new HubException("Something went wrong, please try again later.");
        }
        await Clients.Groups(model.RoomTitle).ReceiveParams(model);
    }

    public async Task KickPlayer(string playerId, string roomTitle)
    {
        Room? room = await _roomsRepository.GetRoomAsync(roomTitle);
        if (room == null)
            throw new HubException("Room not found.");
        if (!Context.User.Identity.IsAuthenticated||room.AdminId!=Context.User.FindFirst("PlayerId").Value)
            throw new HubException("You are not the admin in this room.");
        Player? player = await _playerRepository.GetPlayerAsync(playerId);
        if (player == null||player.RoomTitle!=roomTitle)
            throw new HubException("Player is not in this room.");
        await Clients.Group(roomTitle).PlayerKicked(playerId);
    }
    public async Task<string> GenerateJoinToken(string roomTitle)
    {
        if (!Context.User.Identity.IsAuthenticated)
            throw new HubException("You are not an admin in this room.");
        Room? room = await _roomsRepository.GetRoomAsync(roomTitle);
        if (room == null)
            throw new HubException($"Room {roomTitle} is not found");
        string playerId=Context.User.FindFirst("PlayerId").Value;
        if (room.AdminId!=playerId)
            throw new HubException("You are not an admin in this room.");
        string joinToken = RoomsController.CreateJoinLinkToken(room);
        try
        {
            UpdateDefinition<Room> update = Builders<Room>.Update.Set(r=>r.CurrentJoinToken,room.CurrentJoinToken);
            await _roomsRepository.UpdateRoomAsync(roomTitle,update);
        }
        catch (Exception e)
        {
            throw new HubException("Something went wrong, please try again later.");
        }
        return joinToken;
    }

    public async Task StartGame()
    {
        if (!Context.User.Identity.IsAuthenticated)
            throw new HubException("You are not an admin in this room.");
        string playerId = Context.User.FindFirst("PlayerId").Value;
        Player? player = await _playerRepository.GetPlayerAsync(playerId);
        if (player == null)
            throw new HubException("You are not an admin in this room.");
        Room? room = await _roomsRepository.GetRoomAsync(player.RoomTitle);
        if (room == null)
            throw new HubException("Room not found.");
        if (room.AdminId!=playerId)
            throw new HubException("You are not an admin in this room.");

        
        UpdateDefinition<Room> update = Builders<Room>.Update.Set(r => r.Stage, 0);
        await _roomsRepository.UpdateRoomAsync(player.RoomTitle,update);
        await Clients.Group(player.RoomTitle).StageSet(0);
    }

    public async Task SendLyrics(string lyrics)
    {
        if (!Context.User.Identity.IsAuthenticated)
            throw new HubException("You are not in this room.");
        Player? player = await _playerRepository.GetPlayerAsync(Context.User.FindFirst("PlayerId").Value);
        Room? room = await _roomsRepository.GetRoomAsync(player.RoomTitle);
        if (room == null)
            throw new HubException("Room not found.");
        if (lyrics == "")
        {
            await Clients.Group(room.Title).PlayerKicked(player._Id);
            return;
        }
        List<string> lyricsSubmitted=lyrics.Split('\n').ToList();
        if  (lyricsSubmitted.Count!=6)
            throw new HubException("Wrong amount of lines.");
        foreach (string line in lyricsSubmitted)
        {
            if (line.Length>95)
                throw new HubException("Line is too long.");
        }
        UpdateDefinition<Player> update = Builders<Player>.Update.Set(p=>p.LyricsSubmitted,lyricsSubmitted);
        await _playerRepository.UpdatePlayerAsync(player,update,false);
        await Clients.Group(room.Title).PlayerCompletedTask();
    }

    public async Task Leave()
    {
        if (!Context.User.Identity.IsAuthenticated)
            return;
        string playerId = Context.User.FindFirst("PlayerId").Value;
        Player? player = await _playerRepository.GetPlayerAsync(playerId);
        if (player == null)
        {
            Context.Abort();
            return;
        }
        await RemovePlayer(player);
        Context.Abort();
    }

    async Task RemovePlayer(Player player)
    {
        Room? room = await _roomsRepository.GetRoomAsync(player.RoomTitle);
        try
        {
            await _playerRepository.DeletePlayerAsync(player);
        }
        catch (Exception e)
        {
            // player will stay in db, or he is not there already
        }
        await Groups.RemoveFromGroupAsync(Context.ConnectionId,room.Title);
        if (room.AdminId == player._Id)
        {
            await Clients.Groups(player.RoomTitle).RoomDeleted();
            return;
        }
        await Clients.Groups(player.RoomTitle).PlayerLeft(player._Id);
    }
    
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (!Context.User.Identity.IsAuthenticated)
            return;
        string playerId = Context.User.FindFirst("PlayerId").Value;
        Player? player = await _playerRepository.GetPlayerAsync(playerId);
        if (player == null)
            return;
        if (player.ConnectionID != null)
        {
            string currConnectionId = player.ConnectionID;
            await Task.Delay(27000);
            Player? currPlayer=await _playerRepository.GetPlayerAsync(playerId);
            if (currPlayer == null || currConnectionId != currPlayer.ConnectionID)
                return;
        }
        await RemovePlayer(player);
    }
}