using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace VerseSketch.Backend.Models;

public struct Point
{
    [BsonElement("x")]
    public double x { get; set; }
    [BsonElement("y")]
    public double y { get; set; }
}

public struct ImageLine
{
    [BsonElement("tool")]
    public string Tool { get; set; }
    [BsonElement("brushSize")]
    public int BrushSize { get; set; }
    [BsonElement("color")]
    public string Color { get; set; }
    [BsonElement("points")]
    public Point[] Points { get; set; }
}

public struct LyricsImage
{
    [BsonElement("lyrics")]
    public List<string> Lyrics { get; set; }
    [BsonElement("image")]
    public ImageLine[] Image { get; set; }
    [BsonElement("playerId")]
    public string ByPlayerId { get; set; }
}

public class Storyline
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string _Id { get; set; }
    [BsonElement("playerId")]
    public required string PlayerId { get; set; }
    [BsonElement("images")]
    public List<LyricsImage> Images { get; set; }
    [BsonElement("roomTitle")]
    public required string RoomTitle { get; set; }
}