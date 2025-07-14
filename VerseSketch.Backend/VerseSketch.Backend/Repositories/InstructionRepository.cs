using Microsoft.Extensions.Options;
using MongoDB.Driver;
using VerseSketch.Backend.Models;

namespace VerseSketch.Backend.Repositories;

public class InstructionRepository
{
    private readonly IMongoCollection<Instruction> _instructions;

    public InstructionRepository(IOptions<MongoDBSettings> settings,IMongoClient mongoClient)
    {
        _instructions=mongoClient.GetDatabase(settings.Value.DatabaseName).GetCollection<Instruction>("instructions");
    }

    public async Task CreateManyAsync(List<Instruction> instructions)
    {
        await _instructions.InsertManyAsync(instructions);
    }

    public async Task<Lyrics> GetLyricsToDrawForStageAsync(string playerId, int stage)
    {
        return await _instructions.Find(i=>i.PlayerId==playerId).Project(i=>i.LyrycsToDraw[stage-1]).FirstOrDefaultAsync();
    }

    public async Task UpdatePlayersLyricsAsync(string playerId, Lyrics lyrics, int pos)
    {
        UpdateDefinition<Instruction> update = Builders<Instruction>.Update.Set(i => i.LyrycsToDraw[pos], lyrics);
        await _instructions.UpdateOneAsync(i => i.PlayerId == playerId, update);
    }

    public async Task DeleteManyAsync(HashSet<string> playerIds)
    {
        await _instructions.DeleteManyAsync(i => playerIds.Contains(i.PlayerId));
    }
}