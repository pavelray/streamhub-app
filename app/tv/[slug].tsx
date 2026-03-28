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
import { ArrowLeft, Play, Bookmark, BookmarkCheck, Star, Tv2, Calendar } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeContext";
import { getTVDetails, posterUrl, backdropUrl } from "@/lib/tmdb";
import { idFromSlug, formatDate, formatRating, toSlug } from "@/utils/helpers";
import { useWatchlistStore } from "@/store/watchlistStore";
import { MediaCard } from "@/components/MediaCard";
import { TVDetails, TrendingItem } from "@/types";

const { width } = Dimensions.get("window");

export default function TVDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { add, remove, has } = useWatchlistStore();

  const [tv, setTV] = useState<TVDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const id = idFromSlug(slug ?? "");
  const inWatchlist = has(id);

  useEffect(() => {
    if (!id) return;
    getTVDetails(id)
      .then(setTV)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.colors.bgPrimary }]}>
        <ActivityIndicator size="large" color={theme.colors.accent1} />
      </View>
    );
  }

  if (!tv) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.colors.bgPrimary }]}>
        <Text style={{ color: theme.colors.text }}>TV show not found</Text>
      </View>
    );
  }

  const trailerKey = tv.videos?.results
    ?.find((v) => v.type === "Trailer" && v.site === "YouTube")?.key
    ?? tv.videos?.results?.[0]?.key;

  const cast = tv.aggregate_credits?.cast?.slice(0, 15) ?? [];
  const recommendations = (tv.recommendations?.results ?? []).slice(0, 15).map(
    (r) => ({ ...r, media_type: "tv" as const })
  ) as TrendingItem[];
  const providers = tv["watch/providers"]?.results?.["US"];

  const handleWatchlist = () => {
    if (inWatchlist) {
      remove(tv.id);
    } else {
      add({
        id: tv.id,
        title: tv.name,
        poster_path: tv.poster_path,
        mediaType: "tv",
        vote_average: tv.vote_average,
      });
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bgPrimary }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Backdrop hero */}
        <ImageBackground
          source={tv.backdrop_path ? { uri: backdropUrl(tv.backdrop_path) } : undefined}
          style={styles.backdrop}
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
              source={tv.poster_path ? { uri: posterUrl(tv.poster_path, "w200") } : undefined}
              style={styles.poster}
            />
            <View style={styles.metaInfo}>
              <Text style={[styles.title, { color: theme.colors.text }]}>{tv.name}</Text>
              {tv.tagline ? (
                <Text style={[styles.tagline, { color: theme.colors.textMuted }]}>{tv.tagline}</Text>
              ) : null}
              <View style={styles.chips}>
                {tv.genres?.slice(0, 3).map((g) => (
                  <View key={g.id} style={[styles.genreChip, { borderColor: theme.colors.accent2 + "88" }]}>
                    <Text style={[styles.genreText, { color: theme.colors.accent2 }]}>{g.name}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.statsRow}>
                <Star size={13} color="#fbbf24" fill="#fbbf24" />
                <Text style={styles.stat}>{formatRating(tv.vote_average)}</Text>
                <Tv2 size={12} color={theme.colors.textMuted} />
                <Text style={[styles.statMuted, { color: theme.colors.textMuted }]}>
                  {tv.number_of_seasons}S · {tv.number_of_episodes}E
                </Text>
                <Calendar size={12} color={theme.colors.textMuted} />
                <Text style={[styles.statMuted, { color: theme.colors.textMuted }]}>
                  {formatDate(tv.first_air_date)}
                </Text>
              </View>
              {tv.status && (
                <View style={[styles.statusBadge, {
                  backgroundColor: tv.in_production
                    ? theme.colors.accent1 + "22"
                    : theme.colors.bgCard,
                }]}>
                  <Text style={[styles.statusText, {
                    color: tv.in_production ? theme.colors.accent1 : theme.colors.textMuted,
                  }]}>
                    {tv.status}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.watchBtn, { backgroundColor: theme.colors.accent2 }]}
              onPress={() => router.push(`/watch/tv/${tv.id}?season=1&episode=1` as any)}
            >
              <Play size={16} color="#fff" fill="#fff" />
              <Text style={styles.watchBtnText}>Watch S1 E1</Text>
            </TouchableOpacity>

            {trailerKey && (
              <TouchableOpacity
                style={[styles.trailerBtn, { borderColor: theme.colors.border }]}
                onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${trailerKey}`)}
              >
                <Text style={[styles.trailerBtnText, { color: theme.colors.text }]}>Trailer</Text>
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
            <Text style={[styles.overview, { color: theme.colors.textMuted }]}>{tv.overview}</Text>
          </View>

          {/* Networks */}
          {tv.networks?.length > 0 && (
            <View style={[styles.section, { borderTopColor: theme.colors.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Networks</Text>
              <View style={styles.networksRow}>
                {tv.networks.map((n) => (
                  <View key={n.id} style={[styles.networkChip, { backgroundColor: theme.colors.bgCard }]}>
                    <Text style={[styles.networkName, { color: theme.colors.text }]}>{n.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Seasons */}
          {tv.seasons?.length > 0 && (
            <View style={[styles.section, { borderTopColor: theme.colors.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Seasons</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.seasonsRow}>
                  {tv.seasons
                    .filter((s) => s.season_number > 0)
                    .map((s) => (
                      <TouchableOpacity
                        key={s.id}
                        style={[styles.seasonCard, { backgroundColor: theme.colors.bgCard }]}
                        onPress={() => router.push(`/watch/tv/${tv.id}?season=${s.season_number}&episode=1` as any)}
                      >
                        {s.poster_path ? (
                          <Image
                            source={{ uri: posterUrl(s.poster_path, "w200") }}
                            style={styles.seasonPoster}
                          />
                        ) : (
                          <View style={[styles.seasonPoster, { backgroundColor: theme.colors.bgSecondary, justifyContent: "center", alignItems: "center" }]}>
                            <Tv2 size={24} color={theme.colors.textMuted} />
                          </View>
                        )}
                        <Text style={[styles.seasonName, { color: theme.colors.text }]} numberOfLines={1}>
                          {s.name}
                        </Text>
                        <Text style={[styles.seasonEps, { color: theme.colors.textMuted }]}>
                          {s.episode_count} eps
                        </Text>
                      </TouchableOpacity>
                    ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Streaming providers */}
          {providers && (providers.flatrate?.length || providers.rent?.length) ? (
            <View style={[styles.section, { borderTopColor: theme.colors.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Where to Watch</Text>
              <View style={styles.providerRow}>
                {(providers.flatrate ?? []).concat(providers.rent ?? []).slice(0, 8).map((p) => (
                  <View key={p.provider_id} style={styles.providerItem}>
                    <Image
                      source={{ uri: `https://image.tmdb.org/t/p/w92${p.logo_path}` }}
                      style={styles.providerLogo}
                    />
                    <Text style={[styles.providerName, { color: theme.colors.textMuted }]} numberOfLines={1}>
                      {p.provider_name}
                    </Text>
                  </View>
                ))}
              </View>
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
                        source={member.profile_path ? { uri: posterUrl(member.profile_path, "w200") } : undefined}
                        style={[styles.castImage, { backgroundColor: theme.colors.bgSecondary }]}
                      />
                      <Text style={[styles.castName, { color: theme.colors.text }]} numberOfLines={2}>
                        {member.name}
                      </Text>
                      <Text style={[styles.castChar, { color: theme.colors.textMuted }]} numberOfLines={1}>
                        {member.roles?.[0]?.character ?? ""}
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
                contentContainerStyle={{ paddingRight: 4 }}
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
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" },
  statusText: { fontSize: 11, fontWeight: "600" },
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
  networksRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  networkChip: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  networkName: { fontSize: 13, fontWeight: "600" },
  seasonsRow: { flexDirection: "row", gap: 12 },
  seasonCard: { width: 100, borderRadius: 10, overflow: "hidden" },
  seasonPoster: { width: 100, height: 150 },
  seasonName: { fontSize: 12, fontWeight: "600", padding: 6, paddingBottom: 2 },
  seasonEps: { fontSize: 10, paddingHorizontal: 6, paddingBottom: 6 },
  providerRow: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  providerItem: { alignItems: "center", width: 56 },
  providerLogo: { width: 44, height: 44, borderRadius: 10 },
  providerName: { fontSize: 10, marginTop: 4, textAlign: "center" },
  castRow: { flexDirection: "row", gap: 14 },
  castMember: { width: 80, alignItems: "center" },
  castImage: { width: 72, height: 72, borderRadius: 36 },
  castName: { fontSize: 12, fontWeight: "600", marginTop: 6, textAlign: "center" },
  castChar: { fontSize: 10, marginTop: 2, textAlign: "center" },
});
