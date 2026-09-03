/**
 * Seed script. Loads the sample dataset from lib/data into PostgreSQL.
 * Run with: DATABASE_URL=... npx prisma db push && npm run seed
 *
 * Kept dependency-light on purpose — it imports the same arrays the mock
 * provider uses, so the seeded DB matches the MVP exactly.
 */
import { PrismaClient } from "@prisma/client";
import { NEWS } from "../lib/data/news";
import { EVENTS } from "../lib/data/events";
import { HACKATHONS } from "../lib/data/hackathons";

const prisma = new PrismaClient();

async function main() {
  for (const n of NEWS) {
    await prisma.news.upsert({
      where: { slug: n.slug },
      update: {},
      create: {
        slug: n.slug,
        title: n.title,
        summary: n.summary,
        content: n.content,
        source: n.source,
        sourceUrl: n.sourceUrl,
        category: n.category,
        subcategory: n.subcategory,
        tags: n.tags,
        trending: n.trending,
        verifiedSource: n.verifiedSource,
        publishedAt: new Date(n.publishedAt),
      },
    });
  }

  for (const e of EVENTS) {
    await prisma.event.upsert({
      where: { slug: e.slug },
      update: {},
      create: {
        slug: e.slug,
        title: e.title,
        description: e.description,
        about: e.about,
        organizer: e.organizer,
        eventType: e.eventType,
        categories: e.categories,
        topics: e.topics,
        mode: e.mode,
        city: e.city,
        country: e.country,
        venue: e.venue,
        startDate: new Date(e.startDate),
        endDate: new Date(e.endDate),
        time: e.time,
        price: e.price,
        registrationRequired: e.registrationRequired,
        websiteUrl: e.websiteUrl,
        registrationUrl: e.registrationUrl,
        registrationDeadline: e.registrationDeadline
          ? new Date(e.registrationDeadline)
          : null,
        verified: e.verified,
        featured: e.featured,
        speakers: e.speakers,
        schedule: e.schedule,
      },
    });
  }

  for (const h of HACKATHONS) {
    await prisma.hackathon.upsert({
      where: { slug: h.slug },
      update: {},
      create: {
        slug: h.slug,
        title: h.title,
        description: h.description,
        challenge: h.challenge,
        requirements: h.requirements,
        organizer: h.organizer,
        technologies: h.technologies,
        categories: h.categories,
        region: h.region,
        mode: h.mode,
        city: h.city,
        startDate: new Date(h.startDate),
        endDate: new Date(h.endDate),
        registrationDeadline: new Date(h.registrationDeadline),
        durationHours: h.durationHours,
        prizePool: h.prizePool,
        prizes: h.prizes,
        keyDates: h.keyDates,
        teamMin: h.teamMin,
        teamMax: h.teamMax,
        difficulty: h.difficulty,
        websiteUrl: h.websiteUrl,
        registrationUrl: h.registrationUrl,
        verified: h.verified,
        featured: h.featured,
      },
    });
  }

  console.log(
    `Seeded ${NEWS.length} articles, ${EVENTS.length} events, ${HACKATHONS.length} hackathons.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
