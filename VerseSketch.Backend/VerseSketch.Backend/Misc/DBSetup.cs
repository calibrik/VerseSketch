using System.Linq.Expressions;
using Microsoft.Extensions.Options;
using MongoDB.Bson;
using MongoDB.Driver;
using VerseSketch.Backend.Models;

namespace VerseSketch.Backend.Misc;

public static class DBSetup
{
    static CreateIndexModel<T> CreateIndexOn<T>(List<Expression<Func<T, object>>> fields,CreateIndexOptions? options=null)
    {
        IndexKeysDefinition<T> indexKeys = Builders<T>.IndexKeys.Ascending(fields[0]);
        for (int i=1; i<fields.Count; i++)
            indexKeys = indexKeys.Ascending(fields[i]);
        return new CreateIndexModel<T>(indexKeys, options);
    }
    static CreateIndexModel<T> CreateIndexOn<T>(Expression<Func<T, object>> field,CreateIndexOptions? options=null)
    {
        IndexKeysDefinition<T> indexKeys=Builders<T>.IndexKeys.Ascending(field);
        return new CreateIndexModel<T>(indexKeys, options);
    }
    public static async Task InitializeIndexes(IMongoClient client, IOptions<MongoDBSettings> settings)
    {
        IMongoCollection<Player> players = client.GetDatabase(settings.Value.DatabaseName).GetCollection<Player>("players");
        IMongoCollection<Room> rooms = client.GetDatabase(settings.Value.DatabaseName).GetCollection<Room>("rooms");
        await rooms.Indexes.CreateOneAsync(CreateIndexOn<Room>(r=>r.Title,new  CreateIndexOptions { Unique = true }));
        List<CreateIndexModel<Player>> playerIndexes=
        [
            CreateIndexOn<Player>([p => p.RoomTitle, p => p.Nickname], new CreateIndexOptions { Unique = true }),
            CreateIndexOn<Player>(p => p.CreatedTime)
        ];
        await players.Indexes.CreateManyAsync(playerIndexes);
        IMongoCollection<Instruction> instructions = client.GetDatabase(settings.Value.DatabaseName).GetCollection<Instruction>("instructions");
        await instructions.Indexes.CreateOneAsync(CreateIndexOn<Instruction>(i=>i.PlayerId,new CreateIndexOptions { Unique = true }));
        IMongoCollection<Storyline> storylines = client.GetDatabase(settings.Value.DatabaseName).GetCollection<Storyline>("storylines");
        await storylines.Indexes.CreateOneAsync(CreateIndexOn<Storyline>(s=>s.PlayerId,new CreateIndexOptions { Unique = true }));
    }
}