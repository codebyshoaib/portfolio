"use client";

import { ExternalLink, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  getEmbeddedBrowserMessage,
  isEmbeddedBrowser,
} from "@/lib/detect-embedded-browser";

export function EmbeddedBrowserWarning() {
  const [isEmbedded, setIsEmbedded] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [message, setMessage] = useState<{
    title: string;
    message: string;
    instructions: string[];
  } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const embedded = isEmbeddedBrowser();
      setIsEmbedded(embedded);
      if (embedded) {
        setMessage(getEmbeddedBrowserMessage());
        // Check if user has dismissed this warning before (in this session)
        const dismissedKey = "embedded-browser-warning-dismissed";
        const wasDismissed = sessionStorage.getItem(dismissedKey);
        if (wasDismissed) {
          setDismissed(true);
        }
      }
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("embedded-browser-warning-dismissed", "true");
    }
  };

  const handleCopyUrl = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      // You could show a toast here
    }
  };

  if (!isEmbedded || dismissed || !message) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 dark:bg-yellow-600 text-yellow-900 dark:text-yellow-100 shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">{message.title}</h3>
            <p className="text-xs mb-2">{message.message}</p>
            <ul className="text-xs space-y-1 mb-2">
              {message.instructions.map((instruction, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-yellow-700 dark:text-yellow-200">
                    {index + 1}.
                  </span>
                  <span>{instruction}</span>
                </li>
              ))}
            </ul>
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleCopyUrl}
                className="text-xs px-3 py-1.5 bg-yellow-600 dark:bg-yellow-700 hover:bg-yellow-700 dark:hover:bg-yellow-800 rounded-md font-medium transition-colors flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                Copy URL
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-yellow-900 dark:text-yellow-100 hover:text-yellow-700 dark:hover:text-yellow-300 transition-colors p-1"
            aria-label="Dismiss warning"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

