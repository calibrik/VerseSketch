using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace VerseSketch.Backend.Models;

public class Player
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string _Id { get; set; }
    [BsonElement("nickname")]
    public string? Nickname { get; set; }
    [BsonElement("createdTime")]
    public required DateTime CreatedTime { get; set; }
    [BsonElement("connectionID")]
    public string? ConnectionID { get; set; }
    [BsonElement("roomTitle")]
    public string? RoomTitle { get; set; }
    [BsonElement("lyricsSubmitted")] 
    public List<string> LyricsSubmitted { get; set; }
}