"use client";

import { MessageCircle, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useSidebar } from "./ui/sidebar";

interface ProfileImageCarouselProps {
  images: Array<{
    url: string;
    alt?: string;
  }>;
  firstName: string;
  lastName: string;
  autoSlideInterval?: number;
}

export function ProfileImageCarousel({
  images,
  firstName,
  lastName,
  autoSlideInterval = 3000,
}: ProfileImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [mounted, setMounted] = useState(false);
  const hasSetMounted = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Always call hooks unconditionally (React rules)
  const { toggleSidebar, open } = useSidebar();

  useEffect(() => {
    if (!hasSetMounted.current) {
      hasSetMounted.current = true;
      setMounted(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // hasSetMounted ref is stable, doesn't need to be in deps

  // Auto-slide functionality
  useEffect(() => {
    if (!mounted || images.length <= 1 || isHovered) return;

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, autoSlideInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [mounted, images.length, autoSlideInterval, isHovered]);

  const handleClick = () => {
    if (mounted) {
      toggleSidebar();
    }
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    // Reset auto-slide timer when manually changing slide
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (!isHovered && images.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
      }, autoSlideInterval);
    }
  };

  if (!images || images.length === 0) return null;

  const currentImage = images[currentIndex];

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={handleClick}
        className="relative aspect-square rounded-2xl overflow-hidden border-4 border-primary/20 block group cursor-pointer w-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label="Toggle AI Chat Sidebar"
      >
        <Image
          src={currentImage.url}
          alt={currentImage.alt || `${firstName} ${lastName}`}
          fill
          className="object-cover transition-opacity duration-500"
          priority={currentIndex === 0}
        />

        {/* Image indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {images.map((_, index) => (
              <div
                key={index}
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  goToSlide(index);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    goToSlide(index);
                  }
                }}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  index === currentIndex
                    ? "w-8 bg-white"
                    : "w-2 bg-white/50 hover:bg-white/75"
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Online Badge */}
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full z-10">
          <div className="relative">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
            <div className="absolute inset-0 w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" />
          </div>
          <span className="text-xs font-medium text-white">Online</span>
        </div>

        {/* Hover Overlay */}
        {mounted && (
          <div
            className={`absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300 z-20 ${
              isHovered ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="text-center space-y-3">
              {open ? (
                <X className="w-12 h-12 text-white mx-auto" />
              ) : (
                <MessageCircle className="w-12 h-12 text-white mx-auto" />
              )}

              <div className="text-white text-xl font-semibold">
                {open ? "Close Chat" : "Chat with AI Twin"}
              </div>
              <div className="text-white/80 text-sm">
                {open ? "Click to close chat" : "Click to open chat"}
              </div>
            </div>
          </div>
        )}
      </button>
    </div>
  );
}

