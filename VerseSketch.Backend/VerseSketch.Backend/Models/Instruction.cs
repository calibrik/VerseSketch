using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace VerseSketch.Backend.Models;

public struct Lyrics
{
    [BsonElement("fromPlayerId")]
    public string FromPlayerId { get; set; }
    [BsonElement("lines")]
    public List<string> Lines { get; set; }
}
public class Instruction
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string _Id { get; set; }
    [BsonElement("playerId")]
    public string PlayerId { get; set; }
    [BsonElement("lyricsToDraw")]
    public List<Lyrics> LyrycsToDraw { get; set; }
}