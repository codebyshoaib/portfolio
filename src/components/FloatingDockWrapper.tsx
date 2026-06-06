"use client";

import dynamic from "next/dynamic";
import { FloatingDockClient } from "./FloatingDockClient";

const FloatingDockClientDynamic = dynamic(
  () => Promise.resolve({ default: FloatingDockClient }),
  { ssr: false },
);

interface FloatingDockWrapperProps {
  navItems: Array<{
    title?: string | null;
    href?: string | null;
    icon?: string | null;
    isExternal?: boolean | null;
  }>;
  calLink?: string | null;
}

export function FloatingDockWrapper({
  navItems,
  calLink,
}: FloatingDockWrapperProps) {
  return <FloatingDockClientDynamic navItems={navItems} calLink={calLink} />;
}
