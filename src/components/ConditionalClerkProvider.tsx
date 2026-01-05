"use client";

import { ClerkProvider } from "@clerk/nextjs";

export function ConditionalClerkProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClerkProvider>{children}</ClerkProvider>;
}
