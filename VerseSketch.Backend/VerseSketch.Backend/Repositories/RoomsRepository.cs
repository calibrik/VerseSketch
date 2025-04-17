using Microsoft.EntityFrameworkCore;
using VerseSketch.Backend.Models;

namespace VerseSketch.Backend.Repositories;

public class RoomsRepository
{
    private readonly VerseSketchDbContext _dbContext;
    public RoomsRepository(VerseSketchDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task CreateRoomAsync(Room room)
    {
        await _dbContext.Rooms.AddAsync(room);
    }

    public async Task<Room?> GetRoomAsync(string roomTitle)
    {
        return await _dbContext.Rooms.FindAsync(roomTitle);
    }

    public async Task<bool> IsTokenValid(string token, string title)
    {
        return await _dbContext.Rooms.AsNoTracking().Where(room => room.Title == title&&room.CurrentJoinToken==token).FirstOrDefaultAsync() != null;
    }
    public async Task<Room?> GetRoomAsyncRO(string roomTitle,bool withPlayers,CancellationToken ct=default)
    {
        if (withPlayers)
            return await _dbContext.Rooms.AsNoTracking().Include(r=>r.Players.OrderBy(p=>p.CreatedTime)).FirstOrDefaultAsync(r=>r.Title==roomTitle,ct);
        return await _dbContext.Rooms.AsNoTracking().FirstOrDefaultAsync(r=>r.Title==roomTitle,ct);
    }

    public async Task<Room?> GetPlayersRoomAsyncRO(string playerId)
    {
        Player? player=await _dbContext.Players.AsNoTracking().FirstOrDefaultAsync(p=>p.Id==playerId);
        if (player == null)
            return null;
        return await _dbContext.Rooms.AsNoTracking().Include(r=>r.Players).FirstOrDefaultAsync(r=>r.Title==player.RoomTitle);
    }

    public async Task<List<Player>> GetPlayersInRoomAsyncRO(string roomTitle)
    {
        return await _dbContext.Players.AsNoTracking().Where(p=>p.RoomTitle==roomTitle).OrderBy(p=>p.CreatedTime).ToListAsync();
    }

    public async Task<List<Room>> SearchRoomsAsync(int page, int pageSize,string roomTitle="",CancellationToken cancelToken=default)
    {
        // await Task.Delay(5000,cancelToken);
        return await _dbContext.Rooms.AsNoTracking().Where(r => r.isPublic && r.Title.Contains(roomTitle)).Skip(page * pageSize).Take(pageSize).ToListAsync(cancelToken);
    }
    
    public async Task<bool> SaveChangesAsync()
    {
        try
        {
            return await _dbContext.SaveChangesAsync() > 0;
        }
        catch (Exception ex)
        {
            return false;
        }
    }
}