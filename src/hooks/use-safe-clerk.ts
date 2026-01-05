"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { isEmbeddedBrowser } from "@/lib/detect-embedded-browser";

/**
 * Safe wrapper for Clerk hooks that returns null/undefined values
 * when Clerk is not available (e.g., in embedded browsers)
 * Always calls hooks (React rules) - Clerk hooks return defaults when provider missing
 */
export function useSafeClerk() {
  const [isEmbedded, setIsEmbedded] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsEmbedded(isEmbeddedBrowser());
    }
  }, []);

  // Always call hooks (React rules)
  // Clerk hooks will return default values if ClerkProvider is not in the tree
  const userResult = useUser();
  const clerkResult = useClerk();

  // If we detected embedded browser, force return guest values
  // This overrides any Clerk values since ClerkProvider won't be rendered
  if (isEmbedded === true) {
    return {
      isSignedIn: false,
      signOut: undefined,
      user: null,
      clerk: null,
    };
  }

  // Normal browser - return Clerk values (or defaults if ClerkProvider missing)
  return {
    isSignedIn: userResult?.isSignedIn ?? false,
    signOut: clerkResult?.signOut,
    user: userResult?.user ?? null,
    clerk: clerkResult ?? null,
  };
}

