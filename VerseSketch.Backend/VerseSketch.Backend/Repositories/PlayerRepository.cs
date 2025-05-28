using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Driver;
using VerseSketch.Backend.Models;
using ZstdSharp.Unsafe;

namespace VerseSketch.Backend.Repositories;

public class PlayerRepository
{
    private readonly IMongoCollection<Player> _players;
    private readonly RoomsRepository _roomsRepository;

    public PlayerRepository(IOptions<MongoDBSettings> settings,IMongoClient mongoClient,RoomsRepository roomsRepository)
    {
        _players=mongoClient.GetDatabase(settings.Value.DatabaseName).GetCollection<Player>("players");
        _roomsRepository = roomsRepository;
    }

    public async Task CreatePlayerAsync(Player player)
    {
        if (player.RoomTitle!=null)
            await _roomsRepository.IncrementPlayersCountAsync(player.RoomTitle, 1);
        await _players.InsertOneAsync(player);
    }

    public async Task<Player?> GetPlayerByNicknameInRoomAsync(string nickname,string roomTitle,CancellationToken ct=default)
    {
        return await _players.Find(p => p.Nickname == nickname&&p.RoomTitle==roomTitle).FirstOrDefaultAsync(ct);
    }

    public async Task<Player?> GetPlayerAsync(string playerId)
    {
        return await _players.Find(p=>p._Id==playerId).SingleOrDefaultAsync();
    }

    public async Task DeletePlayerAsync(Player player)
    {
        Room? room = null;
        if (player.RoomTitle==null)
            room=await _roomsRepository.GetRoomByAdminId(player._Id);
        else
            room=await _roomsRepository.GetRoomAsync(player.RoomTitle);
        
        if (room != null)
        {
            if (room.AdminId == player._Id)
                await _roomsRepository.DeleteRoomAsync(room.Title);
            else
                await _roomsRepository.IncrementPlayersCountAsync(player.RoomTitle, -1);
        }
        await _players.DeleteOneAsync(p=>p._Id == player._Id);
    }

    public async Task DeletePlayerAsync(string playerId)
    {
        Player? player=await GetPlayerAsync(playerId);
        if(player==null)
            return;
        await DeletePlayerAsync(player);
    }
    public async Task<List<Player>> GetPlayersInRoomAsync(string roomTitle)
    {
        return await _players.Find(p=>p.RoomTitle==roomTitle).SortBy(p=>p.CreatedTime).ToListAsync();
    }

    public async Task UpdatePlayerAsync(Player player,UpdateDefinition<Player> update,bool isRoomTitleChanged)
    {
        if (isRoomTitleChanged)
            await _roomsRepository.IncrementPlayersCountAsync(player.RoomTitle, 1);
        await _players.UpdateOneAsync(p=>p._Id==player._Id,update);
    }
}