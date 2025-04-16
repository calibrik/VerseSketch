using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VerseSketch.Backend.Misc;
using VerseSketch.Backend.Models;
using VerseSketch.Backend.Repositories;
using VerseSketch.Backend.ViewModels;

namespace VerseSketch.Backend.Controllers;
[ApiController]
// [Route("/api")]
public class RoomsController:ControllerBase
{
    private readonly RoomsRepository _roomsRepository;
    private readonly PlayerRepository _playerRepository;
    private readonly IConfiguration _configuration;
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
        if (currPlayer == null)
            return StatusCode(500,new {message = $"Player {playerId} not found"});
        if (currPlayer.RoomTitle!=roomTitle)
            return Unauthorized(new {message = $"You should be in room {roomTitle} to get it"});
        Room? room = await _roomsRepository.GetRoomAsyncRO(roomTitle,true);
        if (room == null)
            return NotFound(new {message = $"Room called {roomTitle} is not found"});
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

    [HttpGet("/api/rooms/validateRoomTitle")]
    public async Task<IActionResult> ValidateRoomTitle([FromQuery] string title)
    {
        return Ok( new {isExist = await _roomsRepository.GetRoomAsyncRO(title,false) != null});
    }
    
    [HttpPost("/api/rooms/create")]
    public async Task<IActionResult> Create([FromBody] CreateRoomViewModel model)
    {
        if (await _roomsRepository.GetRoomAsyncRO(model.Title,false) != null)
            ModelState.AddModelError("Title", "Title already exists");
        if (!ModelState.IsValid)
            return BadRequest(ModelState);
        Player admin = new Player()
        {
            Id = Guid.NewGuid().ToString(),
        };
        Room room = new Room()
        {
            Title = model.Title,
            PlayersCount = 0,
            MaxPlayersCount = model.MaxPlayersCount,
            AdminId = admin.Id,
            isPublic = model.IsPublic,
            TimeToDraw = 10
        };
        await _playerRepository.CreatePlayer(admin);
        await _roomsRepository.CreateRoomAsync(room);
        bool res=await _roomsRepository.SaveChangesAsync();
        if (!res)
            return StatusCode(500, new {message = "Something went wrong, please try again later."});
        return Ok(new {roomTitle=room.Title,accessToken=JWTHandler.CreateToken(admin.Id,_configuration)});
    }
    [HttpGet("/api/rooms/validatePlayerNickname")]
    public async Task<IActionResult> ValidatePlayerNickname([FromQuery] string nickname,[FromQuery] string roomTitle)
    {
        return Ok( new {isExist = await _playerRepository.GetPlayerByNicknameInRoomAsyncRO(nickname,roomTitle) != null});
    }
    [HttpPost("/api/rooms/join")]
    public async Task<IActionResult> Join([FromBody] CreatePlayerViewModel model)
    {
        Player? player=null;
        Room? room = await _roomsRepository.GetRoomAsync(model.RoomTitle);
        if (room == null)
            return BadRequest(new {message="Room you trying to join doesn't exist"});
        if (User.Identity.IsAuthenticated)
        {
            string playerId=User.FindFirst("PlayerId").Value;
            player = await _playerRepository.GetPlayerAsync(playerId);
            if (player == null)
                return BadRequest(new {message=$"Player instance {playerId} is not found"});
        }
        if (await _playerRepository.GetPlayerByNicknameInRoomAsyncRO(model.Nickname, model.RoomTitle) != null)
            return BadRequest(new {message="Nickname already exists in this room."});
        if (player!=null&&room.AdminId!=player.Id)
            return BadRequest(new {message="Only creator of the room is allowed to join."});
        if (!ModelState.IsValid)
            return BadRequest(ModelState);
        if (room.PlayersCount>=room.MaxPlayersCount)
            return BadRequest(new {message="Room is full."});
        
        
        if (player == null) 
        {
            player = new Player()
            {
                Id = Guid.NewGuid().ToString(),
            };
            await _playerRepository.CreatePlayer(player);
        }

        string accessToken=JWTHandler.CreateToken(player.Id,_configuration);

        player.Nickname = model.Nickname;
        player.RoomTitle = model.RoomTitle;
        await _playerRepository.SaveChangesAsync();
        return Ok(new { accessToken = accessToken });
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
        bool res = await _roomsRepository.SaveChangesAsync();
        if (!res)
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
//TODO player nickname validation (cancellation token)
//TODO join link
//TODO Leave and destroy player functionality
//TODO Somehow destroy empty rooms (either bg service or destroy on admin leave?)
//TODO kick player
//TODO player order in list
