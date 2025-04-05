using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
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
        Player? player = await _playerRepository.GetPlayerAsync(model.PlayerId);
        if (model.PlayerId != null&& player == null)
            ModelState.AddModelError("PlayerId", $"Player instance {model.PlayerId} is not found");
        if (await _roomsRepository.GetRoomAsync(model.RoomId) == null)
            ModelState.AddModelError("RoomId", "Room you trying to join doesn't exist");
        else if (await _playerRepository.GetPlayerByNicknameInRoomAsyncRO(model.Nickname,model.RoomId) != null)
            ModelState.AddModelError("Nickname", "Nickname already exists in this room.");
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (model.PlayerId == null)
        {
            player = new Player()
            {
                Id = Guid.NewGuid().ToString(),
            };
            await _playerRepository.CreatePlayer(player);
        }
        string? issuer=_configuration["JwtConfig:Issuer"];
        string? audience=_configuration["JwtConfig:Audience"];
        string? key=_configuration["JwtConfig:Key"];
        SecurityTokenDescriptor tokenDescriptor = new SecurityTokenDescriptor()
        {
            Subject = new ClaimsIdentity([
                new Claim(JwtRegisteredClaimNames.Name, model.Nickname)
            ]),
            Issuer = issuer,
            Audience = audience,
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(Encoding.ASCII.GetBytes(key)),
                SecurityAlgorithms.HmacSha256Signature)
        };
        JwtSecurityTokenHandler tokenHandler = new JwtSecurityTokenHandler();
        SecurityToken securityToken=tokenHandler.CreateToken(tokenDescriptor);
        string accessToken=tokenHandler.WriteToken(securityToken);

        player.Nickname = model.Nickname;
        player.RoomId = model.RoomId;
        await _playerRepository.SaveChangesAsync();
        return Ok(new { access_token = accessToken });
    }
}