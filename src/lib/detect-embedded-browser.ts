/**
 * Detects if the user is in an embedded browser/webview
 * (e.g., LinkedIn, Facebook, Twitter in-app browsers)
 * These browsers are blocked by Google OAuth
 */
export function isEmbeddedBrowser(): boolean {
  if (typeof window === "undefined") return false;

  const userAgent = window.navigator.userAgent.toLowerCase();

  // Check for common embedded browser indicators
  const embeddedIndicators = [
    "linkedinapp", // LinkedIn mobile app
    "fban", // Facebook Android
    "fbav", // Facebook iOS
    "twitter", // Twitter app
    "instagram", // Instagram app
    "line", // LINE app
    "wechat", // WeChat
    "whatsapp", // WhatsApp
    "wv", // WebView indicator
    "webview", // Generic webview
  ];

  // Check user agent
  const isEmbedded = embeddedIndicators.some((indicator) =>
    userAgent.includes(indicator)
  );

  // Additional check: standalone mode (PWA) vs embedded
  // If window.standalone is false or undefined, it might be embedded
  // However, this is iOS-specific, so we use it as a hint
  const isStandalone =
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
    true;
  const isInStandaloneMode = window.matchMedia(
    "(display-mode: standalone)"
  ).matches;

  // Check if we're in a webview by checking for missing features
  // Embedded browsers often have limited APIs
  const hasLimitedFeatures =
    !(window as Window & { chrome?: unknown }).chrome || // Chrome object might not exist in webviews
    (window as Window & { ReactNativeWebView?: unknown }).ReactNativeWebView !==
      undefined; // React Native webview

  return (
    isEmbedded || (hasLimitedFeatures && !isStandalone && !isInStandaloneMode)
  );
}
