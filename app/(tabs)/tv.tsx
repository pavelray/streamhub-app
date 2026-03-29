import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RefreshCw } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeContext";
import { getTVShows } from "@/lib/tmdb";
import { TrendingItem } from "@/types";
import { RowContainer } from "@/components/RowContainer";
import { SkeletonCardRow } from "@/components/SkeletonLoader";

export default function TVScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [popular, setPopular] = useState<TrendingItem[]>([]);
  const [topRated, setTopRated] = useState<TrendingItem[]>([]);
  const [airingToday, setAiringToday] = useState<TrendingItem[]>([]);
  const [onAir, setOnAir] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [pop, top, today, air] = await Promise.all([
        getTVShows("popular"),
        getTVShows("top_rated"),
        getTVShows("airing_today"),
        getTVShows("on_the_air"),
      ]);
      setPopular(pop.results.map((r) => ({ ...r, media_type: "tv" as const })) as TrendingItem[]);
      setTopRated(top.results.map((r) => ({ ...r, media_type: "tv" as const })) as TrendingItem[]);
      setAiringToday(today.results.map((r) => ({ ...r, media_type: "tv" as const })) as TrendingItem[]);
      setOnAir(air.results.map((r) => ({ ...r, media_type: "tv" as const })) as TrendingItem[]);
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
        <Text style={[styles.pageTitle, { color: theme.colors.text }]}>TV Shows</Text>
        <SkeletonCardRow />
        <SkeletonCardRow />
        <SkeletonCardRow />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.colors.bgPrimary }]}>
        <Text style={[styles.errorText, { color: theme.colors.text }]}>Failed to load TV shows</Text>
        <TouchableOpacity
          style={[styles.retryBtn, { backgroundColor: theme.colors.accent2 }]}
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
      <Text style={[styles.pageTitle, { color: theme.colors.text }]}>TV Shows</Text>
      <RowContainer title="Popular" items={popular} />
      <RowContainer title="Top Rated" items={topRated} />
      <RowContainer title="Airing Today" items={airingToday} />
      <RowContainer title="On The Air" items={onAir} />
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
