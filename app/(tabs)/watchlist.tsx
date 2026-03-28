import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Trash2, Bookmark } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeContext";
import { useWatchlistStore } from "@/store/watchlistStore";
import { posterUrl } from "@/lib/tmdb";
import { WatchlistItem } from "@/types";
import { useRouter } from "expo-router";
import { toSlug } from "@/utils/helpers";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = (width - 48) / 3;

export default function WatchlistScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { items, remove, clear } = useWatchlistStore();

  const movies = items.filter((i) => i.mediaType === "movie");
  const tvShows = items.filter((i) => i.mediaType === "tv");

  const handleOpen = (item: WatchlistItem) => {
    const slug = toSlug(item.title, item.id);
    if (item.mediaType === "movie") router.push(`/movie/${slug}`);
    else router.push(`/tv/${slug}`);
  };

  const renderItem = ({ item }: { item: WatchlistItem }) => {
    const imgUri = posterUrl(item.poster_path, "w200");
    return (
      <TouchableOpacity
        style={[styles.item, { width: ITEM_WIDTH }]}
        onPress={() => handleOpen(item)}
        activeOpacity={0.85}
      >
        {imgUri ? (
          <Image
            source={{ uri: imgUri }}
            style={[styles.poster, { width: ITEM_WIDTH, height: ITEM_WIDTH * 1.5 }]}
          />
        ) : (
          <View
            style={[
              styles.posterPlaceholder,
              { width: ITEM_WIDTH, height: ITEM_WIDTH * 1.5, backgroundColor: theme.colors.bgSecondary },
            ]}
          >
            <Text style={{ color: theme.colors.textMuted, fontSize: 24 }}>
              {item.title?.[0] ?? "?"}
            </Text>
          </View>
        )}
        <Text style={[styles.itemTitle, { color: theme.colors.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => remove(item.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Trash2 size={12} color={theme.colors.textMuted} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderSection = (title: string, data: WatchlistItem[]) => {
    if (!data.length) return null;
    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {title} ({data.length})
        </Text>
        <FlatList
          data={data}
          keyExtractor={(item) => `${item.mediaType}-${item.id}`}
          renderItem={renderItem}
          numColumns={3}
          scrollEnabled={false}
          contentContainerStyle={styles.grid}
        />
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bgPrimary }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.titleRow}>
          <Bookmark size={22} color={theme.colors.accent1} />
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Watchlist ({items.length})
          </Text>
        </View>
        {items.length > 0 && (
          <TouchableOpacity
            onPress={clear}
            style={[styles.clearBtn, { borderColor: theme.colors.border }]}
          >
            <Trash2 size={14} color={theme.colors.textMuted} />
            <Text style={[styles.clearText, { color: theme.colors.textMuted }]}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Bookmark size={56} color={theme.colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
            Your watchlist is empty
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textMuted }]}>
            Tap the bookmark icon on any title to save it here
          </Text>
        </View>
      ) : (
        <FlatList
          data={[
            { key: "movies", title: "Movies", data: movies },
            { key: "tv", title: "TV Shows", data: tvShows },
          ]}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => renderSection(item.title, item.data)}
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  clearText: {
    fontSize: 13,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 14,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  grid: {
    paddingHorizontal: 12,
  },
  item: {
    marginBottom: 16,
    paddingHorizontal: 4,
    position: "relative",
  },
  poster: {
    borderRadius: 10,
  },
  posterPlaceholder: {
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  itemTitle: {
    fontSize: 11,
    marginTop: 6,
    lineHeight: 15,
    fontWeight: "500",
  },
  removeBtn: {
    position: "absolute",
    top: 6,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 6,
    padding: 5,
  },
});
