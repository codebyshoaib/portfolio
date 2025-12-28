import { Suspense } from "react";
import { AboutSection } from "./sections/AboutSection";
import { AchievementsSection } from "./sections/AchievementsSection";
import { BlogSection } from "./sections/BlogSection";
import { CertificationsSection } from "./sections/CertificationsSection";
import { ContactSection } from "./sections/ContactSection";
import { EducationSection } from "./sections/EducationSection";
import { ExperienceSection } from "./sections/ExperienceSection";
import HeroSection from "./sections/HeroSection";
import { ProjectsSection } from "./sections/ProjectsSection";
import { ServicesSection } from "./sections/ServicesSection";
import { SkillsSection } from "./sections/SkillsSection";
import { TestimonialsSection } from "./sections/TestimonialsSection";

// Loading skeleton component
function SectionSkeleton() {
  return (
    <div className="py-20 px-6 animate-pulse">
      <div className="container mx-auto max-w-7xl">
        <div className="h-12 bg-muted rounded w-1/3 mb-8 mx-auto" />
        <div className="h-6 bg-muted rounded w-2/3 mb-12 mx-auto" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

function PortfolioContent() {
  return (
    <>
      {/* Hero section - critical, load first */}
      <Suspense fallback={<SectionSkeleton />}>
        <HeroSection />
      </Suspense>

      {/* Above the fold sections - parallel loading */}
      <Suspense fallback={<SectionSkeleton />}>
        <AboutSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <TestimonialsSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <SkillsSection />
      </Suspense>

      {/* Below the fold sections - can load progressively */}
      <Suspense fallback={<SectionSkeleton />}>
        <ExperienceSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <EducationSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <ProjectsSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <CertificationsSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <AchievementsSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <ServicesSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <BlogSection />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <ContactSection />
      </Suspense>
    </>
  );
}

export default PortfolioContent;
