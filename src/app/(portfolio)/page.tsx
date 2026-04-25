import PortfolioContent from "@/components/PortfolioContent";

export const revalidate = 3600; // revalidate at most every hour

export default function Home() {
  return <PortfolioContent />;
}
