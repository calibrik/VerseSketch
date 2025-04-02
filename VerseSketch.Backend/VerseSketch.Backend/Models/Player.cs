namespace VerseSketch.Backend.Models;

public class Player
{
    public required string Id { get; set; }
    public required string Nickname { get; set; }
    public required string RoomId { get; set; }
    
    public Room? Room { get; set; }
}