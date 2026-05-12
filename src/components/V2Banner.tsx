"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "v2-banner-dismissed";

export function V2Banner() {
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      // Storage unavailable — show banner anyway, harmless.
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Ignore.
    }
  };

  if (!mounted || dismissed) return null;

  return (
    <div
      role="region"
      aria-label="New experimental interface available"
      className="v2-banner"
    >
      <Link
        href="/v2"
        className="v2-banner-link"
        aria-label="Open the new terminal interface"
      >
        <span className="v2-banner-dot" aria-hidden="true" />
        <span className="v2-banner-label mx-2">NEW</span>
        <span className="v2-banner-text">
          Trying a new interface. Built like the tools I use.
        </span>
        <span className="v2-banner-cta" aria-hidden="true">
          Open terminal →
        </span>
      </Link>
      <button
        type="button"
        onClick={handleDismiss}
        className="v2-banner-dismiss"
        aria-label="Dismiss banner"
      >
        ×
      </button>

      <style jsx>{`
        .v2-banner {
          position: fixed;
          top: 16px;
          right: 16px;
          z-index: 50;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 8px 8px 14px;
          background: #0e0e0c;
          border: 1px solid #26241f;
          border-radius: 999px;
          box-shadow:
            0 8px 24px rgba(0, 0, 0, 0.4),
            0 1px 0 rgba(255, 255, 255, 0.04) inset;
          font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
          font-size: 12px;
          color: #e8e6e1;
          max-width: calc(100vw - 32px);
          animation: v2-banner-rise 420ms cubic-bezier(0.16, 1, 0.3, 1) 600ms
            backwards;
        }

        @keyframes v2-banner-rise {
          from {
            opacity: 0;
            transform: translateY(-12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes v2-banner-pulse {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(127, 176, 105, 0.55);
          }
          50% {
            box-shadow: 0 0 0 6px transparent;
          }
        }

        .v2-banner-link {
          display: flex;
          align-items: center;
          gap: 10px;
          color: inherit;
          text-decoration: none;
          padding-right: 4px;
        }

        .v2-banner-dot {
          display: inline-block;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #7fb069;
          animation: v2-banner-pulse 2.4s ease-out infinite;
          flex-shrink: 0;
        }

        .v2-banner-label {
          color: #e8a33d;
          font-weight: 500;
          letter-spacing: 0.08em;
          font-size: 10px;
          flex-shrink: 0;
        }

        .v2-banner-text {
          color: #b8b5ad;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .v2-banner-cta {
          color: #7fb069;
          font-weight: 500;
          padding-left: 8px;
          border-left: 1px solid #26241f;
          margin-left: 4px;
          flex-shrink: 0;
          transition: color 120ms ease;
        }

        .v2-banner-link:hover .v2-banner-cta {
          color: #a8d490;
        }

        .v2-banner-dismiss {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: transparent;
          border: none;
          color: #807d76;
          font-size: 18px;
          line-height: 1;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          flex-shrink: 0;
          transition: all 120ms ease;
        }

        .v2-banner-dismiss:hover {
          color: #e8e6e1;
          background: #1a1a17;
        }

        .v2-banner-dismiss:focus-visible {
          outline: 1px solid #7fb069;
          outline-offset: 2px;
        }

        .v2-banner-link:focus-visible {
          outline: 1px solid #7fb069;
          outline-offset: 4px;
          border-radius: 999px;
        }

        @media (max-width: 640px) {
          .v2-banner {
            top: 12px;
            right: 12px;
            left: 12px;
            justify-content: center;
            font-size: 11px;
            padding: 7px 7px 7px 12px;
          }
          .v2-banner-text {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .v2-banner {
            animation: none;
          }
          .v2-banner-dot {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
