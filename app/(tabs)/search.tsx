import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Search as SearchIcon, X, Filter, Clock, Trash2 } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeContext";
import { searchMulti, discover, MOVIE_GENRES, TV_GENRES } from "@/lib/tmdb";
import { TrendingItem } from "@/types";
import { MediaCard } from "@/components/MediaCard";
import { DiscoverSheet } from "@/components/DiscoverSheet";
import { useSearchHistoryStore } from "@/store/searchHistoryStore";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2.3;
const NUM_COLS = 2;

export default function SearchScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{
    mood?: string;
    moodLabel?: string;
    mediaType?: string;
    genreId?: string;
    sortBy?: string;
    minRating?: string;
    discover?: string;
  }>();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDiscover, setShowDiscover] = useState(false);
  const [moodLabel, setMoodLabel] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const { history, push: pushHistory, remove: removeHistory, clear: clearHistory } = useSearchHistoryStore();

  // Handle mood search navigation params
  useEffect(() => {
    if (params.discover === "1" && params.genreId) {
      setMoodLabel(params.moodLabel ?? null);
      setQuery("");
      const genreId = parseInt(params.genreId, 10);
      const mediaType = (params.mediaType ?? "movie") as "movie" | "tv";
      const sortBy = params.sortBy ?? "popularity.desc";
      const minRating = parseFloat(params.minRating ?? "0");

      setLoading(true);
      discover({ mediaType, genreId, sortBy, minRating, page: 1 })
        .then((res) => {
          const mapped = res.results.map((r) => ({
            ...r,
            media_type: mediaType,
          })) as TrendingItem[];
          setResults(mapped);
          setTotalPages(res.total_pages);
          setPage(1);
        })
        .finally(() => setLoading(false));
    }
  }, [params.discover, params.genreId]);

  const handleSearch = useCallback(
    async (text: string, pageNum = 1) => {
      if (!text.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await searchMulti(text.trim(), pageNum);
        if (pageNum === 1) {
          setResults(res.results);
        } else {
          setResults((prev) => [...prev, ...res.results]);
        }
        setTotalPages(res.total_pages);
        setPage(pageNum);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setMoodLabel(null);
  };

  const loadMore = () => {
    if (page >= totalPages || loading) return;
    if (query.trim()) {
      handleSearch(query, page + 1);
    } else if (moodLabel && params.genreId) {
      // mood-based pagination
      const genreId = parseInt(params.genreId, 10);
      const mediaType = (params.mediaType ?? "movie") as "movie" | "tv";
      const sortBy = params.sortBy ?? "popularity.desc";
      const minRating = parseFloat(params.minRating ?? "0");
      setLoading(true);
      discover({ mediaType, genreId, sortBy, minRating, page: page + 1 })
        .then((res) => {
          const mapped = res.results.map((r) => ({
            ...r,
            media_type: mediaType,
          })) as TrendingItem[];
          setResults((prev) => [...prev, ...mapped]);
          setPage(page + 1);
        })
        .finally(() => setLoading(false));
    }
  };

  const renderItem = ({ item }: { item: TrendingItem }) => (
    <View style={{ width: (width - 48) / 2, marginBottom: 16, marginHorizontal: 4 }}>
      <MediaCard item={item} width={(width - 48) / 2} />
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bgPrimary }]}>
      {/* Search bar */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: theme.colors.bgCard, borderColor: theme.colors.border },
          ]}
        >
          <SearchIcon size={16} color={theme.colors.textMuted} />
          <TextInput
            style={[styles.input, { color: theme.colors.text }]}
            placeholder="Search movies, TV, people..."
            placeholderTextColor={theme.colors.textMuted}
            value={query}
            onChangeText={(t) => {
              setQuery(t);
              setMoodLabel(null);
              if (t.trim().length > 2) handleSearch(t, 1);
              else if (!t.trim()) setResults([]);
            }}
            returnKeyType="search"
            onSubmitEditing={() => handleSearch(query, 1)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClear}>
              <X size={16} color={theme.colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.filterBtn, { backgroundColor: theme.colors.bgCard, borderColor: theme.colors.border }]}
          onPress={() => setShowDiscover(true)}
        >
          <Filter size={18} color={theme.colors.accent1} />
        </TouchableOpacity>
      </View>

      {moodLabel && (
        <View style={[styles.moodBanner, { backgroundColor: theme.colors.bgCard }]}>
          <Text style={[styles.moodText, { color: theme.colors.accent1 }]}>{moodLabel}</Text>
          <TouchableOpacity onPress={handleClear}>
            <X size={14} color={theme.colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}

      {loading && results.length === 0 ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.colors.accent1} />
        </View>
      ) : results.length === 0 && !moodLabel && history.length > 0 && !query.trim() ? (
        // Show search history when idle
        <View style={{ flex: 1 }}>
          <View style={[styles.historyHeader]}>
            <Text style={[styles.historyTitle, { color: theme.colors.text }]}>Recent Searches</Text>
            <TouchableOpacity onPress={clearHistory}>
              <Text style={[styles.clearHistory, { color: theme.colors.accent1 }]}>Clear</Text>
            </TouchableOpacity>
          </View>
          {history.map((term) => (
            <TouchableOpacity
              key={term}
              style={[styles.historyRow, { borderBottomColor: theme.colors.border }]}
              onPress={() => {
                setQuery(term);
                handleSearch(term, 1);
              }}
            >
              <Clock size={14} color={theme.colors.textMuted} style={{ marginRight: 10 }} />
              <Text style={[styles.historyTerm, { color: theme.colors.text }]} numberOfLines={1}>
                {term}
              </Text>
              <TouchableOpacity
                onPress={() => removeHistory(term)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={14} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      ) : results.length === 0 ? (
        <View style={styles.empty}>
          <SearchIcon size={48} color={theme.colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            {query.trim() ? "No results found" : "Search for movies & shows"}
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
            {query.trim()
              ? "Try a different search term"
              : "Or use the AI mood search on the home screen"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => `${item.media_type}-${item.id}`}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={styles.grid}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loading ? <ActivityIndicator size="small" color={theme.colors.accent1} style={{ marginVertical: 20 }} /> : null
          }
        />
      )}

      <DiscoverSheet
        visible={showDiscover}
        onClose={() => setShowDiscover(false)}
        onResults={(items, total) => {
          setResults(items);
          setTotalPages(total);
          setPage(1);
          setMoodLabel(null);
          setShowDiscover(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  moodBanner: {
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  moodText: {
    fontSize: 14,
    fontWeight: "600",
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  grid: {
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 32,
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  historyTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  clearHistory: {
    fontSize: 13,
    fontWeight: "600",
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  historyTerm: {
    flex: 1,
    fontSize: 14,
    marginLeft: 2,
  },
});
