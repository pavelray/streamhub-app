import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Linking,
  FlatList,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, ExternalLink } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeContext";
import { getPersonDetails, posterUrl } from "@/lib/tmdb";
import { idFromSlug, formatDate } from "@/utils/helpers";
import { MediaCard } from "@/components/MediaCard";
import { PersonDetails, TrendingItem } from "@/types";

const { width } = Dimensions.get("window");

export default function PersonDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const [person, setPerson] = useState<PersonDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [bioExpanded, setBioExpanded] = useState(false);

  const id = idFromSlug(slug ?? "");

  useEffect(() => {
    if (!id) return;
    getPersonDetails(id)
      .then(setPerson)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.colors.bgPrimary }]}>
        <ActivityIndicator size="large" color={theme.colors.accent1} />
      </View>
    );
  }

  if (!person) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.colors.bgPrimary }]}>
        <Text style={{ color: theme.colors.text }}>Person not found</Text>
      </View>
    );
  }

  const profileUri = posterUrl(person.profile_path, "w400");
  const credits = [
    ...(person.combined_credits?.cast ?? []),
    ...(person.combined_credits?.crew ?? []),
  ]
    .filter((c) => c.poster_path && c.vote_average > 0)
    .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
    .slice(0, 20) as TrendingItem[];

  const bioPreview = person.biography?.slice(0, 300);
  const hasBioMore = (person.biography?.length ?? 0) > 300;

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bgPrimary }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Back button */}
        <View style={[styles.navRow, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: "rgba(0,0,0,0.4)" }]}
          >
            <ArrowLeft size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Profile section */}
        <View style={styles.profileSection}>
          <Image
            source={profileUri ? { uri: profileUri } : undefined}
            style={[styles.profileImage, { backgroundColor: theme.colors.bgSecondary }]}
          />
          <View style={styles.profileInfo}>
            <Text style={[styles.name, { color: theme.colors.text }]}>{person.name}</Text>
            <Text style={[styles.dept, { color: theme.colors.accent1 }]}>
              {person.known_for_department}
            </Text>
            {person.birthday && (
              <Text style={[styles.meta, { color: theme.colors.textMuted }]}>
                Born: {formatDate(person.birthday)}
                {person.place_of_birth ? ` · ${person.place_of_birth}` : ""}
              </Text>
            )}
            {person.imdb_id && (
              <TouchableOpacity
                style={[styles.imdbBtn, { backgroundColor: "#f5c518" }]}
                onPress={() => Linking.openURL(`https://www.imdb.com/name/${person.imdb_id}`)}
              >
                <Text style={styles.imdbText}>IMDB</Text>
                <ExternalLink size={12} color="#000" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Biography */}
        {person.biography ? (
          <View style={[styles.section, { borderTopColor: theme.colors.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Biography</Text>
            <Text style={[styles.bio, { color: theme.colors.textMuted }]}>
              {bioExpanded ? person.biography : bioPreview}
              {!bioExpanded && hasBioMore ? "..." : ""}
            </Text>
            {hasBioMore && (
              <TouchableOpacity onPress={() => setBioExpanded(!bioExpanded)} style={styles.bioToggle}>
                <Text style={[styles.bioToggleText, { color: theme.colors.accent1 }]}>
                  {bioExpanded ? "Show less" : "Read more"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}

        {/* Known For */}
        {credits.length > 0 && (
          <View style={[styles.section, { borderTopColor: theme.colors.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Known For</Text>
            <FlatList
              data={credits}
              horizontal
              keyExtractor={(item) => `credit-${item.media_type}-${item.id}`}
              renderItem={({ item }) => <MediaCard item={item} />}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 0, paddingRight: 4 }}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  navRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  profileSection: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 16,
    alignItems: "flex-start",
    marginBottom: 8,
  },
  profileImage: {
    width: 110,
    height: 165,
    borderRadius: 14,
  },
  profileInfo: {
    flex: 1,
    gap: 8,
    paddingTop: 4,
  },
  name: {
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 28,
  },
  dept: {
    fontSize: 14,
    fontWeight: "600",
  },
  meta: {
    fontSize: 12,
    lineHeight: 18,
  },
  imdbBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  imdbText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#000",
  },
  section: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  bio: {
    fontSize: 14,
    lineHeight: 22,
  },
  bioToggle: {
    marginTop: 8,
  },
  bioToggleText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
