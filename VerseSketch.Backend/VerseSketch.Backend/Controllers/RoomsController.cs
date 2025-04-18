﻿using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using VerseSketch.Backend.Misc;
using VerseSketch.Backend.Models;
using VerseSketch.Backend.Repositories;
using VerseSketch.Backend.ViewModels;


namespace VerseSketch.Backend.Controllers;
[ApiController]
public class RoomsController:ControllerBase
{
    private readonly RoomsRepository _roomsRepository;
    private readonly PlayerRepository _playerRepository;
    private readonly IConfiguration _configuration;

    record JoinTokenData
    {
        public string CurrentJoinToken { get; set; }
        public string RoomTitle { get; set; }
    }
    string CreateJoinLinkToken(Room room)
    {
        room.CurrentJoinToken = Guid.NewGuid().ToString();
        JoinTokenData data = new JoinTokenData{ CurrentJoinToken = room.CurrentJoinToken, RoomTitle = room.Title };
        string json = JsonSerializer.Serialize(data);
        return Convert.ToBase64String(Encoding.UTF8.GetBytes(json));
    }

    async Task<string?> ValidateJoinToken(string token, CancellationToken ct=default)
    {
        try
        {
            byte[] bytes = Convert.FromBase64String(token);
            JoinTokenData? data = JsonSerializer.Deserialize<JoinTokenData>(Encoding.UTF8.GetString(bytes));
            if (data==null)
                return null;
            return await _roomsRepository.IsTokenValid(data.CurrentJoinToken,data.RoomTitle,ct)?data.RoomTitle:null;
        }
        catch (Exception ex)
        {
            return null;
        }
    }
    
    public RoomsController(RoomsRepository roomsRepository, PlayerRepository playerRepository, IConfiguration configuration)
    {
        _roomsRepository = roomsRepository;
        _playerRepository = playerRepository;
        _configuration = configuration;
    }
    [HttpGet("/api/rooms")]
    public async Task<IActionResult> GetRooms()
    {
        return Ok(new {message = "Room List"});
    }

    [HttpGet("/api/getCurrentPlayer")]
    public async Task<IActionResult> GetPlayer()
    {
        if (!User.Identity.IsAuthenticated)
            return Unauthorized(new {message="You are not authenticated"});
        Player? player=await _playerRepository.GetPlayerAsyncRO(User.FindFirst("PlayerId").Value);
        if (player == null)
            return BadRequest(new {message="Player not found"});
        return Ok(player);
    }

