import type { Metadata } from "next";
import { provider } from "@/lib/provider";
import { Dashboard } from "@/components/dashboard";

export const metadata: Metadata = {
  title: "My TechPulse",
  description:
    "Your saved news, events and hackathons, your calendar and upcoming deadlines.",
};

export default async function SavedPage() {
  const [news, events, hackathons] = await Promise.all([
    provider.listNews(),
    provider.listEvents(),
    provider.listHackathons(),
  ]);

  return <Dashboard news={news} events={events} hackathons={hackathons} />;
}
