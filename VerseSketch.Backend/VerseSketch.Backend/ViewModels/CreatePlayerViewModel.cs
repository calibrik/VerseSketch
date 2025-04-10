using System.ComponentModel.DataAnnotations;

namespace VerseSketch.Backend.ViewModels;

public class CreatePlayerViewModel
{
    [Required(ErrorMessage = "Nickname is required")]
    [StringLength(30, ErrorMessage = "Nickname cannot be longer than 30 characters!")]
    public string Nickname { get; set; }
    [Required(ErrorMessage = "RoomTitle is required")]
    public string RoomTitle { get; set; }
    
}