using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace VerseSketch.Backend.Models;

public struct InstructionLyrics
{
    [BsonElement("indexesToDraw")]
    public int IndexToDraw { get; set; }
    [BsonElement("fromPlayerId")]
    public string FromPlayerId { get; set; }
}

public class Instruction
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string _Id { get; set; }
    [BsonElement("playerId")]
    public required string PlayerId { get; set; }
    [BsonElement("lyricsToDraw")]
    public required List<InstructionLyrics> LyricsIndexesToDraw { get; set; }
    [BsonElement("roomTitle")]
    public required string RoomTitle { get; set; }
}