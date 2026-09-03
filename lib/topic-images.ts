/**
 * Relevant stock imagery for cards/pages that don't carry a source photo.
 * Long-standing Unsplash photo IDs, hot-linked with sizing params. If one
 * 404s the <Cover> component still falls back to the gradient.
 */

const U = (id: string, w = 800) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=60`;

const POOLS: Record<string, string[]> = {
  ai: [
    U("1677442136019-21780ecad995"), // neural / generative
    U("1620712943543-bcc4688e7485"), // circuit brain
    U("1526374965328-7f61d4dc18c5"), // matrix code
  ],
  llm: [
    U("1655720828018-edd2daec9349"), // chatbot ui
    U("1620712943543-bcc4688e7485"),
    U("1526374965328-7f61d4dc18c5"),
  ],
  data: [
    U("1551288049-bebda4e38f71"), // dashboard
    U("1543286386-713bdd548da4"), // charts
    U("1460925895917-afdab827c52f"), // analytics screen
  ],
  cloud: [
    U("1544197150-b99a580bb7a8"), // server room
    U("1451187580459-43490279c0fa"), // network globe
    U("1667372393119-3d4c48d07fc9"), // data centre
  ],
  cybersecurity: [
    U("1550751827-4bd374c3f58b"), // lock code
    U("1563986768609-322da13575f3"), // hooded / security
    U("1614064641938-3bbee52942c7"), // padlock circuit
  ],
  robotics: [
    U("1531746790731-6c087fecd65a"), // robot
    U("1485827404703-89b55fcc595e"), // android
    U("1518314916381-77a37c2a49ae"), // robotic arm
  ],
  software: [
    U("1461749280684-dccba630e2f6"), // code editor
    U("1517180102446-f3ece451e9d8"), // laptop dev
    U("1555066931-4365d14bab8c"), // code close-up
  ],
  startups: [
    U("1522071820081-009f0129c71c"), // team
    U("1600880292203-757bb62b4baf"), // whiteboard
    U("1559136555-9303baea8ebd"), // pitch
  ],
  "open source": [
    U("1618477388954-7852f32655ec"), // git graph
    U("1556075798-4825dfaaf498"), // collaboration
    U("1633356122544-f134324a6cee"),
  ],
  hackathon: [
    U("1504384308090-c894fdcc538d"), // laptops hackathon
    U("1531482615713-2afd69097998"), // coding sprint
    U("1556761175-b413da4baf72"), // team laptops
  ],
  event: [
    U("1540575467063-178a50c2df87"), // conference audience
    U("1505373877841-8d25f7d46678"), // stage talk
    U("1591115765373-5207764f72e7"), // meetup
  ],
  webinar: [U("1587825140708-dfaf72ae4b04"), U("1522202176988-66273c2fd55f")],
  workshop: [U("1524178232363-1fb2b075b655"), U("1543269865-cbf427effbad")],
  default: [
    U("1518770660439-4636190af475"), // circuit board
    U("1451187580459-43490279c0fa"),
    U("1526374965328-7f61d4dc18c5"),
  ],
};

function keyFor(topic: string): string {
  const t = topic.toLowerCase();
  if (/\bllm|language model|gpt|rag\b/.test(t)) return "llm";
  if (/\bai\b|artificial|machine learning|\bml\b|genai|agentic|neural|deep learning/.test(t))
    return "ai";
  if (/data|analytics/.test(t)) return "data";
  if (/cloud|kubernetes|aws|azure|devops|serverless|infra/.test(t)) return "cloud";
  if (/security|cyber|infosec|hack the|breach|vulnerab/.test(t)) return "cybersecurity";
  if (/robot/.test(t)) return "robotics";
  if (/startup|founder|venture|scale-?up/.test(t)) return "startups";
  if (/open ?source/.test(t)) return "open source";
  if (/hackathon|buildathon|ctf/.test(t)) return "hackathon";
  if (/webinar/.test(t)) return "webinar";
  if (/workshop|training|bootcamp/.test(t)) return "workshop";
  if (/conference|summit|meetup|expo|networking|event/.test(t)) return "event";
  if (/software|developer|programming|code|web|api/.test(t)) return "software";
  return "default";
}

/** Deterministic pick so a given slug always gets the same picture. */
export function topicImage(topic: string, seed = ""): string {
  const pool = POOLS[keyFor(topic)] ?? POOLS.default;
  let h = 0;
  for (const c of seed || topic) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return pool[h % pool.length];
}
