import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Play, Info, Star } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeContext";
import { backdropUrl } from "@/lib/tmdb";
import { toSlug, formatYear, formatRating } from "@/utils/helpers";
import { TrendingItem, TrendingMovie, TrendingTV } from "@/types";
import { GENRE_ID_TO_NAME } from "@/lib/tmdb";

const { width, height } = Dimensions.get("window");
const HERO_HEIGHT = height * 0.55;

interface LandingHeaderProps {
  item: TrendingItem | null;
}

export function LandingHeader({ item }: LandingHeaderProps) {
  const { theme } = useTheme();
  const router = useRouter();

  if (!item || item.media_type === "person") return null;

  const media = item as TrendingMovie | TrendingTV;
  const title = "title" in media ? media.title : media.name;
  const year = "release_date" in media ? formatYear(media.release_date) : formatYear(media.first_air_date);
  const overview = media.overview?.slice(0, 140) + (media.overview?.length > 140 ? "..." : "");
  const genres = media.genre_ids?.slice(0, 3).map((id) => GENRE_ID_TO_NAME[id]).filter(Boolean) ?? [];
  const backdrop = backdropUrl(media.backdrop_path, "w1280");
  const slug = toSlug(title, media.id);
  const route = media.media_type === "movie" ? `/movie/${slug}` : `/tv/${slug}`;

  return (
    <View style={[styles.container, { height: HERO_HEIGHT }]}>
      <ImageBackground
        source={backdrop ? { uri: backdrop } : undefined}
        style={styles.backdrop}
        resizeMode="cover"
      >
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.5)", theme.colors.bgPrimary]}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.content}>
          <View style={styles.meta}>
            {genres.map((g) => (
              <View key={g} style={[styles.genreChip, { borderColor: theme.colors.accent1 }]}>
                <Text style={[styles.genreText, { color: theme.colors.accent1 }]}>{g}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={2}>
            {title}
          </Text>

          <View style={styles.ratingRow}>
            <Star size={14} color="#fbbf24" fill="#fbbf24" />
            <Text style={styles.rating}>{formatRating(media.vote_average)}</Text>
            <Text style={[styles.year, { color: theme.colors.textMuted }]}>{year}</Text>
            <View style={[styles.typeBadge, { backgroundColor: theme.colors.accent2 + "33" }]}>
              <Text style={[styles.typeText, { color: theme.colors.accent2 }]}>
                {media.media_type === "movie" ? "Movie" : "Series"}
              </Text>
            </View>
          </View>

          {overview ? (
            <Text style={[styles.overview, { color: theme.colors.textMuted }]}>
              {overview}
            </Text>
          ) : null}

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: theme.colors.accent1 }]}
              onPress={() =>
                router.push(
                  (media.media_type === "tv"
                    ? `/watch/tv/${media.id}?season=1&episode=1`
                    : `/watch/movie/${media.id}`) as any
                )
              }
              activeOpacity={0.85}
            >
              <Play size={16} color="#fff" fill="#fff" />
              <Text style={styles.primaryBtnText}>Watch Now</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: theme.colors.border }]}
              onPress={() => router.push(route as any)}
              activeOpacity={0.85}
            >
              <Info size={16} color={theme.colors.text} />
              <Text style={[styles.secondaryBtnText, { color: theme.colors.text }]}>
                More Info
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width,
  },
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 10,
  },
  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  genreChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  genreText: {
    fontSize: 11,
    fontWeight: "600",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 34,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rating: {
    color: "#fbbf24",
    fontSize: 14,
    fontWeight: "700",
  },
  year: {
    fontSize: 13,
    fontWeight: "400",
  },
  typeBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  typeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  overview: {
    fontSize: 13,
    lineHeight: 20,
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    flex: 1,
    justifyContent: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
