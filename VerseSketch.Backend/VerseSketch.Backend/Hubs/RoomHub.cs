using System.ComponentModel.DataAnnotations;
using System.Diagnostics;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using MongoDB.Driver;
using VerseSketch.Backend.Controllers;
using VerseSketch.Backend.Misc;
using VerseSketch.Backend.Models;
using VerseSketch.Backend.Repositories;
using VerseSketch.Backend.ViewModels;

namespace VerseSketch.Backend.Hubs;

public enum LeaveReason
{
    Disconnected,
    Kicked
}

public interface IRoomHub
{
    Task ReceiveRoom(RoomViewModel model);
    Task ReceiveParams(SetParamsViewModel model);
    Task ReceivePlayerList(List<PlayerViewModel> players);
    Task RoomDeleted(string reason);
    Task PlayerLeft(string playerId,bool isRemoved,LeaveReason reason);
    Task PlayerJoined(PlayerViewModel player);
    Task StageSet(int stage);
    Task PlayerCompletedTask(int completedNum);
    Task StartShowcase(string playerId);
    Task ShowcaseFinished();
    Task ReceiveErrorMessage(string msg, bool isTerminal);
    Task ReceiveStoryline(List<StorylineImageViewModel> storyline);
    Task ReceiveAudioFile(byte[] file,int index);
}

public class RoomHub:Hub<IRoomHub>
{
    private readonly PlayerRepository _playerRepository;
    private readonly RoomsRepository _roomsRepository;
    private readonly InstructionRepository _instructionRepository;
    private readonly StorylineRepository _storylineRepository;
    private readonly PiperService _piperService;

