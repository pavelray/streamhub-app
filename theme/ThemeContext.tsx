import React, { createContext, useContext, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeName = "default" | "sunset";

export interface Theme {
  name: ThemeName;
  colors: {
    bgPrimary: string;
    bgSecondary: string;
    bgCard: string;
    bgOverlay: string;
    accent1: string;
    accent2: string;
    accent3: string;
    text: string;
    textMuted: string;
    textOnAccent: string;
    border: string;
    ratingBg: string;
    tabBar: string;
    tabBarBorder: string;
  };
  gradients: {
    header: string[];
    movie: string[];
    tv: string[];
    people: string[];
    bg: string[];
  };
}

export const THEMES: Record<ThemeName, Theme> = {
  default: {
    name: "default",
    colors: {
      bgPrimary: "#0f172a",
      bgSecondary: "#1e293b",
      bgCard: "rgba(30,41,59,0.8)",
      bgOverlay: "rgba(15,23,42,0.7)",
      accent1: "#22d3ee",
      accent2: "#a21caf",
      accent3: "#ec4899",
      text: "#f8fafc",
      textMuted: "#94a3b8",
      textOnAccent: "#ffffff",
      border: "rgba(148,163,184,0.2)",
      ratingBg: "rgba(250,204,21,0.15)",
      tabBar: "#0f172a",
      tabBarBorder: "rgba(148,163,184,0.15)",
    },
    gradients: {
      header: ["#22d3ee", "#a21caf", "#ec4899"],
      movie: ["#ec4899", "#f43f5e"],
      tv: ["#a21caf", "#6366f1"],
      people: ["#f59e0b", "#fb923c"],
      bg: ["#0f172a", "#1a1035", "#0f172a"],
    },
  },
  sunset: {
    name: "sunset",
    colors: {
      bgPrimary: "#1c0a00",
      bgSecondary: "#2d1009",
      bgCard: "rgba(45,16,9,0.8)",
      bgOverlay: "rgba(28,10,0,0.7)",
      accent1: "#f97316",
      accent2: "#dc2626",
      accent3: "#d97706",
      text: "#fef3c7",
      textMuted: "#fca5a5",
      textOnAccent: "#ffffff",
      border: "rgba(252,165,165,0.2)",
      ratingBg: "rgba(251,146,60,0.15)",
      tabBar: "#1c0a00",
      tabBarBorder: "rgba(252,165,165,0.15)",
    },
    gradients: {
      header: ["#dc2626", "#ea580c", "#d97706"],
      movie: ["#ea580c", "#dc2626"],
      tv: ["#d97706", "#f97316"],
      people: ["#fbbf24", "#f59e0b"],
      bg: ["#1c0a00", "#3b0f0f", "#1c0a00"],
    },
  },
};

interface ThemeContextType {
  theme: Theme;
  themeName: ThemeName;
  toggleTheme: () => void;
  setTheme: (name: ThemeName) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: THEMES.default,
  themeName: "default",
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeName, setThemeNameState] = useState<ThemeName>("default");

  React.useEffect(() => {
    AsyncStorage.getItem("streamhub-theme").then((saved) => {
      if (saved === "default" || saved === "sunset") {
        setThemeNameState(saved);
      }
    });
  }, []);

  const setTheme = (name: ThemeName) => {
    setThemeNameState(name);
    AsyncStorage.setItem("streamhub-theme", name);
  };

  const toggleTheme = () => {
    setTheme(themeName === "default" ? "sunset" : "default");
  };

  return (
    <ThemeContext.Provider value={{ theme: THEMES[themeName], themeName, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
