"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ModeToggle() {
  const { setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Only render on client to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const buttonStyles = `relative w-14 h-14 rounded-full 
    bg-background border border-border
    shadow-sm hover:shadow-md
    transition-all duration-200 
    hover:scale-105
    flex items-center justify-center
    backdrop-blur-sm
    hover:bg-accent/50`;

  if (!mounted) {
    // Return a placeholder with same dimensions to prevent layout shift
    return (
      <button
        type="button"
        className={buttonStyles}
        aria-label="Toggle theme"
        disabled
      >
        <Sun className="h-5 w-5 text-foreground/80" />
      </button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`${buttonStyles} group`}
          aria-label="Toggle theme"
        >
          <Sun className="h-5 w-5 text-foreground/80 group-hover:text-foreground transition-colors scale-100 rotate-0 dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-5 w-5 text-foreground/80 group-hover:text-foreground transition-colors scale-0 rotate-90 dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Toggle theme</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
