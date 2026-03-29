import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useTheme } from "@/theme/ThemeContext";

export function LoadingScreen() {
  const { theme } = useTheme();
  return (
    <View style={[styles.root, { backgroundColor: theme.colors.bgPrimary }]}>
      <ActivityIndicator size="large" color={theme.colors.accent1} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "center", alignItems: "center" },
});
