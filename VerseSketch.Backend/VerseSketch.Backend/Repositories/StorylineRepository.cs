using Microsoft.Extensions.Options;
using MongoDB.Driver;
using MongoDB.Driver.Linq;
using VerseSketch.Backend.Models;

namespace VerseSketch.Backend.Repositories;

public class StorylineRepository
{
    private readonly IMongoCollection<Storyline> _storylines;

    public StorylineRepository(IOptions<MongoDBSettings> settings,IMongoClient mongoClient)
    {
        _storylines=mongoClient.GetDatabase(settings.Value.DatabaseName).GetCollection<Storyline>("storylines");
    }

    public async Task CreateManyAsync(List<Storyline> storylines)
    {
        await _storylines.InsertManyAsync(storylines);
    }

    public async Task CreateAsync(Storyline storyline)
    {
        await _storylines.InsertOneAsync(storyline);
    }

    public async Task UpdateImage(LyricsImage image,int stage,string forPlayerId)
    {
        UpdateDefinition<Storyline> update = Builders<Storyline>.Update.Set(s => s.Images[stage-1], image);
        await _storylines.UpdateOneAsync(s=>s.PlayerId==forPlayerId,update);
    }

    public async Task<List<LyricsImage>> GetPlayersStoryline(string playerId)
    {
        return await _storylines.Find(s => s.PlayerId==playerId).Project(s=>s.Images).FirstOrDefaultAsync();
    }

    public async Task DeleteRoomsStorylines(string roomTitle)
    {
        await _storylines.DeleteManyAsync(s=>s.RoomTitle==roomTitle);
    }
}