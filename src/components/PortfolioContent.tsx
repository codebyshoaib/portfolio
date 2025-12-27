import { AboutSection } from "./sections/AboutSection";
import { ExperienceSection } from "./sections/ExperienceSection";
import HeroSection from "./sections/HeroSection";
import { SkillsSection } from "./sections/SkillsSection";
import { TestimonialsSection } from "./sections/TestimonialsSection";

function PortfolioContent() {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <TestimonialsSection />
      <SkillsSection />
      <ExperienceSection />
    </>
  );
}

export default PortfolioContent;
