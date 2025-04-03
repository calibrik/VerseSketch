using Microsoft.AspNetCore.Mvc;
using VerseSketch.Backend.Models;
using VerseSketch.Backend.Repositories;
using VerseSketch.Backend.ViewModels;

namespace VerseSketch.Backend.Controllers;
[ApiController]
[Route("/api/[controller]/[action]")]
public class RoomController:ControllerBase
{
    private readonly RoomsRepository _roomsRepository;
    public RoomController(RoomsRepository roomsRepository)
    {
        _roomsRepository = roomsRepository;
    }
    [HttpGet("")]
    public async Task<IActionResult> GetRooms()
    {
        return Ok(new {message = "Room List"});
    }
    
    // [HttpGet("")]
    // public async Task<IActionResult> GetRoom([FromQuery] string id)
    // {
    //     Room? room = await _roomsRepository.GetRoomAsyncRO(id);
    //     if (room == null)
    //         return NotFound(new {message = $"Room with {id} is not found"});
    //     return Ok(new {room});
    // }

    [HttpGet("")]
    public async Task<IActionResult> GetRoom([FromQuery] string title)
    {
        Room? room = await _roomsRepository.GetRoomByTitleAsyncRO(title);
        if (room == null)
            return NotFound(new {message = $"Room called {title} is not found"});
        return Ok(new {room});
    }
    
    [HttpPost("")]
    public async Task<IActionResult> CreateRoom([FromBody] CreateRoomViewModel model)
    {
        if (await _roomsRepository.GetRoomByTitleAsyncRO(model.Title) != null)
            ModelState.AddModelError("Title", "Title already exists");
        if (!ModelState.IsValid)
            return BadRequest(ModelState);
        Player admin = new Player()
        {
            Id = Guid.NewGuid().ToString(),
        };
        Room room = new Room()
        {
            Id = Guid.NewGuid().ToString(),
            Title = model.Title,
            PlayersCount = 0,
            MaxPlayerCount = model.MaxPlayersCount,
            AdminId = admin.Id,
            isPublic = model.IsPublic,
            TimeToDraw = 10
        };
        admin.RoomId = room.Id;
        await _roomsRepository.CreateRoomAsync(room);
        bool res=await _roomsRepository.SaveChangesAsync();
        if (!res)
            return StatusCode(500, new {message = "Something went wrong, please try again later."});
        return Ok(new {id=room.Id});
    }
}
//TODO player&room logic: when user creates game, server creates a player instance for him and user enters his name on the join page
// so join action should check through tokens or sum shit, whether player instance for current user already exists
//TODO SignalR for live updating the room page (new player joined/left, change of parameters) 
//TODO search functionality with cancellation tokens, so we can eliminate redundant requests to db
//TODO partial return for search (return 8 entries, then 8 more on scroll for default and search)
//TODO SignalR for search for fast data exchange
//TODO player nickname validation
//TODO authentication tokens or smth
//TODO join link
//TODO SignalR for nickname and title validation?