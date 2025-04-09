using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using VerseSketch.Backend.Misc;
using VerseSketch.Backend.Models;
using VerseSketch.Backend.Repositories;
using VerseSketch.Backend.ViewModels;

namespace VerseSketch.Backend.Controllers;
[ApiController]
[Route("[controller]/[action]")]
public class AuthController:ControllerBase
{
    private readonly PlayerRepository _playerRepository;
    private readonly IConfiguration _configuration;
    private readonly RoomsRepository _roomsRepository;

    public AuthController(PlayerRepository playerRepository, IConfiguration configuration, RoomsRepository roomsRepository)
    {
        _playerRepository = playerRepository;
        _configuration = configuration;
        _roomsRepository = roomsRepository;
    }

    [HttpPost("")]
    public async Task<IActionResult> JoinRoom([FromBody] CreatePlayerViewModel model)
    {
        Player? player=null;
        Room? room = await _roomsRepository.GetRoomAsync(model.RoomName);
        if (room == null)
            ModelState.AddModelError("RoomName", "Room you trying to join doesn't exist");
        if (User.Identity.IsAuthenticated)
        {
            string? playerId=User.FindFirst("PlayerId")?.Value;
            if (playerId == null)
                ModelState.AddModelError("PlayerId", "Invalid access token");
            else
            {
                player = await _playerRepository.GetPlayerAsync(playerId);
                if (player == null)
                    ModelState.AddModelError("PlayerId", $"Player instance {playerId} is not found");
            }
        }
        else if (room!=null&&await _playerRepository.GetPlayerByNicknameInRoomAsyncRO(model.Nickname, model.RoomName) != null)
            ModelState.AddModelError("Nickname", "Nickname already exists in this room.");
        if (room!=null&&player!=null&&room.AdminId!=player.Id)
            ModelState.AddModelError("PlayerId", "Only creator of the room is allowed to join.");
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

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
        player.RoomId = model.RoomName;
        await _playerRepository.SaveChangesAsync();
        return Ok(new { access_token = accessToken });
    }
}