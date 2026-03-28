import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, RotateCcw } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeContext";

const { width, height } = Dimensions.get("window");

export default function WatchScreen() {
  const { type, id } = useLocalSearchParams<{ type: string; id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const season = useLocalSearchParams<{ season?: string }>().season ?? "1";
  const episode = useLocalSearchParams<{ episode?: string }>().episode ?? "1";

  const [loadError, setLoadError] = useState(false);
  const [key, setKey] = useState(0);

  const embedUrl =
    type === "tv"
      ? `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}`
      : `https://www.2embed.cc/embed/${id}`;

  return (
    <View style={[styles.root, { backgroundColor: "#000" }]}>
      {/* Top bar */}
      <View style={[styles.topBar, { paddingTop: insets.top + 4 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={20} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.topTitle} numberOfLines={1}>
          {type === "tv" ? `S${season} E${episode}` : "Watch"}
        </Text>

        <TouchableOpacity
          onPress={() => { setLoadError(false); setKey((k) => k + 1); }}
          style={styles.iconBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <RotateCcw size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {loadError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Content unavailable</Text>
          <Text style={styles.errorSubText}>
            The stream may not be available for this title.
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: theme.colors.accent1 }]}
            onPress={() => { setLoadError(false); setKey((k) => k + 1); }}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <WebView
          key={key}
          source={{ uri: embedUrl }}
          style={styles.webview}
          allowsFullscreenVideo
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={theme.colors.accent1} />
            </View>
          )}
          onError={() => setLoadError(true)}
          onHttpError={(e) => {
            if (e.nativeEvent.statusCode >= 400) setLoadError(true);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  iconBtn: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 10,
  },
  topTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  webview: {
    flex: 1,
    width,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  errorText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  errorSubText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
