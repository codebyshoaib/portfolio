"use client";

import { SignIn } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { isEmbeddedBrowser } from "@/lib/detect-embedded-browser";

export default function SignInPage() {
  const [isEmbedded, setIsEmbedded] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsEmbedded(isEmbeddedBrowser());
    }
  }, []);

  if (isEmbedded) {
    return (
      <div className="flex min-h-screen items-center justify-center pt-20 px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Guest Chat Available</h1>
          <p className="text-muted-foreground mb-4">
            You can use the chat feature without signing in. Click the chat
            button to get started!
          </p>
          <p className="text-sm text-muted-foreground">
            To sign in with your account, please open this page in a regular
            browser (Safari, Chrome, etc.).
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <EmbeddedBrowserWarning />
      <div className="flex min-h-screen items-center justify-center pt-20">
        <SignIn />
      </div>
    </>
  );
}
