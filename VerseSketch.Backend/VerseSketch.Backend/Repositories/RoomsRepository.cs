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
    public async Task<Room?> GetRoomAsyncRO(string roomTitle)
    {
        return await _dbContext.Rooms.AsNoTracking().Include(r=>r.Players).FirstOrDefaultAsync(r=>r.Title==roomTitle);
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