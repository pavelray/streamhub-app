import React from "react";
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Star, Bookmark, BookmarkCheck } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeContext";
import { useWatchlistStore } from "@/store/watchlistStore";
import { posterUrl } from "@/lib/tmdb";
import { toSlug, formatRating, formatYear } from "@/utils/helpers";
import { TrendingItem } from "@/types";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2.3;

interface MediaCardProps {
  item: TrendingItem;
  width?: number;
}

export function MediaCard({ item, width: cardWidth = CARD_WIDTH }: MediaCardProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const { add, remove, has } = useWatchlistStore();

  const isMovie = item.media_type === "movie";
  const isPerson = item.media_type === "person";

  const title = isMovie
    ? (item as any).title
    : isPerson
    ? (item as any).name
    : (item as any).name;

  const posterPath = isPerson
    ? (item as any).profile_path
    : (item as any).poster_path;

  const year = isMovie
    ? formatYear((item as any).release_date)
    : !isPerson
    ? formatYear((item as any).first_air_date)
    : undefined;

  const rating = !isPerson ? (item as any).vote_average : undefined;
  const inWatchlist = !isPerson && has(item.id);

  const handlePress = () => {
    const slug = toSlug(title, item.id);
    if (isMovie) router.push(`/movie/${slug}`);
    else if (isPerson) router.push(`/person/${slug}`);
    else router.push(`/tv/${slug}`);
  };

  const handleWatchlist = (e: any) => {
    e.stopPropagation?.();
    if (inWatchlist) {
      remove(item.id);
    } else {
      add({
        id: item.id,
        title,
        poster_path: posterPath,
        mediaType: isMovie ? "movie" : "tv",
        vote_average: rating,
      });
    }
  };

  const imageUri = posterUrl(posterPath, "w400");

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.container, { width: cardWidth }]}
      activeOpacity={0.85}
    >
      <ImageBackground
        source={imageUri ? { uri: imageUri } : undefined}
        style={[styles.image, { width: cardWidth, height: cardWidth * 1.5 }]}
        imageStyle={styles.imageStyle}
      >
        {/* Gradient overlay */}
        <View style={styles.gradient} />

        {!isPerson && (
          <TouchableOpacity
            style={[styles.bookmarkBtn, { backgroundColor: theme.colors.bgCard }]}
            onPress={handleWatchlist}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {inWatchlist ? (
              <BookmarkCheck size={14} color={theme.colors.accent1} />
            ) : (
              <Bookmark size={14} color={theme.colors.textMuted} />
            )}
          </TouchableOpacity>
        )}

        {rating !== undefined && (
          <View style={[styles.ratingBadge, { backgroundColor: "rgba(0,0,0,0.7)" }]}>
            <Star size={10} color="#fbbf24" fill="#fbbf24" />
            <Text style={styles.ratingText}>{formatRating(rating)}</Text>
          </View>
        )}

        {!imageUri && (
          <View style={[styles.placeholder, { backgroundColor: theme.colors.bgSecondary }]}>
            <Text style={[styles.placeholderText, { color: theme.colors.textMuted }]}>
              {title?.[0] ?? "?"}
            </Text>
          </View>
        )}
      </ImageBackground>

      <View style={styles.info}>
        <Text
          style={[styles.title, { color: theme.colors.text }]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
        {isPerson ? (
          <Text style={[styles.sub, { color: theme.colors.textMuted }]} numberOfLines={1}>
            {(item as any).known_for_department ?? "Actor"}
          </Text>
        ) : (
          year && (
            <Text style={[styles.sub, { color: theme.colors.textMuted }]}>{year}</Text>
          )
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginRight: 12,
  },
  image: {
    borderRadius: 12,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  imageStyle: {
    borderRadius: 12,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
  },
  bookmarkBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    borderRadius: 8,
    padding: 6,
    zIndex: 10,
  },
  ratingBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 3,
  },
  ratingText: {
    color: "#fbbf24",
    fontSize: 11,
    fontWeight: "700",
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 48,
    fontWeight: "700",
  },
  info: {
    marginTop: 8,
    gap: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  sub: {
    fontSize: 11,
    fontWeight: "400",
  },
});
