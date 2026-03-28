import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { X } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeContext";
import { discover, MOVIE_GENRES, TV_GENRES, STREAMING_PROVIDERS, LANGUAGES } from "@/lib/tmdb";
import { TrendingItem } from "@/types";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height } = Dimensions.get("window");

const SORT_OPTIONS = [
  { label: "Popularity", value: "popularity.desc" },
  { label: "Rating", value: "vote_average.desc" },
  { label: "Revenue", value: "revenue.desc" },
  { label: "Release Date", value: "release_date.desc" },
];

interface DiscoverSheetProps {
  visible: boolean;
  onClose: () => void;
  onResults: (items: TrendingItem[], totalPages: number) => void;
}

export function DiscoverSheet({ visible, onClose, onResults }: DiscoverSheetProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [mediaType, setMediaType] = useState<"movie" | "tv">("movie");
  const [selectedGenre, setSelectedGenre] = useState<number | undefined>();
  const [sortBy, setSortBy] = useState("popularity.desc");
  const [minRating, setMinRating] = useState(0);
  const [selectedProvider, setSelectedProvider] = useState<number | undefined>();
  const [selectedLanguage, setSelectedLanguage] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const genres = mediaType === "movie" ? MOVIE_GENRES : TV_GENRES;

  const handleApply = async () => {
    setLoading(true);
    try {
      const res = await discover({
        mediaType,
        genreId: selectedGenre,
        sortBy,
        minRating: minRating > 0 ? minRating : undefined,
        watchProviderId: selectedProvider,
        language: selectedLanguage,
        page: 1,
      });
      const items = res.results.map((r) => ({
        ...r,
        media_type: mediaType,
      })) as TrendingItem[];
      onResults(items, res.total_pages);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedGenre(undefined);
    setSortBy("popularity.desc");
    setMinRating(0);
    setSelectedProvider(undefined);
    setSelectedLanguage(undefined);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.bgSecondary,
              paddingBottom: insets.bottom + 16,
              maxHeight: height * 0.9,
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.sheetHeader, { borderBottomColor: theme.colors.border }]}>
            <Text style={[styles.sheetTitle, { color: theme.colors.text }]}>Discover</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleReset} style={[styles.resetBtn, { borderColor: theme.colors.border }]}>
                <Text style={[styles.resetText, { color: theme.colors.textMuted }]}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose}>
                <X size={22} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetContent}>
            {/* Media type toggle */}
            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: theme.colors.text }]}>Media Type</Text>
              <View style={styles.toggleRow}>
                {(["movie", "tv"] as const).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.toggleBtn,
                      {
                        backgroundColor:
                          mediaType === t ? theme.colors.accent1 : theme.colors.bgCard,
                        borderColor: theme.colors.border,
                      },
                    ]}
                    onPress={() => { setMediaType(t); setSelectedGenre(undefined); }}
                  >
                    <Text
                      style={[
                        styles.toggleText,
                        { color: mediaType === t ? "#fff" : theme.colors.textMuted },
                      ]}
                    >
                      {t === "movie" ? "Movies" : "TV Shows"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Genre */}
            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: theme.colors.text }]}>Genre</Text>
              <View style={styles.chipsWrap}>
                {Object.entries(genres).map(([name, id]) => (
                  <TouchableOpacity
                    key={name}
                    style={[
                      styles.chip,
                      {
                        backgroundColor:
                          selectedGenre === id ? theme.colors.accent1 : theme.colors.bgCard,
                        borderColor:
                          selectedGenre === id ? theme.colors.accent1 : theme.colors.border,
                      },
                    ]}
                    onPress={() => setSelectedGenre(selectedGenre === id ? undefined : id)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: selectedGenre === id ? "#fff" : theme.colors.text },
                      ]}
                    >
                      {name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Sort By */}
            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: theme.colors.text }]}>Sort By</Text>
              <View style={styles.chipsWrap}>
                {SORT_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.chip,
                      {
                        backgroundColor:
                          sortBy === opt.value ? theme.colors.accent2 : theme.colors.bgCard,
                        borderColor:
                          sortBy === opt.value ? theme.colors.accent2 : theme.colors.border,
                      },
                    ]}
                    onPress={() => setSortBy(opt.value)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: sortBy === opt.value ? "#fff" : theme.colors.text },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Min Rating */}
            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: theme.colors.text }]}>
                Min Rating: {minRating > 0 ? `${minRating}+` : "Any"}
              </Text>
              <View style={styles.ratingRow}>
                {[0, 5, 6, 7, 8].map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.ratingChip,
                      {
                        backgroundColor:
                          minRating === r ? "#fbbf24" : theme.colors.bgCard,
                        borderColor: minRating === r ? "#fbbf24" : theme.colors.border,
                      },
                    ]}
                    onPress={() => setMinRating(r)}
                  >
                    <Text
                      style={[
                        styles.ratingText,
                        { color: minRating === r ? "#000" : theme.colors.textMuted },
                      ]}
                    >
                      {r === 0 ? "Any" : `${r}+`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Streaming Provider */}
            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: theme.colors.text }]}>Streaming Provider</Text>
              <View style={styles.chipsWrap}>
                {STREAMING_PROVIDERS.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.chip,
                      {
                        backgroundColor:
                          selectedProvider === p.id ? theme.colors.accent3 : theme.colors.bgCard,
                        borderColor:
                          selectedProvider === p.id ? theme.colors.accent3 : theme.colors.border,
                      },
                    ]}
                    onPress={() => setSelectedProvider(selectedProvider === p.id ? undefined : p.id)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: selectedProvider === p.id ? "#fff" : theme.colors.text },
                      ]}
                    >
                      {p.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Language */}
            <View style={styles.filterGroup}>
              <Text style={[styles.filterLabel, { color: theme.colors.text }]}>Language</Text>
              <View style={styles.chipsWrap}>
                {LANGUAGES.map((l) => (
                  <TouchableOpacity
                    key={l.code}
                    style={[
                      styles.chip,
                      {
                        backgroundColor:
                          selectedLanguage === l.code ? theme.colors.accent1 + "88" : theme.colors.bgCard,
                        borderColor:
                          selectedLanguage === l.code ? theme.colors.accent1 : theme.colors.border,
                      },
                    ]}
                    onPress={() => setSelectedLanguage(selectedLanguage === l.code ? undefined : l.code)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: theme.colors.text },
                      ]}
                    >
                      {l.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Apply button */}
          <TouchableOpacity
            style={[styles.applyBtn, { backgroundColor: theme.colors.accent1, marginHorizontal: 16 }]}
            onPress={handleApply}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.applyText}>Apply Filters</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  resetBtn: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  resetText: {
    fontSize: 13,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 20,
  },
  filterGroup: {
    gap: 10,
  },
  filterLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  toggleRow: {
    flexDirection: "row",
    gap: 10,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  ratingRow: {
    flexDirection: "row",
    gap: 10,
  },
  ratingChip: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 8,
    alignItems: "center",
  },
  ratingText: {
    fontSize: 13,
    fontWeight: "600",
  },
  applyBtn: {
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
  applyText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
