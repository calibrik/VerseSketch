using System.ComponentModel.DataAnnotations;

namespace VerseSketch.Backend.ViewModels;

public class CreatePlayerViewModel
{
    [Required(ErrorMessage = "Nickname is required")]
    [StringLength(30, ErrorMessage = "Nickname must be less than 30 characters long")]
    public string Nickname { get; set; }
    [Required(ErrorMessage = "RoomId is required")]
    public string RoomId { get; set; }

    public string? PlayerId { get; set; }
    
}