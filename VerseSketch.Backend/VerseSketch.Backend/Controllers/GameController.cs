using Microsoft.AspNetCore.Mvc;
using VerseSketch.Backend.Models;
using VerseSketch.Backend.Repositories;

namespace VerseSketch.Backend.Controllers;

[ApiController]
public class GameController:ControllerBase
{
    private RoomsRepository _roomsRepository;
    private InstructionRepository _instructionRepository;
    private StorylineRepository _storylineRepository;
    private PlayerRepository _playerRepository;

    public GameController(RoomsRepository roomsRepository, InstructionRepository instructionRepository,
        StorylineRepository storylineRepository, PlayerRepository playerRepository)
    {
        _roomsRepository = roomsRepository;
        _instructionRepository = instructionRepository;
        _storylineRepository = storylineRepository;
        _playerRepository = playerRepository;
    }

    [HttpGet("/api/game/getLinesAmount")]
    public async Task<IActionResult> GetLinesAmount()
    {
        if (!User.Identity.IsAuthenticated)
            return Unauthorized(new { message = $"You are not part of this game." });
        Player? player = await _playerRepository.GetPlayerAsync(User.FindFirst("PlayerId").Value);
        Room? room = await _roomsRepository.GetRoomAsync(player.RoomTitle);
        if (room == null)
            return Unauthorized(new { message = $"Room not found." });
        if (room.Stage != 0)
            return Unauthorized(new { message = $"Game is not in the right stage for this request." });
        return Ok(new { linesAmount = room.PlayersCount });
    }
    
    
    
}