using Microsoft.AspNetCore.Mvc;

namespace VerseSketch.Backend.Controllers;
[ApiController]
[Route("/api/[controller]/[action]")]
public class RoomController:ControllerBase
{
    public RoomController()
    {
        
    }
    [HttpGet("")]
    public async Task<IActionResult> GetRooms()
    {
        return Ok(new {message = "Room List"});
    }
    
    [HttpGet("")]
    public async Task<IActionResult> GetRoom([FromQuery] string id)
    {
        return Ok(new {message = $"Room with id {id}"});
    }
}