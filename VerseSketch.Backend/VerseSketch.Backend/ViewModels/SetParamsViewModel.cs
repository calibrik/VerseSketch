using System.ComponentModel.DataAnnotations;

namespace VerseSketch.Backend.ViewModels;

public class SetParamsViewModel
{
    [Range(2,10,ErrorMessage = "Max Players Count must be between 2 and 10")]
    public int? MaxPlayersCount { get; set; }
    [Range(10,60,ErrorMessage = "Time To Draw must be between 10 and 60")]
    public int? TimeToDraw { get; set; }
    public bool? IsPublic { get; set; }
    [Required(ErrorMessage = "Room Title is required")]
    public string RoomTitle { get; set; }
}