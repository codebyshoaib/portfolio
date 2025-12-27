"use client";

import dynamic from "next/dynamic";

// Lazy load WorldMapDemo - it's heavy and not critical for initial render
const WorldMapDemo = dynamic(() => import("./world-map-demo"), {
  ssr: false,
  loading: () => (
    <div className="w-full px-6 pb-12">
      <div className="container mx-auto max-w-6xl">
        <div className="w-full aspect-[2/1] dark:bg-black bg-white rounded-lg animate-pulse" />
      </div>
    </div>
  ),
});

export default function WorldMapWrapper() {
  return <WorldMapDemo />;
}

