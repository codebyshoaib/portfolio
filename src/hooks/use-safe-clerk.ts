"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { isEmbeddedBrowser } from "@/lib/detect-embedded-browser";

/**
 * Safe wrapper for Clerk hooks that returns null/undefined values
 * when Clerk is not available (e.g., in embedded browsers)
 * Always calls hooks unconditionally (React rules)
 */
export function useSafeClerk() {
  // Check for embedded browser synchronously
  const isEmbedded =
    typeof window !== "undefined" ? isEmbeddedBrowser() : false;

  // Always call hooks unconditionally (React rules)
  // Clerk hooks should return default values when ClerkProvider is missing
  const userResult = useUser();
  const clerkResult = useClerk();

  // If embedded browser detected, override with guest values
  // This ensures we never try to use Clerk functionality in embedded browsers
  if (isEmbedded) {
    return {
      isSignedIn: false,
      signOut: undefined,
      user: null,
      clerk: null,
    };
  }

  // Normal browser - return Clerk values
  // If ClerkProvider is missing, these will be default/empty values
  return {
    isSignedIn: userResult?.isSignedIn ?? false,
    signOut: clerkResult?.signOut,
    user: userResult?.user ?? null,
    clerk: clerkResult ?? null,
  };
}
