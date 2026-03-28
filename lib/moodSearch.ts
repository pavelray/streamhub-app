import Groq from "groq-sdk";
import { MoodResult } from "@/types";

const MOVIE_GENRE_MAP: Record<string, number> = {
  Action: 28, Adventure: 12, Animation: 16, Comedy: 35, Crime: 80,
  Documentary: 99, Drama: 18, Family: 10751, Fantasy: 14, History: 36,
  Horror: 27, Music: 10402, Mystery: 9648, Romance: 10749,
  "Science Fiction": 878, Thriller: 53, War: 10752, Western: 37,
};

const TV_GENRE_MAP: Record<string, number> = {
  "Action & Adventure": 10759, Animation: 16, Comedy: 35, Crime: 80,
  Documentary: 99, Drama: 18, Family: 10751, Kids: 10762, Mystery: 9648,
  Reality: 10764, "Sci-Fi & Fantasy": 10765, Soap: 10766,
  "War & Politics": 10768, Western: 37,
};

const SYSTEM_PROMPT = `You are a movie and TV show recommendation assistant. 
Given a user's mood or vibe description, return a JSON object with filter parameters to find matching content on TMDB.

You MUST respond with ONLY a valid JSON object, no markdown, no explanation — just raw JSON.

JSON schema:
{
  "type": "movie" | "tv",
  "genreName": string (one of the exact genre names listed below),
  "sortBy": "popularity.desc" | "vote_average.desc" | "release_date.desc" | "vote_count.desc",
  "minRating": number (0-8, use 0 for no filter, 7 for critically acclaimed, 6 for good),
  "moodLabel": string (2-4 word emoji+text label summarizing the mood, e.g. "😂 Feel-Good Fun"),
  "description": string (one sentence explaining your recommendations)
}

Movie genres: Action, Adventure, Animation, Comedy, Crime, Documentary, Drama, Family, Fantasy, History, Horror, Music, Mystery, Romance, Science Fiction, Thriller, War, Western

TV genres: Action & Adventure, Animation, Comedy, Crime, Documentary, Drama, Family, Kids, Mystery, Reality, Sci-Fi & Fantasy, Soap, War & Politics, Western

Guidelines:
- "cozy", "comfort", "rainy day", "feel good" → Comedy or Drama, minRating 6
- "scary", "terrified", "nightmare", "horror" → Horror, minRating 6
- "action", "adrenaline", "explosions", "fight" → Action, minRating 6
- "romantic", "date night", "love" → Romance, minRating 7
- "mind-bending", "twist", "plot twist", "clever" → Thriller or Mystery, minRating 7
- "laugh", "funny", "comedy" → Comedy, minRating 6
- "epic", "adventure", "journey" → Adventure or Fantasy, popularity.desc
- "sad", "cry", "emotional", "deep" → Drama, minRating 7
- "sci-fi", "space", "future", "robots" → Science Fiction, minRating 6
- "kids", "family", "children" → Family or Animation, type: movie
- "documentary", "real", "true story" → Documentary, minRating 7
- For vague/general moods, default to popularity.desc, minRating 6`;

export async function getMoodRecommendation(mood: string): Promise<MoodResult & { genreId?: number }> {
  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY ?? "";
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured");
  }

  const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `My mood: "${mood.trim()}"` },
    ],
    temperature: 0.4,
    max_tokens: 256,
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content ?? "{}";
  const result = JSON.parse(content) as MoodResult;

  const genreMap = result.type === "movie" ? MOVIE_GENRE_MAP : TV_GENRE_MAP;
  const genreId = genreMap[result.genreName];

  return { ...result, genreId };
}
