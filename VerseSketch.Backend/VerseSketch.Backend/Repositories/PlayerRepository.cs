﻿using Microsoft.EntityFrameworkCore;
using VerseSketch.Backend.Models;

namespace VerseSketch.Backend.Repositories;

public class PlayerRepository
{
    private readonly VerseSketchDbContext _dbContext;
    public PlayerRepository(VerseSketchDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task CreatePlayer(Player player)
    {
        await _dbContext.Players.AddAsync(player);
    }

    public async Task<Player?> GetPlayerByNicknameInRoomAsyncRO(string nickname,string roomTitle)
    {
        return await _dbContext.Players.AsNoTracking().Where(p=>p.RoomTitle==roomTitle).FirstOrDefaultAsync(p => p.Nickname == nickname);
    }

    public async Task<Player?> GetPlayerAsyncRO(string? playerId)
    {
        if (playerId == null)
            return null;
        return await _dbContext.Players.AsNoTracking().FirstOrDefaultAsync(p => p.Id == playerId);
    }
    public async Task<Player?> GetPlayerAsync(string? playerId)
    {
        if (playerId == null)
            return null;
        return await _dbContext.Players.FirstOrDefaultAsync(p => p.Id == playerId);
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