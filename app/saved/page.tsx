import type { Metadata } from "next";
import { provider } from "@/lib/provider";
import { queryOpportunities } from "@/lib/hunt/queries";
import { ACTIVE_HUNT_CATEGORIES } from "@/lib/hunt/types";
import { Dashboard } from "@/components/dashboard";

export const metadata: Metadata = {
  title: "My TechPulse",
  description:
    "Your saved news, events, hackathons and Hunt opportunities, your calendar and upcoming deadlines.",
};

export default async function SavedPage() {
  const [news, events, hackathons, opportunities] = await Promise.all([
    provider.listNews(),
    provider.listEvents(),
    provider.listHackathons(),
    queryOpportunities({ type: ACTIVE_HUNT_CATEGORIES }).catch(() => []),
  ]);

  return (
    <Dashboard news={news} events={events} hackathons={hackathons} opportunities={opportunities} />
  );
}
