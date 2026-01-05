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

/**
 * Gets a user-friendly message about opening in a regular browser
 */
export function getEmbeddedBrowserMessage(): {
  title: string;
  message: string;
  instructions: string[];
} {
  const userAgent = window.navigator.userAgent.toLowerCase();

  if (userAgent.includes("linkedin")) {
    return {
      title: "Open in Your Browser",
      message:
        "Google sign-in doesn't work in LinkedIn's in-app browser. Please open this page in your regular browser.",
      instructions: [
        "Tap the menu (⋯) in the top-right corner",
        "Select 'Open in Browser' or 'Open in Safari/Chrome'",
        "Then try signing in again",
      ],
    };
  }

  if (userAgent.includes("fban") || userAgent.includes("fbav")) {
    return {
      title: "Open in Your Browser",
      message:
        "Google sign-in doesn't work in Facebook's in-app browser. Please open this page in your regular browser.",
      instructions: [
        "Tap the menu (⋯) in the top-right corner",
        "Select 'Open in Browser' or 'Open in Safari/Chrome'",
        "Then try signing in again",
      ],
    };
  }

  if (userAgent.includes("twitter")) {
    return {
      title: "Open in Your Browser",
      message:
        "Google sign-in doesn't work in Twitter's in-app browser. Please open this page in your regular browser.",
      instructions: [
        "Tap the menu (⋯) in the top-right corner",
        "Select 'Open in Browser' or 'Open in Safari/Chrome'",
        "Then try signing in again",
      ],
    };
  }

  // Generic message
  return {
    title: "Open in Your Browser",
    message:
      "Google sign-in requires a regular browser. Please open this page in Safari, Chrome, or another browser app.",
    instructions: [
      "Copy the URL from your current browser",
      "Open Safari, Chrome, or your preferred browser",
      "Paste the URL and navigate to the page",
      "Then try signing in again",
    ],
  };
}
