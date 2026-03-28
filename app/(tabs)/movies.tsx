import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, View, ActivityIndicator, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeContext";
import { getMovies } from "@/lib/tmdb";
import { TrendingItem } from "@/types";
import { RowContainer } from "@/components/RowContainer";

export default function MoviesScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [popular, setPopular] = useState<TrendingItem[]>([]);
  const [topRated, setTopRated] = useState<TrendingItem[]>([]);
  const [nowPlaying, setNowPlaying] = useState<TrendingItem[]>([]);
  const [upcoming, setUpcoming] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [pop, top, now, up] = await Promise.all([
          getMovies("popular"),
          getMovies("top_rated"),
          getMovies("now_playing"),
          getMovies("upcoming"),
        ]);
        setPopular(pop.results.map((r) => ({ ...r, media_type: "movie" })) as any as TrendingItem[]);
        setTopRated(top.results.map((r) => ({ ...r, media_type: "movie" })) as any as TrendingItem[]);
        setNowPlaying(now.results.map((r) => ({ ...r, media_type: "movie" })) as any as TrendingItem[]);
        setUpcoming(up.results.map((r) => ({ ...r, media_type: "movie" })) as any as TrendingItem[]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.colors.bgPrimary }]}>
        <ActivityIndicator size="large" color={theme.colors.accent1} />
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
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    paddingBottom: 32,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "800",
    paddingHorizontal: 16,
    marginBottom: 20,
  },
});
