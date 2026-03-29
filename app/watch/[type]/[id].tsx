import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
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
  const [isLoading, setIsLoading] = useState(true);

  // Real Chrome UA prevents embed sites from blocking WebView traffic
  const CHROME_UA =
    "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36";

  const embedUrl =
    type === "tv"
      ? `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}`
      : `https://www.2embed.cc/embed/${id}`;

  console.log("[WatchScreen] type:", type, "| id:", id, "| season:", season, "| episode:", episode);
  console.log("[WatchScreen] embedUrl:", embedUrl);

  // Wrap in an HTML page so Android does not re-encode the URL before sending it.
  // Direct WebView uri loading causes Android's Uri.parse() to percent-encode the
  // '&' characters in 2embed's non-standard path format → 404. Using an iframe
  // inside source.html bypasses that encoding layer.
  const embedHtml = `<!DOCTYPE html>
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
</html>`;

  // Allowed hosts — only 2embed and its CDN/player subdomains pass through.
  // Every other navigation attempt (ads, trackers, pop-unders) is blocked.
  const ALLOWED_HOSTS = [
    "2embed.cc",
    "www.2embed.cc",
    "2embed.skin",
    "www.2embed.skin",
  ];

  const isAllowed = (url: string): boolean => {
    try {
      const host = new URL(url).hostname;
      return ALLOWED_HOSTS.some((h) => host === h || host.endsWith("." + h));
    } catch {
      return true; // allow blob:/data: etc.
    }
  };

  // Injected JS: block window.open / window.location hijacks / fake click handlers
  const AD_BLOCK_JS = `
    (function() {
      // Block window.open (pop-unders)
      window.open = function() { return null; };
      // Block location redirects away from 2embed
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
      // Intercept all <a> clicks and block external ones
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
      ) : Platform.OS === "web" ? (
        <iframe
          key={key}
          src={embedUrl}
          style={{ flex: 1, border: "none", width: "100%", height: "100%" }}
          allowFullScreen
          allow="autoplay; encrypted-media; picture-in-picture"
        />
      ) : (
        <WebView
          key={key}
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
          onShouldStartLoadWithRequest={(req) => {
            const allow = isAllowed(req.url);
            if (!allow) {
              console.log("[WebView] BLOCKED navigation to:", req.url);
            }
            return allow;
          }}
          startInLoadingState
          onLoadStart={(e) => {
            setIsLoading(true);
            console.log("[WebView] onLoadStart url:", e.nativeEvent.url);
          }}
          onLoadEnd={(e) => {
            setIsLoading(false);
            console.log("[WebView] onLoadEnd url:", e.nativeEvent.url);
          }}
          onNavigationStateChange={(state) => {
            console.log("[WebView] navState — url:", state.url, "| status:", state.loading, "| title:", state.title);
          }}
          renderLoading={() => (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={theme.colors.accent1} />
            </View>
          )}
          onError={(e) => {
            console.log("[WebView] onError:", JSON.stringify(e.nativeEvent));
            setLoadError(true);
          }}
          onHttpError={(e) => {
            console.log("[WebView] onHttpError — status:", e.nativeEvent.statusCode, "| url:", e.nativeEvent.url);
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
