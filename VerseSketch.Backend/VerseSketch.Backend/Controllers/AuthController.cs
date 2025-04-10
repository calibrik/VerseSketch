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

    
}