using Microsoft.Extensions.Options;
using MongoDB.Driver;
using VerseSketch.Backend.Models;

namespace VerseSketch.Backend.Repositories;

public class InstructionRepository
{
    private readonly IMongoCollection<Instruction> _instructions;
    private readonly RoomsRepository _roomsRepository;

    public InstructionRepository(IOptions<MongoDBSettings> settings,IMongoClient mongoClient,RoomsRepository roomsRepository)
    {
        _instructions=mongoClient.GetDatabase(settings.Value.DatabaseName).GetCollection<Instruction>("instructions");
        _roomsRepository = roomsRepository;
    }

    public async Task CreateManyAsync(List<Instruction> instructions)
    {
        await _instructions.InsertManyAsync(instructions);
    }

    public async Task<List<string>> GetLyricsToDrawForStageAsync(string playerId, int stage)
    {
        return await _instructions.Find(i=>i.PlayerId==playerId).Project(i=>i.LyrycsToDraw[stage]).FirstOrDefaultAsync();
    }

    public async Task DeleteManyAsync(HashSet<string> playerIds)
    {
        await _instructions.DeleteManyAsync(i => playerIds.Contains(i.PlayerId));
    }
}