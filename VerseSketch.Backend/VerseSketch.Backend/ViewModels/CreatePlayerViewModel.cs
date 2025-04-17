using System.ComponentModel.DataAnnotations;

namespace VerseSketch.Backend.ViewModels;

public class CreatePlayerViewModel
{
    [Required(ErrorMessage = "Nickname is required")]
    [StringLength(30, ErrorMessage = "Nickname cannot be longer than 30 characters!")]
    public string Nickname { get; set; }
    public string? RoomTitle { get; set; }
    public string? JoinToken { get; set; }
}