import PortfolioClient from "./portfolio-client";
import { getPortfolioContent } from "./portfolio-content";

export const revalidate = 60;

export default async function Home() {
  const content = await getPortfolioContent();

  return <PortfolioClient content={content} />;
}