    public RoomHub(PlayerRepository playerRepository,RoomsRepository roomsRepository,InstructionRepository instructionRepository,StorylineRepository storylineRepository,PiperService piperService)
    {
        _playerRepository = playerRepository;
        _roomsRepository = roomsRepository;
        _instructionRepository = instructionRepository;
        _storylineRepository = storylineRepository;
        _piperService = piperService;
    }
    public override async Task OnConnectedAsync()
    {
        string roomTitle=Context.GetHttpContext().Request.Query["roomTitle"];
        if (!Context.User.Identity.IsAuthenticated)
        {
            await Clients.Clients(Context.ConnectionId).ReceiveErrorMessage($"You are not part of the room {roomTitle}.",true);
            Context.Abort();
            return;
        }
        Room? room = await _roomsRepository.GetRoomAsync(roomTitle);
        string playerId = Context.User.FindFirst("PlayerId").Value;
        Player? player = await _playerRepository.GetPlayerAsync(playerId);
        if (room == null||player==null||!player.IsActive)
        {
            await Clients.Clients(Context.ConnectionId).ReceiveErrorMessage($"You are not part of the room {roomTitle}.",true);
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
            await Clients.Clients(Context.ConnectionId).ReceiveErrorMessage("Something went wrong, please try again later.",true);
            Context.Abort();
            return;
        }
        RoomViewModel model = new RoomViewModel()
        {
            Title = room.Title,
            isPublic = room.IsPublic,
            MaxPlayersCount = room.MaxPlayersCount,
            PlayingPlayersCount = room.PlayingPlayersCount,
            ActualPlayersCount = room.ActualPlayersCount,
            TimeToDraw = room.TimeToDraw,
            isPlayerAdmin = playerId==room.AdminId,
            PlayerId = player._Id,
            Stage = room.Stage,
            CurrDone = room.CompletedMap.CurrDone
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
        if (room.Stage!=-1)
            throw new HubException($"Game has already started in this room.");
        if (room.ActualPlayersCount==0&&player._Id!=room.AdminId)
            throw new HubException("Only creator of the room is allowed to join.");//check if only admin can join room with 0 players
        if (room.ActualPlayersCount>=room.MaxPlayersCount)
            throw new HubException("Room is full.");//check if room is full
        
        
        UpdateDefinition<Player> update = Builders<Player>.Update
            .Set(p => p.RoomTitle, roomTitle);
        player.RoomTitle = roomTitle;
        await _playerRepository.UpdatePlayerAsync(player,update,true);
        if (player._Id != room.AdminId)
        {
            room.CompletedMap.IdToStage.Add(player._Id,-1);
            UpdateDefinition<Room> roomUpd = Builders<Room>.Update.Set(r=>r.CompletedMap.IdToStage,room.CompletedMap.IdToStage);
            await _roomsRepository.UpdateRoomAsync(room.Title,roomUpd);
        }
        await Clients.Groups(roomTitle).PlayerJoined(new PlayerViewModel()
        {
            isAdmin = room.AdminId == player._Id,
            Nickname = player.Nickname,
            Id = player._Id,
        });
    }

    public async Task PlayerCanceledTask()
    {
        if (!Context.User.Identity.IsAuthenticated)
        {
            throw new HubException("You are not in this room.");
        }
        Player? player = await _playerRepository.GetPlayerAsync(Context.User.FindFirst("PlayerId").Value);
        if (player == null)
        {
            throw new HubException("Player not found.");
        }
        Room? room=await _roomsRepository.GetRoomAsync(player.RoomTitle);
        if (room == null)
        {
            throw new HubException("Room not found.");
        }

        if (room.CompletedMap.IdToStage[player._Id] != room.Stage)
            return;
        int currDone=int.Max(room.CompletedMap.CurrDone-1,0);
        UpdateDefinition<Room> update = Builders<Room>.Update.Set(r => r.CompletedMap.CurrDone, currDone ).Inc(r=>r.CompletedMap.IdToStage[player._Id], -1 );
        await _roomsRepository.UpdateRoomAsync(room.Title,update);
        await Clients.Groups(room.Title).PlayerCompletedTask(currDone);
    }

    private async Task GenerateInstructionsAndStorylines(Room room)
    {
        List<string> playerIds = room.CompletedMap.IdToStage.Keys.ToList();
        List<Instruction> instructions = new List<Instruction>();
        List<Storyline> storylines = new List<Storyline>();
        playerIds.Shuffle(room.RandomOrderSeed);
        foreach (string id in playerIds)
        {
            Instruction instruction=new Instruction
            {
                PlayerId = id,
                RoomTitle = room.Title,
                LyricsIndexesToDraw = [],
            };
            Storyline storyline = new Storyline
            {
                PlayerId = id,
                RoomTitle = room.Title,
                Images = Enumerable.Repeat(new LyricsImage(),playerIds.Count-1).ToList(),
            };
            int i = playerIds.FindIndex(s => s == id);
            int lyricsI = 0;
            for (int j = 0; j<playerIds.Count-1; j++)
            {
                if (--i<0)
                    i = playerIds.Count-1;
                instruction.LyricsIndexesToDraw.Add(new InstructionLyrics
                {
                    IndexToDraw = lyricsI,
                    FromPlayerId = playerIds[i],
                });
                storyline.Images[playerIds.Count - 2 - j] = new LyricsImage
                {
                    ByPlayerId = playerIds[i],
                };
                lyricsI += 2;
            }
            storylines.Add(storyline);
            instructions.Add(instruction);
        }
        await _storylineRepository.CreateManyAsync(storylines);
        await _instructionRepository.CreateManyAsync(instructions);
    }
    private async Task PlayersDoneWithTask(Room room, Player player)
    {
        if (room.Stage == 0)
        {
            await GenerateInstructionsAndStorylines(room);
        }
        UpdateDefinition<Room> update = Builders<Room>.Update.Inc(r => r.Stage,1).Set(r=>r.CompletedMap.CurrDone,0).Set(r=>r.CompletedMap.IdToStage[player._Id], room.Stage);
        await _roomsRepository.UpdateRoomAsync(player.RoomTitle,update);
        await Clients.Group(player.RoomTitle).StageSet(room.Stage+1);
    }

    public async Task FinishGame()
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

        await ResetRoomState(room);
    }

    private async Task ResetRoomState(Room room)
    {
        CompletedMap newMap = new CompletedMap
        {
            CurrDone = 0,
            IdToStage = room.CompletedMap.IdToStage,
            Version = 0,
        };
        if (await _roomsRepository.DeleteNotActivePlayers(room.Title))
        {
            List<Player> players = await _playerRepository.GetPlayersInRoomAsync(room.Title);
            List<PlayerViewModel> playerViewModels = new List<PlayerViewModel>();
            newMap.IdToStage = new Dictionary<string, int>();
            foreach (Player p in players)
            {
                playerViewModels.Add(new  PlayerViewModel
                {
                    Nickname = p.Nickname,
                    isAdmin = p._Id==room.AdminId,
                    Id = p._Id
                });
                newMap.IdToStage.Add(p._Id, -1);
            }
            await Clients.Group(room.Title).ReceivePlayerList(playerViewModels);
        }
        else
        {
            foreach (string playerId in newMap.IdToStage.Keys)
                newMap.IdToStage[playerId] = -1;
        }
        UpdateDefinition<Room> update = Builders<Room>.Update.Set(r => r.Stage,-1).Set(r=>r.CompletedMap,newMap);
        await _roomsRepository.UpdateRoomAsync(room.Title,update);
        await _playerRepository.ResetLyricsForPlayersInRoom(room.Title);
        await _storylineRepository.DeleteRoomsStorylines(room.Title);
        await _instructionRepository.DeleteRoomsInstructions(room.Title);
        await Clients.Group(room.Title).StageSet(-1);
    }
    
