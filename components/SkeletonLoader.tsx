import React, { useEffect, useRef } from "react";
import { Animated, View, StyleSheet, Dimensions } from "react-native";
import { useTheme } from "@/theme/ThemeContext";

const { width } = Dimensions.get("window");
const CARD_W = (width - 48) / 2.3;

function Pulse({
  w,
  h,
  borderRadius = 8,
  style,
}: {
  w: number;
  h: number;
  borderRadius?: number;
  style?: object;
}) {
  const { theme } = useTheme();
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width: w, height: h, borderRadius, backgroundColor: theme.colors.bgCard, opacity },
        style,
      ]}
    />
  );
}

/** A skeleton placeholder that matches a RowContainer row */
export function SkeletonCardRow() {
  return (
    <View style={styles.rowWrap}>
      <View style={styles.rowHeader}>
        <Pulse w={140} h={20} borderRadius={6} />
      </View>
      <View style={styles.cards}>
        {[1, 2, 3].map((i) => (
          <Pulse key={i} w={CARD_W} h={CARD_W * 1.5} borderRadius={12} style={{ marginRight: 12 }} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rowWrap: { marginBottom: 28, paddingLeft: 16 },
  rowHeader: { marginBottom: 14, paddingRight: 16 },
  cards: { flexDirection: "row" },
});
