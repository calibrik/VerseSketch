using System.ComponentModel.DataAnnotations;

namespace VerseSketch.Backend.ViewModels;

public class CreateRoomViewModel
{   
    [Required(ErrorMessage = "Room name is required")]
    [StringLength(40, ErrorMessage = "Room Name must be between 5 and 50 characters long")]
    public string Title { get; set; }
    [Required(ErrorMessage = "Max players count is required")]
    [Range(2,10,ErrorMessage = "Max players count must be between 2 and 10")]
    public int MaxPlayersCount { get; set; }
    [Required(ErrorMessage = "Is Public is required")]
    public bool IsPublic { get; set; }
}