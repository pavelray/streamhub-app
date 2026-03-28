import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { useRouter, usePathname } from "expo-router";
import { useTheme } from "@/theme/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Sun, Moon } from "lucide-react-native";

export function Navbar() {
  const { theme, toggleTheme, themeName } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 4,
          backgroundColor: theme.colors.bgPrimary + "ee",
          borderBottomColor: theme.colors.border,
        },
      ]}
    >
      <TouchableOpacity onPress={() => router.push("/")} activeOpacity={0.8}>
        <Text style={[styles.logo, { color: theme.colors.text }]}>
          Stream
          <Text style={{ color: theme.colors.accent1 }}>Hub</Text>
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={toggleTheme}
        style={[styles.themeBtn, { backgroundColor: theme.colors.bgCard, borderColor: theme.colors.border }]}
        activeOpacity={0.8}
      >
        {themeName === "default" ? (
          <Sun size={16} color={theme.colors.accent3} />
        ) : (
          <Moon size={16} color={theme.colors.accent1} />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
    }),
  },
  logo: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  themeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
});
