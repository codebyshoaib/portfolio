"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { isEmbeddedBrowser } from "@/lib/detect-embedded-browser";

export function ConditionalClerkProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isEmbedded, setIsEmbedded] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsEmbedded(isEmbeddedBrowser());
    }
  }, []);

  // Don't render ClerkProvider in embedded browsers
  // This prevents any Clerk API calls, OAuth attempts, etc.
  if (isEmbedded === true) {
    return <>{children}</>;
  }

  // If we haven't determined yet (SSR), render without Clerk to be safe
  // Once client-side hydration happens, it will re-render with Clerk if needed
  if (isEmbedded === null) {
    return <>{children}</>;
  }

  // Normal browser - use Clerk
  return <ClerkProvider>{children}</ClerkProvider>;
}

