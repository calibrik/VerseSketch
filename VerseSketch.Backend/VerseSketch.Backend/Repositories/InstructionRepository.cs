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

    public async Task<InstructionLyrics> GetLyricsIndexesToDrawForStageAsync(string playerId, int stage)
    {
        return await _instructions.Find(i=>i.PlayerId==playerId).Project(i=>i.LyricsIndexesToDraw[stage-1]).FirstOrDefaultAsync();
    }

    public async Task DeleteRoomsInstructions(string roomTitle)
    {
        await _instructions.DeleteManyAsync(i=>i.RoomTitle==roomTitle);
    }
}