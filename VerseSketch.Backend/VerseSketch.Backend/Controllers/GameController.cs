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
        Lyrics lyrics = await _instructionRepository.GetLyricsToDrawForStageAsync(player._Id, room.Stage);
        return Ok(new { lyrics = lyrics });
    }

    [HttpGet("/api/game/getPlayersStoryline")]
    public async Task<IActionResult> GetPlayersStoryline([FromQuery] string playerId)
    {
        if (!User.Identity.IsAuthenticated)
            return Unauthorized(new { message = $"You are not part of this game." });
        Player? player = await _playerRepository.GetPlayerAsync(User.FindFirst("PlayerId").Value);
        Room? room = await _roomsRepository.GetRoomAsync(player.RoomTitle);
        if (room == null)
            return Unauthorized(new { message = $"Room not found." });
        if (room.Stage < 1)
            return Unauthorized(new { message = $"Invalid request." });

        return Ok(new { lyricImages = await _storylineRepository.GetPlayersStoryline(playerId) });
    }

    [HttpGet("/api/game/getAudio")]
    public async Task<IActionResult> GetAudio(string text)
    {
        if (!User.Identity.IsAuthenticated)
            return Unauthorized(new { message = $"You are not part of this game." });
        try
        {
            using var synth = new SpeechSynthesizer();
            using var stream = new MemoryStream();
            synth.SetOutputToWaveStream(stream);
            synth.Rate = 2;
            synth.Speak(text);
            stream.Position = 0;
            return File(stream.ToArray(), "audio/wav");
        }
        catch (Exception e)
        {
            return StatusCode(500,new {message = "Something went wrong while creating audio."});
        }
    }
}