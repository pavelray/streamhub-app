import {
  TrendingResponse,
  MovieDetails,
  TVDetails,
  PersonDetails,
  SearchResponse,
  DiscoverFilters,
} from "@/types";

const BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = process.env.EXPO_PUBLIC_TMDB_API_KEY ?? "";
export const IMG_BASE = "https://image.tmdb.org/t/p";

if (!API_KEY) {
  console.warn("[TMDB] EXPO_PUBLIC_TMDB_API_KEY is not set");
}

async function tmdbFetch<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  url.searchParams.set("api_key", API_KEY);
  if (params) {
    for (const [key, val] of Object.entries(params)) {
      if (val !== undefined && val !== null && val !== "") {
        url.searchParams.set(key, val);
      }
    }
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`TMDB fetch failed: ${res.status} ${endpoint}`);
  }
  return res.json() as Promise<T>;
}

// ─── Image URLs ───────────────────────────────────────────────────────────────

export function posterUrl(path: string | null | undefined, size: "w200" | "w400" | "w500" | "original" = "w400"): string {
  if (!path) return "";
  return `${IMG_BASE}/${size}${path}`;
}

export function backdropUrl(path: string | null | undefined, size: "w780" | "w1280" | "original" = "w1280"): string {
  if (!path) return "";
  return `${IMG_BASE}/${size}${path}`;
}

// ─── Trending ────────────────────────────────────────────────────────────────

export async function getTrending(
  type: "movie" | "tv" | "person" | "all",
  window: "day" | "week" = "week"
): Promise<TrendingResponse> {
  return tmdbFetch<TrendingResponse>(`/trending/${type}/${window}`);
}

// ─── Movies ───────────────────────────────────────────────────────────────────

export async function getMovies(
  category: "popular" | "top_rated" | "now_playing" | "upcoming",
  page = 1
): Promise<TrendingResponse> {
  return tmdbFetch<TrendingResponse>(`/movie/${category}`, { page: String(page) });
}

export async function getMovieDetails(id: number): Promise<MovieDetails> {
  return tmdbFetch<MovieDetails>(`/movie/${id}`, {
    append_to_response: "videos,credits,recommendations,similar,watch/providers",
  });
}

// ─── TV ───────────────────────────────────────────────────────────────────────

export async function getTVShows(
  category: "popular" | "top_rated" | "airing_today" | "on_the_air",
  page = 1
): Promise<TrendingResponse> {
  return tmdbFetch<TrendingResponse>(`/tv/${category}`, { page: String(page) });
}

export async function getTVDetails(id: number): Promise<TVDetails> {
  return tmdbFetch<TVDetails>(`/tv/${id}`, {
    append_to_response: "videos,aggregate_credits,recommendations,similar,watch/providers",
  });
}

export async function getTVSeason(tvId: number, season: number) {
  return tmdbFetch<{
    episodes: Array<{
      id: number;
      name: string;
      overview: string;
      episode_number: number;
      still_path: string | null;
      air_date: string;
      vote_average: number;
      runtime: number | null;
    }>;
  }>(`/tv/${tvId}/season/${season}`);
}

// ─── Person ───────────────────────────────────────────────────────────────────

export async function getPersonDetails(id: number): Promise<PersonDetails> {
  return tmdbFetch<PersonDetails>(`/person/${id}`, {
    append_to_response: "combined_credits,images",
  });
}

// ─── Search ───────────────────────────────────────────────────────────────────

export async function searchMulti(query: string, page = 1): Promise<SearchResponse> {
  return tmdbFetch<SearchResponse>("/search/multi", {
    query,
    page: String(page),
    include_adult: "false",
  });
}

// ─── Discover ────────────────────────────────────────────────────────────────

export async function discover(filters: DiscoverFilters): Promise<TrendingResponse> {
  const {
    mediaType,
    genreId,
    sortBy = "popularity.desc",
    minRating,
    maxRating,
    minYear,
    maxYear,
    language,
    watchProviderId,
    minVoteCount,
    maxRuntime,
    page = 1,
  } = filters;

  const params: Record<string, string> = {
    sort_by: sortBy,
    page: String(page),
    include_adult: "false",
  };

  if (genreId) params["with_genres"] = String(genreId);
  if (minRating) params["vote_average.gte"] = String(minRating);
  if (maxRating) params["vote_average.lte"] = String(maxRating);
  if (minVoteCount) params["vote_count.gte"] = String(minVoteCount);
  if (maxRuntime) params["with_runtime.lte"] = String(maxRuntime);
  if (language) params["with_original_language"] = language;
  if (watchProviderId) {
    params["with_watch_providers"] = String(watchProviderId);
    params["watch_region"] = "US";
  }

  if (mediaType === "movie") {
    if (minYear) params["primary_release_date.gte"] = `${minYear}-01-01`;
    if (maxYear) params["primary_release_date.lte"] = `${maxYear}-12-31`;
  } else {
    if (minYear) params["first_air_date.gte"] = `${minYear}-01-01`;
    if (maxYear) params["first_air_date.lte"] = `${maxYear}-12-31`;
  }

  return tmdbFetch<TrendingResponse>(`/discover/${mediaType}`, params);
}

// ─── Genres ───────────────────────────────────────────────────────────────────

export const MOVIE_GENRES: Record<string, number> = {
  Action: 28,
  Adventure: 12,
  Animation: 16,
  Comedy: 35,
  Crime: 80,
  Documentary: 99,
  Drama: 18,
  Family: 10751,
  Fantasy: 14,
  History: 36,
  Horror: 27,
  Music: 10402,
  Mystery: 9648,
  Romance: 10749,
  "Science Fiction": 878,
  Thriller: 53,
  War: 10752,
  Western: 37,
};

export const TV_GENRES: Record<string, number> = {
  "Action & Adventure": 10759,
  Animation: 16,
  Comedy: 35,
  Crime: 80,
  Documentary: 99,
  Drama: 18,
  Family: 10751,
  Kids: 10762,
  Mystery: 9648,
  Reality: 10764,
  "Sci-Fi & Fantasy": 10765,
  Soap: 10766,
  "War & Politics": 10768,
  Western: 37,
};

export const GENRE_ID_TO_NAME: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  53: "Thriller",
  10752: "War",
  37: "Western",
  10759: "Action & Adventure",
  10762: "Kids",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10768: "War & Politics",
};

export const STREAMING_PROVIDERS = [
  { id: 8, name: "Netflix" },
  { id: 9, name: "Amazon Prime" },
  { id: 337, name: "Disney+" },
  { id: 384, name: "HBO Max" },
  { id: 15, name: "Hulu" },
  { id: 531, name: "Paramount+" },
  { id: 350, name: "Apple TV+" },
  { id: 386, name: "Peacock" },
];

export const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "ko", name: "Korean" },
  { code: "ja", name: "Japanese" },
  { code: "hi", name: "Hindi" },
  { code: "fr", name: "French" },
  { code: "es", name: "Spanish" },
  { code: "de", name: "German" },
  { code: "zh", name: "Chinese" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
];