    public async Task StartShowcase(string playerId)
    {
        if (!Context.User.Identity.IsAuthenticated)
            throw new HubException("You are not in this room.");
        Player? player = await _playerRepository.GetPlayerAsync(Context.User.FindFirst("PlayerId").Value);
        if (player == null)
            throw new HubException("You are not an admin in this room.");
        Room? room = await _roomsRepository.GetRoomAsync(player.RoomTitle);
        if (room == null)
            throw new HubException("Room not found.");
        if (room.AdminId!=player._Id)
            throw new HubException("You are not an admin in this room.");
        
        CompletedMap newMap = new CompletedMap
        {
            CurrDone = 0,
            IdToStage = room.CompletedMap.IdToStage,
            Version = room.CompletedMap.Version,
        };
        foreach (string id in room.CompletedMap.IdToStage.Keys)
        {
            newMap.IdToStage[id] = -1;
        }
        UpdateDefinition<Room> update = Builders<Room>.Update.Set(r=>r.CompletedMap,newMap);
        await _roomsRepository.UpdateRoomAsync(room.Title,update);

        List<LyricsImage> lyricsImages = await _storylineRepository.GetPlayersStoryline(playerId);
        Lyrics? lyrics=await _playerRepository.GetSubmittedLyrics(playerId);
        if (lyrics == null)
            throw new HubException("Lyrics not found.");
        List<StorylineImageViewModel> vm=new List<StorylineImageViewModel>();
        for (int i = 0; i < lyricsImages.Count; i++)
        {
            vm.Add(new  StorylineImageViewModel
            {
                Lyrics = [lyrics.Value.Lines[2*i],lyrics.Value.Lines[2*i+1]],
                byPlayerId = lyricsImages[i].ByPlayerId,
                Image = lyricsImages[i].Image,
            });
        }
        await Clients.Group(room.Title).ReceiveStoryline(vm);
        for (int i = 0; i < lyricsImages.Count; i++)
        {
            byte[] audioFile = await GetAudioPiper($"{lyrics.Value.Lines[2*i]},\n{lyrics.Value.Lines[2*i+1]},",lyrics.Value.Lang);
            await Clients.Groups(room.Title).ReceiveAudioFile(audioFile,i);
        }
        
        await Clients.Group(player.RoomTitle).StartShowcase(playerId);
    }
    
    private async Task<byte[]> GetAudioEspeak(string text)
    {
        try
        {
            ProcessStartInfo processStartInfo = new ProcessStartInfo("espeak-ng")
            {
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true,
            };
            processStartInfo.ArgumentList.Add(text);
            processStartInfo.ArgumentList.Add("--stdout");

            Process? process = Process.Start(processStartInfo);
            if (process == null)
                throw new Exception("Failed to start espeak-ng process");
            using MemoryStream memoryStream = new MemoryStream();
            await process.StandardOutput.BaseStream.CopyToAsync(memoryStream);
            await process.WaitForExitAsync();
            if (process.ExitCode != 0)
            {
                string error = await process.StandardError.ReadToEndAsync();
                throw new Exception(error);
            }
            return memoryStream.ToArray();
        }
        catch (Exception e)
        {
            Console.WriteLine(e.Message);
            return [];
        }
    }

    private async Task<byte[]> GetAudioPiper(string text,string lang)
    {
        try
        {
            return await _piperService.GetAudio(text, lang);
        }
        catch (Exception e)
        {
            Console.WriteLine(e.Message);
            return [];
        }
    }

    private async Task ShowcaseFinished(Room room, Player player)
    {
        await Clients.Group(room.Title).ShowcaseFinished();
    }

    public async Task PlayerFinishedShowcase()
    {
        if (!Context.User.Identity.IsAuthenticated)
            throw new HubException("You are not in this room.");
        Player? player = await _playerRepository.GetPlayerAsync(Context.User.FindFirst("PlayerId").Value);
        if (player == null)
            throw new HubException("You are not an admin in this room.");
        Room? room = await _roomsRepository.GetRoomAsync(player.RoomTitle);
        if (room == null)
            throw new HubException("Room not found.");
        
        await PlayerCompletedTask(room,player,ShowcaseFinished,false);
    }

