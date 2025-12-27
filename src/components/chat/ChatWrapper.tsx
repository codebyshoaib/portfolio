import { defineQuery } from "next-sanity";
import Chat from "@/components/chat/Chat";
import { sanityFetch } from "@/sanity/lib/live";
import SidebarToggle from "../SidebarToggle";
import type { ChatData } from "@/components/chat/Chat";

const CHAT_PROFILE_QUERY = defineQuery(`{
    "profile": *[_id == "singleton-profile"][0]{
      firstName,
      lastName,
      headline,
      shortBio,
      fullBio,
      email,
      phone,
      location,
      availability,
      socialLinks,
      yearsOfExperience,
      stats
    },
    "experience": *[_type == "experience"] | order(startDate desc){
      _id,
      jobTitle,
      company,
      location,
      startDate,
      endDate,
      current,
      description,
      achievements[],
      technologies[]->{name, category}
    },
    "projects": *[_type == "project"] | order(order asc){
      _id,
      title,
      tagline,
      category,
      liveUrl,
      githubUrl,
      technologies[]->{name, category}
    },
    "skills": *[_type == "skill"] | order(name asc){
      _id,
      name,
      category,
      level,
      yearsOfExperience,
      percentage
    },
    "education": *[_type == "education"] | order(endDate desc){
      _id,
      degree,
      field,
      institution,
      location,
      startDate,
      endDate,
      description,
      gpa
    }
  }`);

async function ChatWrapper() {
  const { data: chatData } = await sanityFetch({ query: CHAT_PROFILE_QUERY });

  return (
    <div className="h-full w-full">
      <div className="md:hidden p-2 sticky top-0 z-10">
        <SidebarToggle />
      </div>

      {/* Type assertion needed because Sanity query result types are more specific than ChatData */}
      <Chat profile={chatData as ChatData} />
    </div>
  );
}

export default ChatWrapper;
