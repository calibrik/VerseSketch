using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using VerseSketch.Backend.Models;
using VerseSketch.Backend.Repositories;
using System.Speech.Synthesis;

namespace VerseSketch.Backend.Controllers;

[ApiController]
public class GameController : ControllerBase
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

    [HttpGet("/api/game/getCurrentLyricsToDraw")]
    public async Task<IActionResult> GetCurrentLyricsToDraw()
    {
        if (!User.Identity.IsAuthenticated)
            return Unauthorized(new { message = $"You are not part of this game." });
        Player? player = await _playerRepository.GetPlayerAsync(User.FindFirst("PlayerId").Value);
        Room? room = await _roomsRepository.GetRoomAsync(player.RoomTitle);
        if (room == null)
            return Unauthorized(new { message = $"Room not found." });
        if (room.Stage < 1)
            return Unauthorized(new { message = $"Invalid request." });
        InstructionLyrics instruction = await _instructionRepository.GetLyricsIndexesToDrawForStageAsync(player._Id, room.Stage);
        Lyrics? lyrics = await _playerRepository.GetSubmittedLyrics(instruction.FromPlayerId);
        return Ok(new { lines = lyrics.Value.Lines.Skip(instruction.IndexToDraw).Take(2),fromPlayerId=instruction.FromPlayerId });
    }
}