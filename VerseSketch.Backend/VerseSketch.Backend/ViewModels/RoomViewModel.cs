

namespace VerseSketch.Backend.ViewModels;

public class RoomViewModel
{
    public string Title { get; set; }
    public int PlayersCount { get; set; }
    public int MaxPlayersCount { get; set; }
    public int TimeToDraw { get; set; }
    public bool isPublic { get; set; }
    public bool isPlayerAdmin { get; set; }
    public string PlayerId { get; set; }

    public List<PlayerViewModel> Players { get; set; } = new();
}