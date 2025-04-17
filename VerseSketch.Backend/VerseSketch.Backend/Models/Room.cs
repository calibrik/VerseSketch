
namespace VerseSketch.Backend.Models;

public class Room
{
    public required string Title { get; set; }
    // public required string Id { get; set; }
    public required int PlayersCount { get; set; }
    public required int MaxPlayersCount { get; set; }
    public required int TimeToDraw { get; set; }
    public required bool isPublic { get; set; }
    public required string AdminId { get; set; }
    
    public required string CurrentJoinToken { get; set; }

    public Player? Admin { get; set; }
    public List<Player> Players { get; set; } = new();
    
}