﻿using Microsoft.Extensions.Options;
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

    public async Task UpdateImage(LyricsImage image,int stage,string forPlayerId)
    {
        UpdateDefinition<Storyline> update = Builders<Storyline>.Update.Set(s => s.Images[stage-1], image);

        await _storylines.UpdateOneAsync(s=>s.PlayerId==forPlayerId,update);

    }
}