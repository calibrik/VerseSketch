namespace VerseSketch.Backend.Models;

public class PiperService
{
    static readonly Dictionary<string, string> LangToVoice = new()
    {
        {"EN","en_US-hfc_male-medium"},
        {"RU","ru_RU-dmitri-medium"}
    };
    private readonly HttpClient _httpClient;

    public PiperService(HttpClient httpClient,IConfiguration configuration)
    {
        _httpClient = httpClient;
        _httpClient.BaseAddress = new Uri(configuration["PiperBaseString"] ?? string.Empty);
    }

    public async Task<byte[]> GetAudio(string text, string lang)
    {
        if (!LangToVoice.ContainsKey(lang))
            throw new Exception($"No voice language found for language {lang}");
        
        var response =await _httpClient.PostAsJsonAsync("",new {voice=LangToVoice[lang],length_scale=0.9f,text=text});
        if (!response.IsSuccessStatusCode)
        {
            throw new Exception($"Error getting voice data: {response.StatusCode} {response.ReasonPhrase}");
        }

        return await response.Content.ReadAsByteArrayAsync();
    }
}