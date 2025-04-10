namespace VerseSketch.Backend.Models;

public class Player
{
    public required string Id { get; set; }
    public string? Nickname { get; set; }
    public string? RoomTitle { get; set; }
    
    public Room? Room { get; set; }
}