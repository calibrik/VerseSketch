using VerseSketch.Backend.Models;

namespace VerseSketch.Backend.ViewModels;

public class StorylineImageViewModel
{
    public List<string> Lyrics { get; set; }
    public string byPlayerId { get; set; }
    public ImageLine[]? Image { get; set; }
}