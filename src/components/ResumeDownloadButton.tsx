"use client";

import { Download } from "lucide-react";
import { useEffect, useState } from "react";

interface ResumeDownloadButtonProps {
  resumeFile: {
    asset?: {
      _ref: string;
      _type: "reference";
    };
    _type: "file";
  };
  title?: string;
  className?: string;
}

export function ResumeDownloadButton({
  resumeFile,
  title = "Resume",
  className,
}: ResumeDownloadButtonProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchFileUrl() {
      if (!resumeFile?.asset?._ref) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch the file asset to get the URL
        const response = await fetch(
          `/api/resume?assetId=${resumeFile.asset._ref}`
        );
        if (response.ok) {
          const data = await response.json();
          setFileUrl(data.url);
        }
      } catch (error) {
        console.error("Error fetching resume file:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFileUrl();
  }, [resumeFile]);

  const handleDownload = () => {
    if (!fileUrl) return;

    // Create a temporary anchor element to trigger download
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = `${title.replace(/\s+/g, "-")}.pdf`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <button
        type="button"
        disabled
        className={`px-4 py-2 @md/hero:px-6 @md/hero:py-3 rounded-lg border opacity-50 cursor-not-allowed text-sm @md/hero:text-base ${className}`}
      >
        {title}
      </button>
    );
  }

  if (!fileUrl) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      className={`px-4 py-2 @md/hero:px-6 @md/hero:py-3 rounded-lg border hover:bg-accent transition-colors text-sm @md/hero:text-base flex items-center gap-2 ${className}`}
    >
      <Download className="w-4 h-4" />
      {title}
    </button>
  );
}
