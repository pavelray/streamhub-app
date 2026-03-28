import React from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { useTheme } from "@/theme/ThemeContext";
import { MediaCard } from "./MediaCard";
import { TrendingItem } from "@/types";
import { ChevronRight } from "lucide-react-native";

const { width } = Dimensions.get("window");

interface RowContainerProps {
  title: string;
  items: TrendingItem[];
  gradientColors?: string[];
  onSeeAll?: () => void;
  cardWidth?: number;
}

export function RowContainer({
  title,
  items,
  gradientColors,
  onSeeAll,
  cardWidth,
}: RowContainerProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
        {onSeeAll && (
          <TouchableOpacity onPress={onSeeAll} style={styles.seeAllBtn}>
            <Text style={[styles.seeAllText, { color: theme.colors.accent1 }]}>See All</Text>
            <ChevronRight size={14} color={theme.colors.accent1} />
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => `${item.media_type}-${item.id}`}
        renderItem={({ item }) => <MediaCard item={item} width={cardWidth} />}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        snapToInterval={(cardWidth ?? (width - 48) / 2.3) + 12}
        decelerationRate="fast"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 28,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  seeAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: "600",
  },
  list: {
    paddingLeft: 16,
    paddingRight: 4,
  },
});