    private async Task PlayerCompletedTask(Room? room, Player player,Func<Room,Player,Task> onPlayersDone,bool notifyPlayers)
    {
        if (room.CompletedMap.IdToStage[player._Id] == room.Stage)
            return;
        int currDone =int.Min(room.CompletedMap.CurrDone+1,room.PlayingPlayersCount);
        if (currDone == room.PlayingPlayersCount)
        {
            await onPlayersDone(room, player);
            return;
        }
        bool res = await _roomsRepository.UpdateCompletedMap(room.Title,player._Id,room.Stage,currDone,room.CompletedMap.Version);
        while (!res)
        {
            await Task.Delay(100);
            room = await _roomsRepository.GetRoomAsync(room.Title);
            if (room == null)
                return;
            currDone=int.Min(room.CompletedMap.CurrDone+1,room.PlayingPlayersCount);
            if (currDone == room.PlayingPlayersCount)
            {
                await onPlayersDone(room, player);
                return;
            }
            res = await _roomsRepository.UpdateCompletedMap(room.Title,player._Id,room.Stage,currDone,room.CompletedMap.Version);
        }
        if  (notifyPlayers)
            await Clients.Groups(room.Title).PlayerCompletedTask(currDone);
    }

    public async Task SendImage(LyricsImage image,string forPlayerId)
    {
        if (!Context.User.Identity.IsAuthenticated)
            throw new HubException("You are not in this room.");
        string playerId = Context.User.FindFirst("PlayerId").Value;
        Player? player = await _playerRepository.GetPlayerAsync(playerId);
        if (player == null)
            throw new HubException("Player not found.");
        Room? room = await _roomsRepository.GetRoomAsync(player.RoomTitle);
        if (room == null)
            throw new HubException("Room not found.");
        if (room.Stage<1||room.Stage==room.ActualPlayersCount)
            throw new HubException("You are in the wrong stage.");
        
        await _storylineRepository.UpdateImage(image,room.Stage,forPlayerId);
        await PlayerCompletedTask(room,player,PlayersDoneWithTask,true);
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

        if (model.TimeToDraw != null && (model.TimeToDraw.Value <= 0 || model.TimeToDraw.Value > 90))
        {
            throw new HubException("Time to draw is invalid.");
        }

        if (model.MaxPlayersCount != null && model.MaxPlayersCount < room.ActualPlayersCount)
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
        if (room.Stage!=-1)
            throw new HubException("You can't kick in this stage.");
        
        await RemovePlayer(player,room, LeaveReason.Kicked);
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
        if (room.ActualPlayersCount <2)
            throw new HubException("Room players count must be greater than 2 to start the game.");

        
        UpdateDefinition<Room> update = Builders<Room>.Update.Set(r => r.Stage, 0).Set(r=>r.RandomOrderSeed,Random.Shared.Next());
        await _roomsRepository.UpdateRoomAsync(player.RoomTitle,update);
        await Clients.Group(player.RoomTitle).StageSet(0);
    }

    public async Task SendLyrics(string lyrics,string lang)
    {
        if (!Context.User.Identity.IsAuthenticated)
            throw new HubException("You are not in this room.");
        Player? player = await _playerRepository.GetPlayerAsync(Context.User.FindFirst("PlayerId").Value);
        Room? room = await _roomsRepository.GetRoomAsync(player.RoomTitle);
        if (room == null)
            throw new HubException("Room not found.");
        if (room.Stage!=0)
            throw new HubException("Invalid stage.");
        if (lyrics == "")
        {
            throw new HubException("Nothing submitted.");
        }
        List<string> lyricsSubmitted=lyrics.Split('\n').ToList();
        lyricsSubmitted=lyricsSubmitted.Where(l=>l!="").ToList();
        if (lyricsSubmitted.Count!=(room.PlayingPlayersCount-1)*2)
            throw new HubException("Wrong amount of lines.");
        foreach (string line in lyricsSubmitted)
        {
            if (line.Length>95)
                throw new HubException("Line is too long.");
        }
        UpdateDefinition<Player> upd= Builders<Player>.Update.Set(r=>r.SubmittedLyrics,new Lyrics
        {
            FromPlayerId = player._Id,
            Lang = lang,
            Lines=lyricsSubmitted
        });
        await _playerRepository.UpdatePlayerAsync(player,upd,false);
        await PlayerCompletedTask(room,player,PlayersDoneWithTask,true);
    }

