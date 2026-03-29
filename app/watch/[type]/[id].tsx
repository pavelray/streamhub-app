import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
  Modal,
  ScrollView,
} from "react-native";
import { WebView } from "react-native-webview";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, RotateCcw, List } from "lucide-react-native";
import { useTheme } from "@/theme/ThemeContext";
import { getTVDetails } from "@/lib/tmdb";
import { TVSeason } from "@/types";

const { width } = Dimensions.get("window");

// ━━ Constants (outside component to avoid recreation on every render) ━━━━━━━

const CHROME_UA =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36";

const ALLOWED_HOSTS = ["2embed.cc", "www.2embed.cc", "2embed.skin", "www.2embed.skin"];

function isAllowedHost(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return ALLOWED_HOSTS.some((h) => host === h || host.endsWith("." + h));
  } catch {
    return true; // allow blob: / data: schemes
  }
}

const AD_BLOCK_JS = `
  (function() {
    window.open = function() { return null; };
    var _pushState = history.pushState.bind(history);
    var _replaceState = history.replaceState.bind(history);
    history.pushState = function(state, title, url) {
      if (url && !String(url).includes('2embed')) return;
      _pushState(state, title, url);
    };
    history.replaceState = function(state, title, url) {
      if (url && !String(url).includes('2embed')) return;
      _replaceState(state, title, url);
    };
    document.addEventListener('click', function(e) {
      var el = e.target && e.target.closest('a');
      if (!el) return;
      var href = el.href || '';
      if (href && !href.includes('2embed')) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    }, true);
  })();
`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function WatchScreen() {
  const { type, id } = useLocalSearchParams<{ type: string; id: string }>();
  const rawSeason = useLocalSearchParams<{ season?: string }>().season;
  const rawEpisode = useLocalSearchParams<{ episode?: string }>().episode;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  // Validate and clamp params to positive integers
  const initSeason = Math.max(1, parseInt(rawSeason ?? "1", 10) || 1);
  const initEpisode = Math.max(1, parseInt(rawEpisode ?? "1", 10) || 1);

  const [currentSeason, setCurrentSeason] = useState(initSeason);
  const [currentEpisode, setCurrentEpisode] = useState(initEpisode);
  const [pickerSeason, setPickerSeason] = useState(initSeason);
  const [seasons, setSeasons] = useState<TVSeason[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [webViewKey, setWebViewKey] = useState(0);

  // Fetch season list for TV shows
  useEffect(() => {
    if (type !== "tv") return;
    getTVDetails(Number(id))
      .then((d) => setSeasons(d.seasons.filter((s) => s.season_number > 0)))
      .catch(() => {});
  }, [type, id]);

  const embedUrl = useMemo(
    () =>
      type === "tv"
        ? `https://www.2embed.cc/embedtv/${id}&s=${currentSeason}&e=${currentEpisode}`
        : `https://www.2embed.cc/embed/${id}`,
    [type, id, currentSeason, currentEpisode]
  );

  const embedHtml = useMemo(
    () => `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#000;overflow:hidden}
  iframe{position:fixed;top:0;left:0;width:100%;height:100%;border:none}
</style>
</head>
<body>
  <iframe
    src="${embedUrl}"
    frameborder="0"
    scrolling="no"
    allowfullscreen
    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
  ></iframe>
</body>
</html>`,
    [embedUrl]
  );

  const episodeCount =
    seasons.find((s) => s.season_number === pickerSeason)?.episode_count ?? 24;

  const handleSelectEpisode = (season: number, episode: number) => {
    setCurrentSeason(season);
    setCurrentEpisode(episode);
    setShowPicker(false);
    setLoadError(false);
    setWebViewKey((k) => k + 1);
  };

  const handleRetry = () => {
    setLoadError(false);
    setWebViewKey((k) => k + 1);
  };

  return (
    <View style={[styles.root, { backgroundColor: "#000" }]}>
      {/* ── Top bar ── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 4 }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.titleArea}
          onPress={() => type === "tv" && setShowPicker(true)}
          disabled={type !== "tv"}
          activeOpacity={type === "tv" ? 0.7 : 1}
        >
          <Text style={styles.topTitle} numberOfLines={1}>
            {type === "tv"
              ? `Season ${currentSeason}  ·  Episode ${currentEpisode}`
              : "Watch"}
          </Text>
          {type === "tv" && (
            <Text style={styles.topSubtitle}>tap to change episode</Text>
          )}
        </TouchableOpacity>

        <View style={styles.iconRow}>
          {type === "tv" && (
            <TouchableOpacity
              onPress={() => {
                setPickerSeason(currentSeason);
                setShowPicker(true);
              }}
              style={[styles.iconBtn, { marginRight: 6 }]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <List size={18} color="#fff" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleRetry}
            style={styles.iconBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <RotateCcw size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Content ── */}
      {loadError ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Content unavailable</Text>
          <Text style={styles.errorSubText}>
            The stream may not be available for this title.
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: theme.colors.accent1 }]}
            onPress={handleRetry}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : Platform.OS === "web" ? (
        <iframe
          key={webViewKey}
          src={embedUrl}
          style={{ flex: 1, border: "none", width: "100%", height: "100%" }}
          allowFullScreen
          allow="autoplay; encrypted-media; picture-in-picture"
        />
      ) : (
        <WebView
          key={webViewKey}
          source={{ html: embedHtml, baseUrl: "https://www.2embed.cc" }}
          style={styles.webview}
          userAgent={CHROME_UA}
          allowsFullscreenVideo
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          javaScriptEnabled
          domStorageEnabled
          thirdPartyCookiesEnabled
          mixedContentMode="always"
          setSupportMultipleWindows={false}
          geolocationEnabled={false}
          injectedJavaScript={AD_BLOCK_JS}
          injectedJavaScriptBeforeContentLoaded={AD_BLOCK_JS}
          onShouldStartLoadWithRequest={(req) => isAllowedHost(req.url)}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={theme.colors.accent1} />
            </View>
          )}
          onError={() => setLoadError(true)}
        />
      )}

      {/* ── Episode Picker Modal (TV only) ── */}
      {type === "tv" && (
        <Modal
          visible={showPicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowPicker(false)}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setShowPicker(false)}
            activeOpacity={1}
          >
            <View
              style={[
                styles.pickerSheet,
                {
                  backgroundColor: theme.colors.bgPrimary,
                  paddingBottom: insets.bottom + 16,
                },
              ]}
              onStartShouldSetResponder={() => true}
            >
              <View style={styles.pickerHandle} />
              <Text style={[styles.pickerTitle, { color: theme.colors.text }]}>
                Select Episode
              </Text>

              {seasons.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.seasonScroll}
                  contentContainerStyle={styles.seasonScrollContent}
                >
                  {seasons.map((s) => (
                    <TouchableOpacity
                      key={s.season_number}
                      style={[
                        styles.seasonBtn,
                        {
                          backgroundColor:
                            pickerSeason === s.season_number
                              ? theme.colors.accent1
                              : theme.colors.bgCard,
                        },
                      ]}
                      onPress={() => setPickerSeason(s.season_number)}
                    >
                      <Text
                        style={[
                          styles.seasonBtnText,
                          {
                            color:
                              pickerSeason === s.season_number
                                ? "#fff"
                                : theme.colors.text,
                          },
                        ]}
                      >
                        S{s.season_number}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              <ScrollView
                style={styles.epScroll}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.epGrid}>
                  {Array.from({ length: episodeCount }, (_, i) => i + 1).map((ep) => {
                    const isActive =
                      pickerSeason === currentSeason && ep === currentEpisode;
                    return (
                      <TouchableOpacity
                        key={ep}
                        style={[
                          styles.epBtn,
                          {
                            backgroundColor: isActive
                              ? theme.colors.accent1
                              : theme.colors.bgCard,
                          },
                        ]}
                        onPress={() => handleSelectEpisode(pickerSeason, ep)}
                      >
                        <Text
                          style={[
                            styles.epBtnText,
                            { color: isActive ? "#fff" : theme.colors.text },
                          ]}
                        >
                          {ep}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
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
  iconRow: { flexDirection: "row", alignItems: "center" },
  titleArea: { flex: 1, alignItems: "center", paddingHorizontal: 8 },
  topTitle: { color: "#fff", fontSize: 14, fontWeight: "600", textAlign: "center" },
  topSubtitle: { color: "rgba(255,255,255,0.35)", fontSize: 10, marginTop: 2 },
  webview: { flex: 1, width },
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
  errorText: { color: "#fff", fontSize: 20, fontWeight: "700" },
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
  retryText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  pickerSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 16,
    maxHeight: "65%",
  },
  pickerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "center",
    marginBottom: 14,
  },
  pickerTitle: { fontSize: 17, fontWeight: "700", marginBottom: 14, textAlign: "center" },
  seasonScroll: { marginBottom: 12 },
  seasonScrollContent: { gap: 8, paddingHorizontal: 4 },
  seasonBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: 52,
    alignItems: "center",
  },
  seasonBtnText: { fontSize: 13, fontWeight: "700" },
  epScroll: { maxHeight: 260 },
  epGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingBottom: 12 },
  epBtn: {
    width: 48,
    height: 44,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  epBtnText: { fontSize: 14, fontWeight: "600" },
});
