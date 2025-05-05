namespace VerseSketch.Backend.Models;

public class Player
{
    public required string Id { get; set; }
    public string? Nickname { get; set; }
    public string? RoomTitle { get; set; }
    public required DateTime CreatedTime { get; set; }
    public string? ConnectionID { get; set; }
    
    public Room? Room { get; set; }
}