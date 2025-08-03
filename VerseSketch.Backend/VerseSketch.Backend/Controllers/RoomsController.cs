using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
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
    public static string CreateJoinLinkToken(Room room)
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
            return await _roomsRepository.IsJoinTokenValid(data.CurrentJoinToken,data.RoomTitle,ct)?data.RoomTitle:null;
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

    [HttpGet("/api/getCurrentPlayer")]
    public async Task<IActionResult> GetPlayer()
    {
        if (!User.Identity.IsAuthenticated)
            return Unauthorized(new {message="You are not authenticated"});
        Player? player=await _playerRepository.GetPlayerAsync(User.FindFirst("PlayerId").Value);
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
        Player? currPlayer = await _playerRepository.GetPlayerAsync(playerId);
        Room? room = await _roomsRepository.GetRoomAsync(roomTitle);
        if (room == null)
            return NotFound(new {message = $"Room called {roomTitle} is not found"});
        if (currPlayer == null)
            return StatusCode(500,new {message = $"Player {playerId} not found"});
        if (currPlayer.RoomTitle!=room.Title)
            return Unauthorized(new {message = $"You should be in room {roomTitle} to get it"});
        RoomViewModel model = new RoomViewModel()
        {
            Title = room.Title,
            isPublic = room.IsPublic,
            MaxPlayersCount = room.MaxPlayersCount,
            PlayersCount = room.PlayersCount,
            TimeToDraw = room.TimeToDraw,
            isPlayerAdmin = playerId==room.AdminId,
            PlayerId = currPlayer.Nickname,
            Stage = room.Stage,
        };
        List<Player> players = await _playerRepository.GetPlayersInRoomAsync(roomTitle);
        foreach (Player player in players)
        {
            PlayerViewModel playerVM = new PlayerViewModel()
            {
                Nickname = player.Nickname??"NULL",
                isAdmin = player._Id==room.AdminId,
            };
            model.Players.Add(playerVM);
        }
        return Ok(model);
    }

    [HttpGet("/api/rooms/isRoomAccessible")]
    [ResponseCache(NoStore = true)]
    public async Task<IActionResult> IsRoomAccessible([FromQuery] string roomTitle)
    {
        if (!User.Identity.IsAuthenticated)
            return Unauthorized(new {message = $"You are not part of the {roomTitle}."});
        string? playerId = User.FindFirst("PlayerId")?.Value;
        Player? currPlayer = await _playerRepository.GetPlayerAsync(playerId);
        Room? room = await _roomsRepository.GetRoomAsync(roomTitle);
        if (room == null)
            return NotFound(new {message = $"The room {roomTitle} is not found."});
        if (room.Stage!=-1)
            return Unauthorized(new  {message = $"Game has already started in this room."});
        if (currPlayer == null)
            return StatusCode(500,new {message = "Something went wrong, please try again later."});
        if (currPlayer.RoomTitle!=room.Title)
            return Unauthorized(new {message = $"You are not part of the {roomTitle}."});
        return Ok();
    }

    [HttpGet("/api/rooms/validateJoinLink")]
    [ResponseCache(NoStore = true)]
    public async Task<IActionResult> ValidateJoinLink([FromQuery] string? roomTitle, [FromQuery] string? joinToken)//this function is dumpster fire
    {
        if (roomTitle == null && joinToken == null)
            return BadRequest(new {message = "At least one argument is required"});
        if (roomTitle != null)
        {
            Room? room = await _roomsRepository.GetRoomAsync(roomTitle);
            if (room == null)
                return NotFound(new {message = $"Sorry, room called {roomTitle} is not found"});
            if (room.Stage!=-1)
                return Unauthorized(new  {message = $"Game has already started in this room."});
            if (room.PlayersCount==0||!room.IsPublic)
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
    [ResponseCache(NoStore = true)]
    public async Task<IActionResult> ValidateRoomTitle([FromQuery] string roomTitle,CancellationToken ct)
    {
        return Ok( new {isExist = await _roomsRepository.GetRoomAsync(roomTitle,ct) != null});
    }

    
    [HttpPost("/api/rooms/create")]
    public async Task<IActionResult> Create([FromBody] CreateRoomViewModel model)
    {
        if (await _roomsRepository.GetRoomAsync(model.Title) != null)
            return BadRequest(new {message = "Room with this title already exists."});
        if (!ModelState.IsValid)
            return BadRequest(new {message = ModelState.Values.FirstOrDefault()?.Errors.FirstOrDefault()?.ErrorMessage});
        if (Regex.IsMatch(model.Title,@"[^\p{L}\p{N}_ ]"))
            return BadRequest(new {message = "Room title cannot contain special characters!"});
        
        Player admin = new Player()
        {
            CreatedTime = DateTime.UtcNow,
        };
        try
        {
            await _playerRepository.CreatePlayerAsync(admin);
        }
        catch (Exception e)
        {
            return StatusCode(500, new { message = "Something went wrong, please try again later." });
        }
        Room room = new Room()
        {
            Title = model.Title,
            PlayersCount = 0,
            MaxPlayersCount = model.MaxPlayersCount,
            AdminId = admin._Id,
            IsPublic = model.IsPublic,
            TimeToDraw = 10,
            Stage = -1
        };
        string joinToken = CreateJoinLinkToken(room);
        try
        {
            await _roomsRepository.CreateRoomAsync(room);
        }
        catch (Exception e)
        {
            return StatusCode(500, new { message = "Something went wrong, please try again later." });
        }
        return Ok(new { joinToken = joinToken, accessToken = JWTHandler.CreateToken(admin._Id, _configuration) });
    }

    [HttpGet("/api/rooms/validatePlayerNickname")]
    [ResponseCache(NoStore = true)]
    public async Task<IActionResult> ValidatePlayerNickname([FromQuery] string nickname,[FromQuery] string? roomTitle,[FromQuery] string? joinToken,CancellationToken ct)
    {
        if (roomTitle == null && joinToken == null)
            return BadRequest(new {message = "At least one argument is required"});
        if (roomTitle == null)
            roomTitle=await ValidateJoinToken(joinToken,ct);
        
        if (roomTitle==null)
            return BadRequest(new {message="Join link is not valid"});

        return Ok(new { isExist = await _playerRepository.GetPlayerByNicknameInRoomAsync(nickname, roomTitle, ct) });
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
            return BadRequest(new {message="Room title is required"});//check if user passed at least smth
        if (roomTitle==null)
            return BadRequest(new {message="Join link is not valid"});//check if join link is valid if room title is not present
        if (Regex.IsMatch(model.Nickname,@"[^\p{L}\p{N}_ ]"))
            return BadRequest(new {message = "Nickname cannot contain special characters!"});
        Room? room = await _roomsRepository.GetRoomAsync(roomTitle);
        if (room == null)
            return BadRequest(new {message="Room you trying to join doesn't exist"});//check if room exists
        if ((room.PlayersCount==0||!room.IsPublic)&&model.JoinToken==null)
            return BadRequest(new {message="You can't join private room."});//check user provides join token for rooms with 0 players or private
        if (room.Stage!=-1)
            return Unauthorized(new  {message = $"Game has already started in this room."});
        if (User.Identity.IsAuthenticated)
        {
            string playerId=User.FindFirst("PlayerId").Value;
            player = await _playerRepository.GetPlayerAsync(playerId);
            if (player == null)
                return StatusCode(500,new {message="Something went wrong, please try again later."});
        }
        // if (await _playerRepository.GetPlayerByNicknameInRoomAsync(model.Nickname, roomTitle) != null)
        //     return BadRequest(new {message="Nickname already exists in this room."});//check if username exists
        if (room.PlayersCount==0&&(player==null||player._Id!=room.AdminId))
            return BadRequest(new {message="Only creator of the room is allowed to join."});//check if only admin can join room with 0 players
        if (!ModelState.IsValid)
            return BadRequest(new {message="One or more fields in the form are invalid."});//any invalidations on model
        if (room.PlayersCount>=room.MaxPlayersCount)
            return BadRequest(new {message="Room is full."});//check if room is full
        
        
        if (player == null) 
        {
            player = new Player()
            {
                CreatedTime = DateTime.UtcNow,
            };
        }

        player.Nickname = model.Nickname;
        player.RoomTitle = room.Title;
        try
        {
            if (User.Identity.IsAuthenticated)
            {
                UpdateDefinition<Player> update = Builders<Player>.Update
                    .Set(p => p.Nickname, player.Nickname)
                    .Set(p => p.RoomTitle, roomTitle);
                await _playerRepository.UpdatePlayerAsync(player, update, true);
            }
            else
                await _playerRepository.CreatePlayerAsync(player);
        }
        catch (Exception e)
        {
            return StatusCode(500,new {message="Something went wrong, please try again later."});
        }
        string accessToken=JWTHandler.CreateToken(player._Id,_configuration);
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
        try
        {
            UpdateDefinition<Room> update = Builders<Room>.Update
                .Set(r => r.IsPublic, model.IsPublic)
                .Set(r => r.MaxPlayersCount, model.MaxPlayersCount)
                .Set(r => r.TimeToDraw, model.TimeToDraw);
            await _roomsRepository.UpdateRoomAsync(room.Title,update);
        }
        catch (Exception e)
        {
            return StatusCode(500,new {message="Something went wrong, please try again later."});   
        }
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

    [HttpDelete("/api/rooms/leave")]
    public async Task<IActionResult> Leave()
    {
        if (!User.Identity.IsAuthenticated)
            return Ok();
        try
        {
            await _playerRepository.DeletePlayerAsync(User.FindFirst("PlayerId").Value);
        }
        catch (Exception e)
        {
            // player will stay in db, or he is not there already
        }

        return Ok();
    }
} 

