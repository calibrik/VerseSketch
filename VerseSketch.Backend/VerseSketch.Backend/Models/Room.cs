
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace VerseSketch.Backend.Models;

public class Room
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string _Id { get; set; }
    [BsonElement("title")]
    public required string Title { get; set; }
    [BsonElement("playersCount")]
    public required int PlayersCount { get; set; }
    [BsonElement("maxPlayersCount")]
    public required int MaxPlayersCount { get; set; }
    [BsonElement("timeToDraw")]
    public required int TimeToDraw { get; set; }
    [BsonElement("isPublic")]
    public required bool IsPublic { get; set; }
    [BsonElement("adminId")]
    public required string AdminId { get; set; }
    [BsonElement("currentJoinToken")]
    public string? CurrentJoinToken { get; set; }
    [BsonElement("stage")] 
    public int Stage { get; set; }
    [BsonElement("roomId")] 
    public int RandomOrderSeed { get; set; }
}