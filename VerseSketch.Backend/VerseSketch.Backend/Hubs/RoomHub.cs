﻿using System.ComponentModel.DataAnnotations;
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
    Task PlayerKicked(string playerId);
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
        Room? room = await _roomsRepository.GetRoomAsync(roomTitle);
        string playerId = Context.User.FindFirst("PlayerId").Value;
        Player? player = await _playerRepository.GetPlayerAsync(playerId);
        if (room == null||player==null)
        {
            Context.Abort();
            return;
        }
        player.ConnectionID = Context.ConnectionId;
        try
        {
            await _playerRepository.UpdatePlayerAsync(player,false);
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


        room.IsPublic = model.IsPublic??room.IsPublic;
        room.TimeToDraw = model.TimeToDraw??room.TimeToDraw;
        room.MaxPlayersCount = model.MaxPlayersCount??room.MaxPlayersCount;
        try
        {
            await _roomsRepository.UpdateRoomAsync(room);
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
            await Task.Delay(25000);
            Player? currPlayer=await _playerRepository.GetPlayerAsync(playerId);
            if (currPlayer == null || currConnectionId != currPlayer.ConnectionID)
                return;
        }
        await RemovePlayer(player);
    }
}