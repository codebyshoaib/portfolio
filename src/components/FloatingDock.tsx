import { defineQuery } from "next-sanity";
import { sanityFetch } from "@/sanity/lib/live";
import { FloatingDockWrapper } from "./FloatingDockWrapper";

// Combined dock query: navigation items + the profile's Cal.com booking link.
// These are two different documents (navigation list + profile singleton), but
// the dock needs both, so we fetch them in one round-trip. The shape is
// intentionally a wrapper object so the nav/profile coupling reads as deliberate.
const DOCK_DATA_QUERY = defineQuery(`{
  "navItems": *[_type == "navigation"] | order(order asc){
    title,
    href,
    icon,
    isExternal
  },
  "calLink": *[_id == "singleton-profile"][0].calLink
}`);

export async function FloatingDock() {
  const { data } = await sanityFetch({ query: DOCK_DATA_QUERY });
  const navItems = data?.navItems ?? [];
  const calLink = data?.calLink ?? null;

  // Render the dock if there are nav items OR a booking link to surface.
  if (navItems.length === 0 && !calLink) {
    return null;
  }

  return <FloatingDockWrapper navItems={navItems} calLink={calLink} />;
}
