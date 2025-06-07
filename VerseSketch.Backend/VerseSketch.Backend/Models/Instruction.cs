using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace VerseSketch.Backend.Models;


public class Instruction
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string _Id { get; set; }
    [BsonElement("playerId")]
    public string PlayerId { get; set; }
    [BsonElement("lyricsToDraw")]
    public List<List<string>> LyrycsToDraw { get; set; }
}