    public async Task Leave()
    {
        if (!Context.User.Identity.IsAuthenticated)
            return;
        string playerId = Context.User.FindFirst("PlayerId").Value;
        Player? player = await _playerRepository.GetPlayerAsync(playerId);
        if (player == null||!player.IsActive)
        {
            Context.Abort();
            return;
        }
        if (player.RoomTitle!=null)
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, player.RoomTitle);
        await RemovePlayer(player,LeaveReason.Disconnected);
        Context.Abort();
    }

    async Task RemovePlayer(Player player, LeaveReason reason)
    {
        Room? room = await _roomsRepository.GetRoomAsync(player.RoomTitle);
        if (room == null)
            return;
        await RemovePlayer(player,room,reason);
    }

    async Task RemovePlayer(Player player,Room room,LeaveReason reason)
    {
        // Console.WriteLine($"Removing player {player.Nickname} at {DateTime.Now}");
        bool isInGame = await _playerRepository.HasPlayerSubmitLyrics(player._Id);
        
        if (!isInGame || player._Id == room.AdminId)
        {
            await _playerRepository.DeletePlayerAsync(player);
            room.ActualPlayersCount--;
        }
        else
        {
            UpdateDefinition<Player> update = Builders<Player>.Update.Set(p => p.ConnectionID, null).Set(p=>p.IsActive,false);
            await _playerRepository.UpdatePlayerAsync(player, update, false);
            await _roomsRepository.IncrementPlayingPlayersCountAsync(room.Title, -1);
        }

        room.PlayingPlayersCount--;
        int currDone = room.Stage!=-1 && room.CompletedMap.IdToStage[player._Id] == room.Stage
            ? room.CompletedMap.CurrDone - 1
            : room.CompletedMap.CurrDone;
        room.CompletedMap.IdToStage.Remove(player._Id);
        if (room.AdminId != player._Id)
        {
            if (room.Stage != -1 && room.ActualPlayersCount <= 1)
            {
                await ResetRoomState(room);
                await Clients.Groups(player.RoomTitle).ReceiveErrorMessage("Not enough players left to play.",false);
                room.Stage = -1;
            }
            else
            {
                UpdateDefinition<Room> update =
                    Builders<Room>.Update.Set(r => r.CompletedMap.IdToStage, room.CompletedMap.IdToStage);
                if (currDone != room.CompletedMap.CurrDone)
                {
                    update=update.Set(r=>r.CompletedMap.CurrDone, currDone);
                    await Clients.Group(room.Title).PlayerCompletedTask(currDone);
                }
                await _roomsRepository.UpdateRoomAsync(player.RoomTitle, update);
            }
        }
        else
        {
            await Clients.Groups(player.RoomTitle).RoomDeleted("Admin left the room.");
            return;
        }

        if (isInGame && room.Stage != -1 && currDone == room.PlayingPlayersCount)
        {
            if (room.Stage == room.ActualPlayersCount)
                await ShowcaseFinished(room, player);
            else
                await PlayersDoneWithTask(room, player);
        }
        if (!isInGame && room.Stage == 0)
        {
            CompletedMap newMap = new CompletedMap
            {
                CurrDone = 0,
                IdToStage = room.CompletedMap.IdToStage,
                Version = 0,
            };
            foreach (string playerId in newMap.IdToStage.Keys)
                newMap.IdToStage[playerId] = -1;
            UpdateDefinition<Room> update = Builders<Room>.Update.Set(r=>r.CompletedMap,newMap);
            await _roomsRepository.UpdateRoomAsync(room.Title, update);
            await Clients.Groups(player.RoomTitle).PlayerCompletedTask(0);
        }
        await Clients.Groups(player.RoomTitle).PlayerLeft(player._Id, isInGame,reason);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (!Context.User.Identity.IsAuthenticated)
            return;
        string playerId = Context.User.FindFirst("PlayerId").Value;
        Player? player = await _playerRepository.GetPlayerAsync(playerId);
        if (player == null||!player.IsActive)
            return;
        if (player.ConnectionID != null)
        {
            string currConnectionId = player.ConnectionID;
            await Task.Delay(15000);
            Player? currPlayer=await _playerRepository.GetPlayerAsync(playerId);
            if (currPlayer == null || currPlayer.ConnectionID==null || currConnectionId != currPlayer.ConnectionID)
                return;
        }
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, player.RoomTitle);
        await RemovePlayer(player,LeaveReason.Disconnected);
    }
}