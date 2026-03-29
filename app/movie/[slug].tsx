import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  Dimensions,
  Linking,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowLeft, Play, Bookmark, BookmarkCheck, Star, Clock, Calendar, Globe } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeContext";
import { getMovieDetails, posterUrl, backdropUrl } from "@/lib/tmdb";
import { idFromSlug, formatRuntime, formatDate, formatRating, toSlug } from "@/utils/helpers";
import { useWatchlistStore } from "@/store/watchlistStore";
import { MediaCard } from "@/components/MediaCard";
import { MovieDetails, TrendingItem } from "@/types";

const { width } = Dimensions.get("window");

export default function MovieDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { add, remove, has } = useWatchlistStore();

  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const id = idFromSlug(slug ?? "");
  const inWatchlist = has(id);

  useEffect(() => {
    if (!id) return;
    getMovieDetails(id)
      .then(setMovie)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.colors.bgPrimary }]}>
        <ActivityIndicator size="large" color={theme.colors.accent1} />
      </View>
    );
  }

  if (!movie) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.colors.bgPrimary }]}>
        <Text style={{ color: theme.colors.text }}>Movie not found</Text>
      </View>
    );
  }

  const trailerKey = movie.videos?.results
    ?.find((v) => v.type === "Trailer" && v.site === "YouTube")?.key
    ?? movie.videos?.results?.[0]?.key;

  const cast = movie.credits?.cast?.slice(0, 15) ?? [];
  const recommendations = (movie.recommendations?.results ?? []).slice(0, 15).map(
    (r) => ({ ...r, media_type: "movie" as const })
  ) as TrendingItem[];

  const providers = movie["watch/providers"]?.results?.["US"];

  const handleWatchlist = () => {
    if (inWatchlist) {
      remove(movie.id);
    } else {
      add({
        id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        mediaType: "movie",
        vote_average: movie.vote_average,
      });
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bgPrimary }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Backdrop hero */}
        <ImageBackground
          source={movie.backdrop_path ? { uri: backdropUrl(movie.backdrop_path) } : undefined}
          style={[styles.backdrop]}
          resizeMode="cover"
        >
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.4)", theme.colors.bgPrimary]}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.backBtn, { top: insets.top + 8 }]}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.backBtnInner, { backgroundColor: "rgba(0,0,0,0.6)" }]}
            >
              <ArrowLeft size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </ImageBackground>

        <View style={styles.content}>
          {/* Poster + meta row */}
          <View style={styles.metaRow}>
            <Image
              source={movie.poster_path ? { uri: posterUrl(movie.poster_path, "w200") } : undefined}
              style={styles.poster}
            />
            <View style={styles.metaInfo}>
              <Text style={[styles.title, { color: theme.colors.text }]}>{movie.title}</Text>
              {movie.tagline ? (
                <Text style={[styles.tagline, { color: theme.colors.textMuted }]}>
                  {movie.tagline}
                </Text>
              ) : null}
              <View style={styles.chips}>
                {movie.genres?.slice(0, 3).map((g) => (
                  <View key={g.id} style={[styles.genreChip, { borderColor: theme.colors.accent1 + "88" }]}>
                    <Text style={[styles.genreText, { color: theme.colors.accent1 }]}>{g.name}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.statsRow}>
                <Star size={13} color="#fbbf24" fill="#fbbf24" />
                <Text style={styles.stat}>{formatRating(movie.vote_average)}</Text>
                <Clock size={12} color={theme.colors.textMuted} />
                <Text style={[styles.statMuted, { color: theme.colors.textMuted }]}>
                  {formatRuntime(movie.runtime)}
                </Text>
                <Calendar size={12} color={theme.colors.textMuted} />
                <Text style={[styles.statMuted, { color: theme.colors.textMuted }]}>
                  {formatDate(movie.release_date)}
                </Text>
              </View>
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.watchBtn, { backgroundColor: theme.colors.accent1 }]}
              onPress={() => router.push(`/watch/movie/${movie.id}` as any)}
            >
              <Play size={16} color="#fff" fill="#fff" />
              <Text style={styles.watchBtnText}>Watch Now</Text>
            </TouchableOpacity>

            {trailerKey && (
              <TouchableOpacity
                style={[styles.trailerBtn, { borderColor: theme.colors.border }]}
                onPress={() =>
                  Linking.openURL(`https://www.youtube.com/watch?v=${trailerKey}`)
                }
              >
                <Text style={[styles.trailerBtnText, { color: theme.colors.text }]}>
                  Trailer
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.bookmarkBtn, { backgroundColor: theme.colors.bgCard, borderColor: theme.colors.border }]}
              onPress={handleWatchlist}
            >
              {inWatchlist ? (
                <BookmarkCheck size={20} color={theme.colors.accent1} />
              ) : (
                <Bookmark size={20} color={theme.colors.textMuted} />
              )}
            </TouchableOpacity>
          </View>

          {/* Overview */}
          <View style={[styles.section, { borderTopColor: theme.colors.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Overview</Text>
            <Text style={[styles.overview, { color: theme.colors.textMuted }]}>
              {movie.overview}
            </Text>
          </View>

          {/* Streaming providers */}
          {providers && (providers.flatrate?.length || providers.rent?.length || providers.buy?.length) ? (
            <View style={[styles.section, { borderTopColor: theme.colors.border }]}>
              <View style={styles.providerTitleRow}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Where to Watch</Text>
                {providers.link ? (
                  <TouchableOpacity onPress={() => Linking.openURL(providers.link!)}>
                    <Text style={[styles.justWatchLink, { color: theme.colors.accent1 }]}>View on JustWatch ›</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              {providers.flatrate?.length ? (
                <>
                  <Text style={[styles.providerCategory, { color: theme.colors.textMuted }]}>
                    Stream
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.providerRow}>
                      {providers.flatrate.map((p) => (
                        <TouchableOpacity
                          key={p.provider_id}
                          style={styles.providerItem}
                          onPress={() => providers.link && Linking.openURL(providers.link)}
                        >
                          <Image
                            source={{ uri: `https://image.tmdb.org/t/p/w92${p.logo_path}` }}
                            style={styles.providerLogo}
                          />
                          <Text style={[styles.providerName, { color: theme.colors.textMuted }]} numberOfLines={1}>
                            {p.provider_name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </>
              ) : null}
            </View>
          ) : null}

          {/* Cast */}
          {cast.length > 0 && (
            <View style={[styles.section, { borderTopColor: theme.colors.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Cast</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.castRow}>
                  {cast.map((member) => (
                    <TouchableOpacity
                      key={member.id}
                      style={styles.castMember}
                      onPress={() => router.push(`/person/${toSlug(member.name, member.id)}` as any)}
                    >
                      <Image
                        source={
                          member.profile_path
                            ? { uri: posterUrl(member.profile_path, "w200") }
                            : undefined
                        }
                        style={[styles.castImage, { backgroundColor: theme.colors.bgSecondary }]}
                      />
                      <Text style={[styles.castName, { color: theme.colors.text }]} numberOfLines={2}>
                        {member.name}
                      </Text>
                      <Text style={[styles.castChar, { color: theme.colors.textMuted }]} numberOfLines={1}>
                        {member.character}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <View style={[styles.section, { borderTopColor: theme.colors.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>More Like This</Text>
              <FlatList
                data={recommendations}
                horizontal
                keyExtractor={(item) => `rec-${item.id}`}
                renderItem={({ item }) => <MediaCard item={item} />}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingLeft: 0, paddingRight: 4 }}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  backdrop: { width, height: width * 0.6 },
  backBtn: { position: "absolute", left: 16 },
  backBtnInner: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  content: { marginTop: -24, paddingHorizontal: 16 },
  metaRow: { flexDirection: "row", gap: 14, marginBottom: 16 },
  poster: { width: 100, height: 150, borderRadius: 12 },
  metaInfo: { flex: 1, gap: 6, justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "800", lineHeight: 26 },
  tagline: { fontSize: 12, fontStyle: "italic" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  genreChip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  genreText: { fontSize: 11, fontWeight: "600" },
  statsRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  stat: { color: "#fbbf24", fontSize: 13, fontWeight: "700" },
  statMuted: { fontSize: 12 },
  actions: { flexDirection: "row", gap: 10, marginBottom: 20 },
  watchBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
  },
  watchBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  trailerBtn: {
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
  },
  trailerBtnText: { fontWeight: "600", fontSize: 14 },
  bookmarkBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  section: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  overview: { fontSize: 14, lineHeight: 22 },
  providerCategory: { fontSize: 12, fontWeight: "600", marginBottom: 8 },
  providerRow: { flexDirection: "row", gap: 14 },
  providerItem: { alignItems: "center", width: 56 },
  providerLogo: { width: 44, height: 44, borderRadius: 10 },
  providerName: { fontSize: 10, marginTop: 4, textAlign: "center" },
  providerTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  justWatchLink: { fontSize: 13, fontWeight: "600" },
  castRow: { flexDirection: "row", gap: 14 },
  castMember: { width: 80, alignItems: "center" },
  castImage: { width: 72, height: 72, borderRadius: 36 },
  castName: { fontSize: 12, fontWeight: "600", marginTop: 6, textAlign: "center" },
  castChar: { fontSize: 10, marginTop: 2, textAlign: "center" },
});
