﻿using System.Linq.Expressions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using VerseSketch.Backend.Models;

namespace VerseSketch.Backend.Repositories;

public class RoomsRepository
{
    private readonly IMongoCollection<Room> _rooms;
    private readonly IMongoCollection<Player> _players;
    private readonly IMongoCollection<Storyline> _storylines;
    private readonly IMongoCollection<Instruction> _instructions;
    
    public RoomsRepository(IOptions<MongoDBSettings> settings,IMongoClient mongoClient)
    {
        _rooms=mongoClient.GetDatabase(settings.Value.DatabaseName).GetCollection<Room>("rooms");
        _players=mongoClient.GetDatabase(settings.Value.DatabaseName).GetCollection<Player>("players");
        _storylines=mongoClient.GetDatabase(settings.Value.DatabaseName).GetCollection<Storyline>("storylines");
        _instructions=mongoClient.GetDatabase(settings.Value.DatabaseName).GetCollection<Instruction>("instructions");
    }

    public async Task CreateRoomAsync(Room room)
    {
        await _rooms.InsertOneAsync(room);
    }
    
    public async Task<bool> IsJoinTokenValid(string token, string title, CancellationToken ct)
    {
        return await _rooms.Find(room => room.Title == title&&room.CurrentJoinToken==token).SingleOrDefaultAsync(ct) != null;
    }
    public async Task<Room?> GetRoomAsync(string roomTitle,CancellationToken ct=default)
    {
        return await _rooms.Find(r=>r.Title==roomTitle).SingleOrDefaultAsync(ct);
    }

    public async Task<List<Room>> SearchRoomsAsync(int page, int pageSize,string roomTitle="",CancellationToken cancelToken=default)
    {
        return await _rooms.Find(r => r.IsPublic && r.Title.Contains(roomTitle) && r.PlayersCount>0 && r.Stage==-1).SortBy(r=>r.Title).Skip(page * pageSize).Limit(pageSize).ToListAsync(cancelToken);
    }

    public async Task IncrementPlayersCountAsync(string roomTitle,int amount)
    {
        UpdateDefinition<Room> update = Builders<Room>.Update.Inc(r=>r.PlayersCount,amount);
        await _rooms.UpdateOneAsync(r=>r.Title==roomTitle,update);
    }

    public async Task UpdateRoomAsync(string roomTitle,UpdateDefinition<Room> update)
    {
        await _rooms.UpdateOneAsync(r=>r.Title==roomTitle,update);
    }

    public async Task<Room?> GetRoomByAdminId(string adminId)
    {
        return await _rooms.Find(r=>r.AdminId==adminId).SingleOrDefaultAsync();
    }

    public async Task DeleteRoomAsync(string roomTitle)
    {
        await _rooms.DeleteOneAsync(r=>r.Title==roomTitle);
        await _players.DeleteManyAsync(p=>p.RoomTitle==roomTitle);
        await _storylines.DeleteManyAsync(r=>r.RoomTitle==roomTitle);
        await _instructions.DeleteManyAsync(r=>r.RoomTitle==roomTitle);
    }
}