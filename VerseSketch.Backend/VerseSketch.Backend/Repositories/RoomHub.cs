using Microsoft.AspNetCore.SignalR;
using VerseSketch.Backend.ViewModels;

namespace VerseSketch.Backend.Repositories;

public interface IRoomHub
{
    
}

public class RoomHub:Hub<IRoomHub>
{
    public override async Task OnConnectedAsync()
    {
        // await Clients.All.SendAsync("ReceiveMessage");
    }
}