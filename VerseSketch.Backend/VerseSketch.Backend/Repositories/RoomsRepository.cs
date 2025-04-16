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
    public async Task<Room?> GetRoomAsyncRO(string roomTitle,bool withPlayers)
    {
        if (withPlayers)
            return await _dbContext.Rooms.AsNoTracking().Include(r=>r.Players).FirstOrDefaultAsync(r=>r.Title==roomTitle);
        return await _dbContext.Rooms.AsNoTracking().FirstOrDefaultAsync(r=>r.Title==roomTitle);
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
        return await _dbContext.Players.AsNoTracking().Where(p=>p.RoomTitle==roomTitle).ToListAsync();
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