import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Search, Sparkles } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeContext";
import { getMoodRecommendation } from "@/lib/moodSearch";

const PRESET_MOODS = [
  { emoji: "😂", label: "Make me laugh" },
  { emoji: "😱", label: "Scare me" },
  { emoji: "💕", label: "Date night" },
  { emoji: "🌧️", label: "Rainy day cozy" },
  { emoji: "🤯", label: "Mind-bending" },
  { emoji: "🚀", label: "Epic adventure" },
  { emoji: "😢", label: "Cry my eyes out" },
  { emoji: "🧠", label: "Intelligent" },
];

export function MoodSearch() {
  const { theme } = useTheme();
  const router = useRouter();
  const [mood, setMood] = useState("");
  const [loading, setLoading] = useState(false);

  const handleMoodSearch = async (moodText: string) => {
    const text = moodText.trim();
    if (!text) return;
    setLoading(true);
    try {
      const result = await getMoodRecommendation(text);
      router.push({
        pathname: "/(tabs)/search",
        params: {
          mood: text,
          moodLabel: result.moodLabel,
          mediaType: result.type,
          genreId: result.genreId ? String(result.genreId) : "",
          sortBy: result.sortBy,
          minRating: String(result.minRating),
          discover: "1",
        },
      });
    } catch {
      Alert.alert("Mood Search", "Could not process your mood. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Sparkles size={18} color={theme.colors.accent1} />
        <Text style={[styles.title, { color: theme.colors.text }]}>How are you feeling?</Text>
      </View>
      <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
        Describe your mood and AI will find the perfect watch for you
      </Text>

      <View style={[styles.inputRow, { backgroundColor: theme.colors.bgCard, borderColor: theme.colors.border }]}>
        <TextInput
          style={[styles.input, { color: theme.colors.text }]}
          placeholder="I want something scary..."
          placeholderTextColor={theme.colors.textMuted}
          value={mood}
          onChangeText={setMood}
          onSubmitEditing={() => handleMoodSearch(mood)}
          returnKeyType="search"
          maxLength={300}
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: theme.colors.accent1 }]}
          onPress={() => handleMoodSearch(mood)}
          disabled={loading || !mood.trim()}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Search size={16} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {PRESET_MOODS.map((m) => (
          <TouchableOpacity
            key={m.label}
            onPress={() => handleMoodSearch(m.label)}
            style={[styles.chip, { backgroundColor: theme.colors.bgCard, borderColor: theme.colors.border }]}
            disabled={loading}
          >
            <Text style={styles.chipEmoji}>{m.emoji}</Text>
            <Text style={[styles.chipLabel, { color: theme.colors.text }]}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 28,
    gap: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: -4,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    fontSize: 14,
    height: 36,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  chips: {
    paddingRight: 16,
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    marginRight: 4,
  },
  chipEmoji: {
    fontSize: 16,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
});
