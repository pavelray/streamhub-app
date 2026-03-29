// Types for TMDB API responses

// ─── Trending ────────────────────────────────────────────────────────────────

export type MediaType = "movie" | "tv" | "person";

export interface BaseTrendingItem {
  id: number;
  media_type: MediaType;
  popularity: number;
  adult?: boolean;
}

export interface TrendingMovie extends BaseTrendingItem {
  media_type: "movie";
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  genre_ids: number[];
  release_date: string;
  vote_average: number;
  vote_count: number;
}

export interface TrendingTV extends BaseTrendingItem {
  media_type: "tv";
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  genre_ids: number[];
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  origin_country: string[];
}

export interface KnownForItem {
  id: number;
  media_type: "movie" | "tv";
  title?: string;
  name?: string;
  poster_path: string | null;
  vote_average: number;
}

export interface TrendingPerson extends BaseTrendingItem {
  media_type: "person";
  name: string;
  original_name: string;
  profile_path: string | null;
  gender: number;
  known_for_department: string;
  known_for: KnownForItem[];
}

export type TrendingItem = TrendingMovie | TrendingTV | TrendingPerson;

export interface TrendingResponse {
  page: number;
  results: TrendingItem[];
  total_pages: number;
  total_results: number;
}

// ─── Movie Details ────────────────────────────────────────────────────────────

export interface Genre {
  id: number;
  name: string;
}

export interface ProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
  popularity: number;
  known_for_department: string;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: "Trailer" | "Teaser" | "Clip" | "Behind the Scenes" | "Featurette" | string;
  official: boolean;
  published_at: string;
}

export interface WatchProvider {
  logo_path: string;
  provider_id: number;
  provider_name: string;
  display_priority: number;
}

export interface WatchProviderRegion {
  flatrate?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
  link?: string;
}

export interface MovieDetails {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  tagline?: string;
  status: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  genres: Genre[];
  release_date: string;
  runtime: number;
  vote_average: number;
  vote_count: number;
  popularity: number;
  homepage?: string;
  budget?: number;
  revenue?: number;
  production_companies: ProductionCompany[];
  credits?: {
    cast: CastMember[];
    crew: CrewMember[];
  };
  videos?: { results: Video[] };
  recommendations?: { results: TrendingItem[] };
  similar?: { results: TrendingItem[] };
  "watch/providers"?: { results: Record<string, WatchProviderRegion> };
}

// ─── TV Details ───────────────────────────────────────────────────────────────

export interface TVSeason {
  id: number;
  name: string;
  overview: string;
  season_number: number;
  episode_count: number;
  air_date: string;
  poster_path: string | null;
  vote_average: number;
}

export interface TVNetwork {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface TVDetails {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  tagline?: string;
  status: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  genres: Genre[];
  first_air_date: string;
  last_air_date?: string;
  number_of_seasons: number;
  number_of_episodes: number;
  episode_run_time: number[];
  vote_average: number;
  vote_count: number;
  popularity: number;
  homepage?: string;
  in_production: boolean;
  networks: TVNetwork[];
  seasons: TVSeason[];
  aggregate_credits?: {
    cast: {
      id: number;
      name: string;
      roles: { character: string }[];
      profile_path: string | null;
      popularity: number;
      known_for_department: string;
    }[];
    crew: CrewMember[];
  };
  videos?: { results: Video[] };
  recommendations?: { results: TrendingItem[] };
  similar?: { results: TrendingItem[] };
  "watch/providers"?: { results: Record<string, WatchProviderRegion> };
}

// ─── Person Details ───────────────────────────────────────────────────────────

export interface PersonDetails {
  id: number;
  name: string;
  biography: string;
  birthday?: string;
  deathday?: string;
  gender: number;
  homepage?: string;
  imdb_id?: string;
  known_for_department: string;
  place_of_birth?: string;
  popularity: number;
  profile_path: string | null;
  combined_credits?: {
    cast: (TrendingMovie | TrendingTV)[];
    crew: (TrendingMovie | TrendingTV)[];
  };
  images?: { profiles: { file_path: string }[] };
}

// ─── Search ───────────────────────────────────────────────────────────────────

export interface SearchResponse {
  page: number;
  results: TrendingItem[];
  total_pages: number;
  total_results: number;
}

// ─── Discover ────────────────────────────────────────────────────────────────

export interface DiscoverFilters {
  mediaType: "movie" | "tv";
  genreId?: number;
  sortBy?: string;
  minRating?: number;
  maxRating?: number;
  minYear?: number;
  maxYear?: number;
  language?: string;
  watchProviderId?: number;
  minVoteCount?: number;
  maxRuntime?: number;
  page?: number;
}

// ─── Watchlist ────────────────────────────────────────────────────────────────

export type WatchStatus = "plan_to_watch" | "watching" | "completed";

export interface WatchlistItem {
  id: number;
  title: string;
  poster_path: string | null;
  mediaType: "movie" | "tv";
  addedAt: number;
  vote_average?: number;
  status?: WatchStatus;
}

// ─── Mood Search ──────────────────────────────────────────────────────────────

export interface MoodResult {
  type: "movie" | "tv";
  genreName: string;
  sortBy: string;
  minRating: number;
  moodLabel: string;
  description: string;
}
