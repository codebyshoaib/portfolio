"use client";

import { SignInButton, useUser } from "@clerk/nextjs";
import { MessageSquare } from "lucide-react";
import { useSidebar } from "./ui/sidebar";

function SidebarToggle() {
  const { toggleSidebar, open, isMobile, openMobile } = useSidebar();
  const { isSignedIn } = useUser();

  const isSidebarOpen = isMobile ? openMobile : open;

  if (isSidebarOpen) return null;

  const buttonStyles = `relative w-14 h-14 rounded-full 
    bg-background border border-border
    shadow-sm hover:shadow-md
    transition-all duration-200 
    hover:scale-105
    flex items-center justify-center
    backdrop-blur-sm
    hover:bg-accent/50`;

  return (
    <div className="group">
      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-3 px-3 py-1.5 rounded-md bg-popover text-popover-foreground text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg border border-border">
        Chat with My AI Twin
        {/* Tooltip arrow */}
        <div className="absolute -bottom-1 right-4 w-2 h-2 rotate-45 bg-popover border-r border-b border-border" />
      </div>

      {isSignedIn ? (
        <button
          type="button"
          onClick={toggleSidebar}
          className={buttonStyles}
          aria-label="Chat with AI Twin"
        >
          <MessageSquare className="h-5 w-5 text-foreground/80 group-hover:text-foreground transition-colors" />
        </button>
      ) : (
        <SignInButton mode="redirect">
          <button
            type="button"
            className={buttonStyles}
            aria-label="Sign in to chat with AI Twin"
          >
            <MessageSquare className="h-5 w-5 text-foreground/80 group-hover:text-foreground transition-colors" />
          </button>
        </SignInButton>
      )}
    </div>
  );
}

export default SidebarToggle;
