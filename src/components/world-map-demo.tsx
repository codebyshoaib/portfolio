"use client";
import WorldMap from "@/components/ui/world-map";

// Home base — Islamabad, Pakistan. Every line ships out from here.
const PAKISTAN = { lat: 33.6844, lng: 73.0479 };

// Worldwide destinations, spread across continents.
const DESTINATIONS = [
  { lat: 37.7749, lng: -122.4194 }, // San Francisco
  { lat: 40.7128, lng: -74.006 }, // New York
  { lat: 43.6532, lng: -79.3832 }, // Toronto
  { lat: -23.5505, lng: -46.6333 }, // São Paulo
  { lat: 51.5074, lng: -0.1278 }, // London
  { lat: 52.52, lng: 13.405 }, // Berlin
  { lat: 25.2048, lng: 55.2708 }, // Dubai
  { lat: 24.7136, lng: 46.6753 }, // Riyadh
  { lat: -1.2921, lng: 36.8219 }, // Nairobi
  { lat: -33.9249, lng: 18.4241 }, // Cape Town
  { lat: 1.3521, lng: 103.8198 }, // Singapore
  { lat: 35.6762, lng: 139.6503 }, // Tokyo
  { lat: -33.8688, lng: 151.2093 }, // Sydney
];

export default function WorldMapDemo({ avatarUrl }: { avatarUrl?: string }) {
  return (
    <div className="w-full px-6 pb-12">
      <div className="container mx-auto max-w-6xl">
        <WorldMap
          origin={PAKISTAN}
          avatarUrl={avatarUrl}
          avatarAlt="Shoaib — based in Pakistan"
          dots={DESTINATIONS.map((end) => ({ start: PAKISTAN, end }))}
          eyebrow="Based in Pakistan"
          quote={
            <>
              Sitting in Pakistan,{" "}
              <span className="text-brand">shipping worldwide solutions.</span>
            </>
          }
        />
      </div>
    </div>
  );
}
