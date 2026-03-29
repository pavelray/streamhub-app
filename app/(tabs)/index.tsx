import React, { useEffect, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  ActivityIndicator,
  Text,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeContext";
import { getTrending } from "@/lib/tmdb";
import { TrendingItem } from "@/types";
import { pickRandom } from "@/utils/helpers";
import { LandingHeader } from "@/components/LandingHeader";
import { RowContainer } from "@/components/RowContainer";
import { MoodSearch } from "@/components/MoodSearch";
import { Navbar } from "@/components/Navbar";

export default function HomeScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [featured, setFeatured] = useState<TrendingItem | null>(null);
  const [movies, setMovies] = useState<TrendingItem[]>([]);
  const [tvShows, setTvShows] = useState<TrendingItem[]>([]);
  const [people, setPeople] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);

  // In-memory cache so re-mounting (tab switches) skips the network round-trip
  const cache = useRef<{
    movies: TrendingItem[];
    tvShows: TrendingItem[];
    people: TrendingItem[];
    featured: TrendingItem | null;
  } | null>(null);

  useEffect(() => {
    if (cache.current) {
      setMovies(cache.current.movies);
      setTvShows(cache.current.tvShows);
      setPeople(cache.current.people);
      setFeatured(cache.current.featured);
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const [moviesRes, tvRes, peopleRes] = await Promise.all([
          getTrending("movie", "week"),
          getTrending("tv", "week"),
          getTrending("person", "week"),
        ]);
        setMovies(moviesRes.results);
        setTvShows(tvRes.results);
        setPeople(peopleRes.results);
        const allMedia = [...moviesRes.results, ...tvRes.results].filter(
          (i) => i.media_type !== "person" && !!(i as any).backdrop_path
        );
        const featuredItem = pickRandom(allMedia) ?? null;
        setFeatured(featuredItem);
        cache.current = {
          movies: moviesRes.results,
          tvShows: tvRes.results,
          people: peopleRes.results,
          featured: featuredItem,
        };
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.bgPrimary }]}>
        <ActivityIndicator size="large" color={theme.colors.accent1} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bgPrimary }]}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Hero section */}
        <LandingHeader item={featured} />

        <View style={styles.body}>
          {/* AI Mood Search */}
          <MoodSearch />

          {/* Trending Movies */}
          <RowContainer
            title="Trending Movies"
            items={movies}
            gradientColors={theme.gradients.movie}
          />

          {/* Trending TV Shows */}
          <RowContainer
            title="Trending TV Shows"
            items={tvShows}
            gradientColors={theme.gradients.tv}
          />

          {/* Trending People */}
          <RowContainer
            title="Trending People"
            items={people}
            gradientColors={theme.gradients.people}
          />
        </View>
      </ScrollView>

      {/* Floating navbar (transparent overlay at top) */}
      <Navbar />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  body: {
    paddingTop: 24,
  },
});
