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

    public async Task<Room?> GetRoomAsync(string roomId)
    {
        return await _dbContext.Rooms.FindAsync(roomId);
    }
    public async Task<Room?> GetRoomAsyncRO(string roomId)
    {
        return await _dbContext.Rooms.AsNoTracking().FirstOrDefaultAsync(r=>r.Id==roomId);
    }

    public async Task<Room?> GetRoomByTitleAsyncRO(string title)
    {
        return await _dbContext.Rooms.AsNoTracking().FirstOrDefaultAsync(r => r.Title == title);
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