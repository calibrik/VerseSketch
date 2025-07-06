namespace VerseSketch.Backend.Misc;

public static class Utils
{
    public static void Shuffle<T>(this List<T> list,int seed)
    {
        Random rng = new Random(seed);
        int n = list.Count;
        for (int i = 0; i < n; i++)
        {
            int r = rng.Next(n);
            (list[r], list[i]) = (list[i], list[r]);
        }
    }
}