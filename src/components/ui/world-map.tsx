"use client";
import DottedMap from "dotted-map";
import { motion } from "motion/react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useRef, useState } from "react";

interface MapProps {
  dots?: Array<{
    start: { lat: number; lng: number; label?: string };
    end: { lat: number; lng: number; label?: string };
  }>;
  lineColor?: string;
}

// Memoize the DottedMap instance outside component to avoid recreation
let cachedMap: DottedMap | null = null;
const getDottedMap = () => {
  if (!cachedMap) {
    cachedMap = new DottedMap({ height: 100, grid: "diagonal" });
  }
  return cachedMap;
};

export default function WorldMap({
  dots = [],
  lineColor = "#0ea5e9",
}: MapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // IntersectionObserver to only render when in viewport
  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Once visible, we can disconnect the observer
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "100px", // Start loading 100px before entering viewport
        threshold: 0.1,
      }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [mounted]);

  // Use a default theme during SSR to prevent hydration mismatch
  const resolvedTheme = mounted ? theme : "light";

  // Memoize the map instance
  const map = useMemo(() => getDottedMap(), []);

  // Memoize SVG generation - only regenerate when theme changes
  const svgMap = useMemo(() => {
    if (!isVisible) return ""; // Don't generate SVG until visible
    return map.getSVG({
      radius: 0.22,
      color: resolvedTheme === "dark" ? "#FFFFFF40" : "#00000040",
      shape: "circle",
      backgroundColor: resolvedTheme === "dark" ? "black" : "white",
    });
  }, [map, resolvedTheme, isVisible]);

  // Memoize projection and path creation functions
  const projectPoint = useMemo(
    () => (lat: number, lng: number) => {
      const x = (lng + 180) * (800 / 360);
      const y = (90 - lat) * (400 / 180);
      return { x, y };
    },
    []
  );

  const createCurvedPath = useMemo(
    () => (start: { x: number; y: number }, end: { x: number; y: number }) => {
      const midX = (start.x + end.x) / 2;
      const midY = Math.min(start.y, end.y) - 50;
      return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
    },
    []
  );

  // Memoize projected points to avoid recalculating on every render
  const projectedDots = useMemo(
    () =>
      dots.map((dot) => ({
        start: projectPoint(dot.start.lat, dot.start.lng),
        end: projectPoint(dot.end.lat, dot.end.lng),
        original: dot,
      })),
    [dots, projectPoint]
  );

  // Don't render until visible
  if (!isVisible) {
    return (
      <div
        ref={containerRef}
        className="w-full aspect-[2/1] dark:bg-black bg-white rounded-lg relative font-sans"
        role="img"
        aria-label="World map loading"
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full aspect-[2/1] dark:bg-black bg-white rounded-lg relative font-sans"
    >
      {svgMap && (
        <Image
          src={`data:image/svg+xml;utf8,${encodeURIComponent(svgMap)}`}
          className="h-full w-full [mask-image:linear-gradient(to_bottom,transparent,white_10%,white_90%,transparent)] pointer-events-none select-none"
          alt="World map showing global connections"
          height={495}
          width={1056}
          draggable={false}
          unoptimized
          suppressHydrationWarning
        />
      )}
      <svg
        ref={svgRef}
        viewBox="0 0 800 400"
        className="w-full h-full absolute inset-0 pointer-events-none select-none"
        aria-label="World map with connection paths"
      >
        <title>World map showing global connections and paths</title>
        {projectedDots.map((projected, i) => {
          const uniqueKey = `path-${projected.original.start.lat}-${projected.original.start.lng}-${projected.original.end.lat}-${projected.original.end.lng}-${i}`;
          return (
            <g key={uniqueKey}>
              <motion.path
                d={createCurvedPath(projected.start, projected.end)}
                fill="none"
                stroke="url(#path-gradient)"
                strokeWidth="1"
                initial={{
                  pathLength: 0,
                }}
                animate={{
                  pathLength: 1,
                }}
                transition={{
                  duration: 1,
                  delay: 0.5 * i,
                  ease: "easeOut",
                }}
              />
            </g>
          );
        })}

        <defs>
          <linearGradient id="path-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="5%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="95%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>

        {projectedDots.map((projected, i) => {
          const uniqueKey = `points-${projected.original.start.lat}-${projected.original.start.lng}-${projected.original.end.lat}-${projected.original.end.lng}-${i}`;
          return (
            <g key={uniqueKey}>
              <g key={`${uniqueKey}-start`}>
                <circle
                  cx={projected.start.x}
                  cy={projected.start.y}
                  r="2"
                  fill={lineColor}
                />
                <circle
                  cx={projected.start.x}
                  cy={projected.start.y}
                  r="2"
                  fill={lineColor}
                  opacity="0.5"
                >
                  <animate
                    attributeName="r"
                    from="2"
                    to="8"
                    dur="1.5s"
                    begin="0s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    from="0.5"
                    to="0"
                    dur="1.5s"
                    begin="0s"
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
              <g key={`${uniqueKey}-end`}>
                <circle
                  cx={projected.end.x}
                  cy={projected.end.y}
                  r="2"
                  fill={lineColor}
                />
                <circle
                  cx={projected.end.x}
                  cy={projected.end.y}
                  r="2"
                  fill={lineColor}
                  opacity="0.5"
                >
                  <animate
                    attributeName="r"
                    from="2"
                    to="8"
                    dur="1.5s"
                    begin="0s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    from="0.5"
                    to="0"
                    dur="1.5s"
                    begin="0s"
                    repeatCount="indefinite"
                  />
                </circle>
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