    [HttpGet("/api/rooms/{roomTitle}")]
    public async Task<IActionResult> Get(string roomTitle)
    {
        if (!User.Identity.IsAuthenticated)
            return Unauthorized(new {message = "You are not authenticated"});
        string? playerId = User.FindFirst("PlayerId")?.Value;
        Player? currPlayer = await _playerRepository.GetPlayerAsyncRO(playerId);
        Room? room = await _roomsRepository.GetRoomAsyncRO(roomTitle,true);
        if (room == null)
            return NotFound(new {message = $"Room called {roomTitle} is not found"});
        if (currPlayer == null)
            return StatusCode(500,new {message = $"Player {playerId} not found"});
        if (currPlayer.RoomTitle!=room.Title)
            return Unauthorized(new {message = $"You should be in room {roomTitle} to get it"});
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
            PlayerViewModel playerVM = new PlayerViewModel()
            {
                Nickname = player.Nickname??"NULL",
                isAdmin = player.Id==room.AdminId,
            };
            model.Players.Add(playerVM);
        }
        return Ok(model);
    }

    [HttpGet("/api/rooms/validateJoinLink")]
    public async Task<IActionResult> ValidateJoinLink([FromQuery] string? roomTitle, [FromQuery] string? joinToken)
    {
        if (roomTitle == null && joinToken == null)
            return BadRequest(new {message = "At least one argument is required"});
        if (roomTitle != null)
        {
            Room? room = await _roomsRepository.GetRoomAsyncRO(roomTitle,false);
            if (room == null)
                return NotFound(new {message = $"Sorry, room called {roomTitle} is not found"});
            if (room.PlayersCount==0||!room.isPublic)
                return BadRequest(new {message = $"Sorry, room {roomTitle} is private"});
            return Ok();
        }
        if (joinToken != null)
        {
            if (await ValidateJoinToken(joinToken) == null)
                return BadRequest(new {message = "Sorry, this join link is invalid or expired"});
            return Ok();
        }
        return StatusCode(500, new {message = "Something went wrong, please try again later."});
    }
    
    
    [HttpGet("/api/rooms/validateRoomTitle")]
    public async Task<IActionResult> ValidateRoomTitle([FromQuery] string roomTitle,CancellationToken ct)
    {
        return Ok( new {isExist = await _roomsRepository.GetRoomAsyncRO(roomTitle,false,ct) != null});
    }

    
    [HttpPost("/api/rooms/create")]
    public async Task<IActionResult> Create([FromBody] CreateRoomViewModel model)
    {
        if (await _roomsRepository.GetRoomAsyncRO(model.Title, false) != null)
            ModelState.AddModelError("Title", "Title already exists");
        if (!ModelState.IsValid)
            return BadRequest(ModelState);
        Player admin = new Player()
        {
            Id = Guid.NewGuid().ToString(),
            CreatedTime = DateTime.UtcNow,
        };
        Room room = new Room()
        {
            Title = model.Title,
            PlayersCount = 0,
            MaxPlayersCount = model.MaxPlayersCount,
            AdminId = admin.Id,
            isPublic = model.IsPublic,
            TimeToDraw = 10,
        };
        string joinToken = CreateJoinLinkToken(room);
        await _playerRepository.CreatePlayer(admin);
        await _roomsRepository.CreateRoomAsync(room);
        bool res = await _roomsRepository.SaveChangesAsync();
        if (!res)
            return StatusCode(500, new { message = "Something went wrong, please try again later." });
        return Ok(new { joinToken = joinToken, accessToken = JWTHandler.CreateToken(admin.Id, _configuration) });
    }

    [HttpGet("/api/rooms/validatePlayerNickname")]
    public async Task<IActionResult> ValidatePlayerNickname([FromQuery] string nickname,[FromQuery] string? roomTitle,[FromQuery] string? joinToken,CancellationToken ct)
    {
        if (roomTitle == null && joinToken == null)
            return BadRequest(new {message = "At least one argument is required"});
        if (roomTitle == null)
            roomTitle=await ValidateJoinToken(joinToken,ct);
        
        if (roomTitle==null)
            return BadRequest(new {message="Join link is not valid"});

        return Ok(new { isExist = await _playerRepository.GetPlayerByNicknameInRoomAsyncRO(nickname, roomTitle, ct) });
    }

    [HttpGet("/api/rooms/generateJoinToken")]
    public async Task<IActionResult> GenerateJoinToken([FromQuery] string roomTitle)
    {
        if (!User.Identity.IsAuthenticated)
            return Unauthorized(new {message = $"You must be the admin of the room {roomTitle} to change it parameters."});
        Room? room = await _roomsRepository.GetRoomAsync(roomTitle);
        if (room == null)
            return NotFound(new {message = $"Room {roomTitle} is not found"});
        string playerId=User.FindFirst("PlayerId").Value;
        if (room.AdminId!=playerId)
            return Unauthorized(new {message = $"You must be the admin of the room {roomTitle} to change it parameters."});
        string joinToken = CreateJoinLinkToken(room);
        if (!await _roomsRepository.SaveChangesAsync())
            return StatusCode(500,new {message="Something went wrong, please try again later."});
        return Ok(new {joinToken=joinToken});
    }
    [HttpPost("/api/rooms/join")]
    public async Task<IActionResult> Join([FromBody] CreatePlayerViewModel model)
    {
        Player? player=null;
        string? roomTitle=null;
        if (model.RoomTitle != null)
            roomTitle=model.RoomTitle;
        else if (model.JoinToken != null)
            roomTitle=await ValidateJoinToken(model.JoinToken);
        
        if (model.RoomTitle == null&&model.JoinToken==null)
            return BadRequest(new {message="Room Title is required"});//check if user passed at least smth
        if (roomTitle==null)
            return BadRequest(new {message="Join link is not valid"});//check if join link is valid if present
        Room? room = await _roomsRepository.GetRoomAsync(roomTitle);
        if (room == null)
            return BadRequest(new {message="Room you trying to join doesn't exist"});//check if room exists
        if ((room.PlayersCount==0||!room.isPublic)&&model.JoinToken==null)
            return BadRequest(new {message="You can't join private room"});//check user provides join token for rooms with 0 players or private
        if (User.Identity.IsAuthenticated)
        {
            string playerId=User.FindFirst("PlayerId").Value;
            player = await _playerRepository.GetPlayerAsync(playerId);
            if (player == null)
                return BadRequest(new {message=$"Player instance {playerId} is not found"});
        }
        if (await _playerRepository.GetPlayerByNicknameInRoomAsyncRO(model.Nickname, roomTitle) != null)
            return BadRequest(new {message="Nickname already exists in this room."});//check if username exists
        if (room.PlayersCount==0&&(player==null||player.Id!=room.AdminId))
            return BadRequest(new {message="Only creator of the room is allowed to join."});//check if only admin can join room with 0 players
        if (!ModelState.IsValid)
            return BadRequest(ModelState);//any invalidations on model
        if (room.PlayersCount>=room.MaxPlayersCount)
            return BadRequest(new {message="Room is full."});//check if room is fullrf
        
        
        if (player == null) 
        {
            player = new Player()
            {
                Id = Guid.NewGuid().ToString(),
                CreatedTime = DateTime.UtcNow,
            };
            await _playerRepository.CreatePlayer(player);
        }

        string accessToken=JWTHandler.CreateToken(player.Id,_configuration);

        player.Nickname = model.Nickname;
        player.RoomTitle = room.Title;
        if (!await _playerRepository.SaveChangesAsync())
            return StatusCode(500,new {message="Something went wrong, please try again later."});
        return Ok(new { accessToken = accessToken, roomTitle=room.Title });
    }

    [HttpPut("/api/rooms/setParams")]
    public async Task<IActionResult> SetParams([FromBody] SetParamsViewModel model)
    {
        Room? room = await _roomsRepository.GetRoomAsync(model.RoomTitle);
        if (room == null)
            return BadRequest();
        if (!User.Identity.IsAuthenticated)
            return Unauthorized(new {message = $"You must be the admin of the room {model.RoomTitle} to change it parameters."});
        string playerId = User.FindFirst("PlayerId")?.Value;
        if (playerId != room.AdminId)
            return Unauthorized(new {message = $"You must be the admin of the room {model.RoomTitle} to change it parameters."});
        if (!ModelState.IsValid)
            return BadRequest(ModelState);


        room.isPublic = model.IsPublic??room.isPublic;
        room.TimeToDraw = model.TimeToDraw??room.TimeToDraw;
        room.MaxPlayersCount = model.MaxPlayersCount??room.MaxPlayersCount;
        if (!await _roomsRepository.SaveChangesAsync())
            return StatusCode(500,new {message="Something went wrong, please try again later."});
        return Ok(new {message=$"Successfully changed parameters of the room {model.RoomTitle}."});
    }

    [HttpGet("/api/rooms/search")]
    public async Task<IActionResult> Search([FromQuery] int page,[FromQuery] int pageSize,[FromQuery] string? roomTitle,CancellationToken ct)
    {
        List<Room> rooms=await _roomsRepository.SearchRoomsAsync(page, pageSize, roomTitle??"",ct);
        List<RoomViewModel> roomsVM = new List<RoomViewModel>();
        foreach (Room room in rooms)
        {
            RoomViewModel roomVM = new RoomViewModel
            {
                Title = room.Title,
                MaxPlayersCount = room.MaxPlayersCount,
                PlayersCount = room.PlayersCount,
            };
            roomsVM.Add(roomVM);
        }
        return Ok(roomsVM);
    }
} 
//TODO Leave and destroy player functionality
//TODO Somehow destroy empty rooms (either bg service or destroy on admin leave (db trigger?)?)
//TODO kick player
//TODO player order in list
//TODO Caching where appropriate
//TODO Room hub reconnection 
//TODO test dat shit
