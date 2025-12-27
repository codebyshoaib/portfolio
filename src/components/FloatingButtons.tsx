"use client";

import { useSidebar } from "./ui/sidebar";
import { ModeToggle } from "./ui/DarkModeToggle";
import SidebarToggle from "./SidebarToggle";

export function FloatingButtons() {
  const { open, isMobile, openMobile } = useSidebar();
  const isSidebarOpen = isMobile ? openMobile : open;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse md:flex-row gap-3 items-end">
      {/* Theme Toggle - appears above chat button on mobile, to the left on desktop */}
      <div className="relative group">
        {/* Tooltip */}
        <div className="absolute bottom-full right-0 mb-3 px-3 py-1.5 rounded-md bg-popover text-popover-foreground text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-lg border border-border md:right-auto md:left-0">
          Toggle theme
          {/* Tooltip arrow */}
          <div className="absolute -bottom-1 right-4 w-2 h-2 rotate-45 bg-popover border-r border-b border-border md:right-auto md:left-4" />
        </div>
        <div className="w-14 h-14">
          <ModeToggle />
        </div>
      </div>

      {/* Chat Toggle - only show if sidebar is closed */}
      {!isSidebarOpen && <SidebarToggle />}
    </div>
  );
}

