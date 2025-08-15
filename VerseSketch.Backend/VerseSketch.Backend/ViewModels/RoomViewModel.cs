

namespace VerseSketch.Backend.ViewModels;

public class RoomViewModel
{
    public string Title { get; set; }
    public int PlayingPlayersCount { get; set; }
    public int ActualPlayersCount { get; set; }
    public int MaxPlayersCount { get; set; }
    public int TimeToDraw { get; set; }
    public bool isPublic { get; set; }
    public bool isPlayerAdmin { get; set; }
    public string PlayerId { get; set; }
    public int Stage { get; set; }
    public int CurrDone { get; set; }

    public List<PlayerViewModel> Players { get; set; } = new();
}