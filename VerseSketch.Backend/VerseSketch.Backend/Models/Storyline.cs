using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace VerseSketch.Backend.Models;

public struct LyricsImage
{
    [BsonElement("lyrics")]
    public List<string> Lyrics { get; set; }
    [BsonElement("image")]
    public string Image { get; set; }
    [BsonElement("playerId")]
    public string PlayerId { get; set; }
    [BsonElement("playerNickname")]
    public string PlayerNickname { get; set; }
}

public class Storyline
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string _Id { get; set; }
    [BsonElement("playerId")]
    public string PlayerId { get; set; }
    [BsonElement("images")]
    public List<LyricsImage> Images { get; set; }
}