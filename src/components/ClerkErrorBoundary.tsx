"use client";

import { Component, ReactNode } from "react";
import { isEmbeddedBrowser } from "@/lib/detect-embedded-browser";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  isEmbedded: boolean;
}

export class ClerkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      isEmbedded:
        typeof window !== "undefined" ? isEmbeddedBrowser() : false,
    };
  }

  static getDerivedStateFromError(): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      isEmbedded:
        typeof window !== "undefined" ? isEmbeddedBrowser() : false,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error if needed
    if (process.env.NODE_ENV === "development") {
      console.log("Clerk error caught:", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError || this.state.isEmbedded) {
      // Render fallback UI or children without Clerk
      return this.props.fallback ?? this.props.children;
    }

    return this.props.children;
  }
}

