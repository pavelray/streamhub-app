import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RefreshCw } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeContext";
import { getMovies } from "@/lib/tmdb";
import { TrendingItem } from "@/types";
import { RowContainer } from "@/components/RowContainer";
import { LoadingScreen } from "@/components/LoadingScreen";
import { SkeletonCardRow } from "@/components/SkeletonLoader";

export default function MoviesScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [popular, setPopular] = useState<TrendingItem[]>([]);
  const [topRated, setTopRated] = useState<TrendingItem[]>([]);
  const [nowPlaying, setNowPlaying] = useState<TrendingItem[]>([]);
  const [upcoming, setUpcoming] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [pop, top, now, up] = await Promise.all([
        getMovies("popular"),
        getMovies("top_rated"),
        getMovies("now_playing"),
        getMovies("upcoming"),
      ]);
      setPopular(pop.results.map((r) => ({ ...r, media_type: "movie" as const })) as TrendingItem[]);
      setTopRated(top.results.map((r) => ({ ...r, media_type: "movie" as const })) as TrendingItem[]);
      setNowPlaying(now.results.map((r) => ({ ...r, media_type: "movie" as const })) as TrendingItem[]);
      setUpcoming(up.results.map((r) => ({ ...r, media_type: "movie" as const })) as TrendingItem[]);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <View style={[styles.root, { backgroundColor: theme.colors.bgPrimary, paddingTop: insets.top + 16 }]}>
        <Text style={[styles.pageTitle, { color: theme.colors.text }]}>Movies</Text>
        <SkeletonCardRow />
        <SkeletonCardRow />
        <SkeletonCardRow />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.colors.bgPrimary }]}>
        <Text style={[styles.errorText, { color: theme.colors.text }]}>Failed to load movies</Text>
        <TouchableOpacity
          style={[styles.retryBtn, { backgroundColor: theme.colors.accent1 }]}
          onPress={load}
        >
          <RefreshCw size={16} color="#fff" />
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.bgPrimary }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.pageTitle, { color: theme.colors.text }]}>Movies</Text>
      <RowContainer title="Popular" items={popular} />
      <RowContainer title="Top Rated" items={topRated} />
      <RowContainer title="Now Playing" items={nowPlaying} />
      <RowContainer title="Upcoming" items={upcoming} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingBottom: 32 },
  pageTitle: {
    fontSize: 28,
    fontWeight: "800",
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  errorText: { fontSize: 16, fontWeight: "600" },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
