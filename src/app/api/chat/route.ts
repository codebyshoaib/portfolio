import { z } from "zod";
import { retrieve } from "@/lib/rag/retrieve";
import { chatRateLimiter } from "@/lib/rate-limit";

interface Technology {
  name: string;
  category?: string;
}

interface Experience {
  jobTitle?: string;
  company?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
  achievements?: string[];
  technologies?: Technology[];
}

interface Project {
  title?: string;
  tagline?: string;
  category?: string;
  liveUrl?: string;
  githubUrl?: string;
  technologies?: Technology[];
}

interface Skill {
  name?: string;
  category?: string;
  level?: string;
  yearsOfExperience?: number;
}

interface Education {
  degree?: string;
  field?: string;
  institution?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  gpa?: string;
  description?: string;
}

interface Decision {
  title?: string;
  summary?: string;
  context?: string;
  options?: Array<{ label?: string; summary?: string }>;
  decision?: string;
  tradeoffs?: string;
  revisitTrigger?: string;
  takeaways?: string[];
}

// The whole system prompt is re-sent on every turn and Groq's free tier allows
// 6000 tokens/min, so these caps are a rate-limit budget, not a style choice.
const MAX_DECISIONS_IN_PROMPT = 5;
const MAX_EXPERIENCE_IN_PROMPT = 5;
const MAX_PROJECTS_IN_PROMPT = 6;
// Only the last few turns are worth re-sending; older context is not worth its tokens.
const MAX_HISTORY_MESSAGES = 6;

// How many chunks reach the prompt, and how much of one document may dominate.
const RETRIEVE_K = 6;
const MAX_CHUNKS_PER_DOC = 2;

const RESPONSE_RULES = `\n\nRESPONSE RULES — these override any instinct to be thorough:
- You ARE this person. Use "I" and "my". Talk like a senior engineer in a hallway chat, not a cover letter.
- HARD CAP: 3 sentences. Most answers should be 1-2. A one-line answer is a good answer.
- Lead with the answer. No preamble ("Great question", "As a...", restating the question), no summary sentence at the end.
- One idea per reply. Pick the single most relevant fact and drop the rest — the visitor can ask a follow-up.
- Plain prose only. No bullet lists, no headings, no bold. \`code\` ticks for tech names are fine.
- NEVER enumerate. A plural question ("your projects", "your skills", "your experience") is not a request for the full list — name the two strongest, say what makes them interesting, and offer to go deeper on either. Listing everything is the failure mode to avoid.
- Never volunteer a career overview unless asked for one. "Tell me about your experience" gets the current role and one number, not a timeline.
- Trade-off questions: name the constraint, the option you rejected, the cost you accepted — one sentence each, then stop. Point to /decisions if they want depth.
- Not in your profile? Say so in one line. Never invent.
- Finish the sentence you start.`;

const clip = (s: string, max: number) =>
  s.length > max ? `${s.slice(0, max).trimEnd()}…` : s;

const techNames = (tech?: Technology[]) =>
  (tech || []).map((t) => t.name).filter(Boolean);

// The client replays the whole history each turn, so this schema sees our own
// prior replies too. The 500-char cap is an abuse guard on what a visitor can
// type — applying it to assistant turns 400s the second message in any
// conversation where the first answer ran long.
const MAX_USER_CHARS = 500;

const MessageSchema = z
  .object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string().min(1).max(4000),
  })
  .refine((m) => m.role !== "user" || m.content.length <= MAX_USER_CHARS, {
    message: `User messages must be ${MAX_USER_CHARS} characters or fewer`,
    path: ["content"],
  });

const ChatRequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(50),
  profileData: z.record(z.string(), z.unknown()).optional(),
});

function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: Request) {
  try {
    // Rate limit check
    const ip = getClientIp(req);
    const { success, remaining } = chatRateLimiter.check(ip);
    if (!success) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please wait a minute." }),
        {
          status: 429,
          headers: { "Retry-After": "60", "X-RateLimit-Remaining": "0" },
        },
      );
    }

    // Parse and validate input
    const body = await req.json();
    const parsed = ChatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request",
          details: parsed.error.issues,
        }),
        { status: 400 },
      );
    }

    const { messages, profileData } = parsed.data;

    if (!process.env.GROQ_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GROQ_API_KEY is not set" }),
        { status: 500 },
      );
    }

    // Identity always ships; it is ~60 tokens and relevant to every question.
    // Everything else is retrieved.
    const buildIdentity = () => {
      const profile = (profileData as { profile?: Record<string, unknown> })
        ?.profile as
        | {
            firstName?: string;
            lastName?: string;
            headline?: string;
            shortBio?: string;
            yearsOfExperience?: number;
            location?: string;
          }
        | undefined;
      if (!profile) return "";
      return [
        `You are ${[profile.firstName, profile.lastName].filter(Boolean).join(" ")}.`,
        profile.headline && `Headline: ${profile.headline}.`,
        profile.shortBio && `About: ${profile.shortBio}`,
        profile.yearsOfExperience &&
          `${profile.yearsOfExperience} years of professional experience.`,
        profile.location && `Based in ${profile.location}.`,
      ]
        .filter(Boolean)
        .join(" ");
    };

    // Build system message with profile context
    const buildSystemMessage = () => {
      const { profile, experience, projects, skills, education, decisions } =
        (profileData as {
          profile?: {
            firstName?: string;
            lastName?: string;
            headline?: string;
            shortBio?: string;
            yearsOfExperience?: number;
            location?: string;
          };
          experience?: Experience[];
          projects?: Project[];
          skills?: Skill[];
          education?: Education[];
          decisions?: Decision[];
        }) || {};

      if (!profile) {
        return "You are a helpful AI assistant.";
      }

      let systemPrompt = `You are ${profile.firstName || ""} ${
        profile.lastName || ""
      }. `;

      if (profile.headline) {
        systemPrompt += `Your professional headline is: ${profile.headline}. `;
      }

      if (profile.shortBio) {
        systemPrompt += `About you: ${profile.shortBio} `;
      }

      if (profile.yearsOfExperience) {
        systemPrompt += `You have ${profile.yearsOfExperience} years of professional experience. `;
      }

      if (profile.location) {
        systemPrompt += `You are located in ${profile.location}. `;
      }

      // Everything below is re-sent on every turn, so it is kept deliberately
      // lean: Groq's free tier allows 6000 tokens/min and a fat profile dump
      // burned the whole budget in two messages (429 on the user's 2nd question).
      // Depth lives on the site — the twin's job is to point at it, not recite it.
      if (experience && experience.length > 0) {
        systemPrompt += `\n\nEXPERIENCE\n`;
        experience
          .slice(0, MAX_EXPERIENCE_IN_PROMPT)
          .forEach((exp: Experience) => {
            const when = exp.current
              ? `${exp.startDate}-now`
              : [exp.startDate, exp.endDate].filter(Boolean).join("-");
            systemPrompt += `- ${exp.jobTitle} at ${exp.company}${when ? ` (${when})` : ""}`;
            if (exp.description)
              systemPrompt += `: ${clip(exp.description, 160)}`;
            const wins = (exp.achievements || []).filter(Boolean).slice(0, 2);
            if (wins.length > 0)
              systemPrompt += ` Wins: ${clip(wins.join("; "), 180)}`;
            systemPrompt += `\n`;
          });
      }

      if (projects && projects.length > 0) {
        systemPrompt += `\nPROJECTS\n`;
        projects.slice(0, MAX_PROJECTS_IN_PROMPT).forEach((proj: Project) => {
          systemPrompt += `- ${proj.title}`;
          if (proj.tagline) systemPrompt += ` — ${clip(proj.tagline, 100)}`;
          const tech = techNames(proj.technologies).slice(0, 4);
          if (tech.length > 0) systemPrompt += ` [${tech.join(", ")}]`;
          systemPrompt += `\n`;
        });
      }

      // Names only — levels and year-counts are noise the model never quotes back.
      if (skills && skills.length > 0) {
        systemPrompt += `\nSKILLS\n`;
        const byCategory = new Map<string, string[]>();
        skills.forEach((skill: Skill) => {
          if (!skill.name) return;
          const category = skill.category || "Other";
          byCategory.set(category, [
            ...(byCategory.get(category) || []),
            skill.name,
          ]);
        });
        byCategory.forEach((names, category) => {
          systemPrompt += `${category}: ${names.join(", ")}\n`;
        });
      }

      if (education && education.length > 0) {
        systemPrompt += `\nEDUCATION\n`;
        education.forEach((edu: Education) => {
          systemPrompt += `- ${edu.degree}`;
          if (edu.field) systemPrompt += ` in ${edu.field}`;
          systemPrompt += `, ${edu.institution}`;
          if (edu.endDate) systemPrompt += ` (${edu.endDate})`;
          systemPrompt += `\n`;
        });
      }

      // One line each: the call and the cost. Context, options and takeaways are
      // what /decisions is for, and pointing there beats reciting it badly.
      if (decisions && decisions.length > 0) {
        systemPrompt += `\nDECISIONS YOU'VE MADE (full write-ups live at /decisions — send people there for depth)\n`;
        decisions.slice(0, MAX_DECISIONS_IN_PROMPT).forEach((d: Decision) => {
          systemPrompt += `- ${d.title}`;
          if (d.decision) systemPrompt += `: chose ${clip(d.decision, 120)}`;
          if (d.tradeoffs)
            systemPrompt += ` Accepted: ${clip(d.tradeoffs, 120)}`;
          systemPrompt += `\n`;
        });
      }

      systemPrompt += RESPONSE_RULES;

      return systemPrompt;
    };

    // Retrieval, with the static profile as the floor. The twin degrades to a
    // summary-level answer rather than an error whenever the index is missing,
    // the embedding key is absent, or nothing clears the relevance threshold.
    const lastUserMessage =
      [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
    const { chunks: retrieved, reason } = await retrieve(
      lastUserMessage,
      RETRIEVE_K,
      MAX_CHUNKS_PER_DOC,
    );

    const systemMessage =
      retrieved.length > 0
        ? [
            buildIdentity(),
            "\n\nRELEVANT BACKGROUND (retrieved for this question — answer from it; if it doesn't cover the question, say so rather than guessing):",
            ...retrieved.map(
              (c) => `- ${c.text}${c.url ? ` (read more: ${c.url})` : ""}`,
            ),
            RESPONSE_RULES,
          ].join("\n")
        : buildSystemMessage();

    if (retrieved.length === 0 && reason) {
      console.warn(`RAG fell back to the static prompt: ${reason}`);
    }

    // Only the tail of the conversation is worth re-sending — the client replays
    // everything, and every replayed turn is billed against the same 6000 TPM.
    const messagesWithSystem = [
      { role: "system", content: systemMessage },
      ...messages.slice(-MAX_HISTORY_MESSAGES),
    ];

    // Use Groq's native API directly
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          // 70b over 8b-instant: the 8b ignored the length rules and wrote essays,
          // and its free-tier budget is 6000 TPM vs 12000 here — better answers
          // and twice the headroom, which is what was 429ing the second question.
          model: "llama-3.3-70b-versatile",
          messages: messagesWithSystem,
          temperature: 0.6,
          // Brevity is the prompt's job. This is only a runaway guard, set high
          // enough that a well-behaved 3-sentence answer never gets cut mid-word.
          max_tokens: 320,
          stream: true,
        }),
      },
    );

    if (!response.ok) {
      // Groq's body says *why*; statusText alone made a 429 look like a generic
      // outage for weeks. Surface the throttle to the visitor as a throttle.
      const detail = await response.text().catch(() => "");
      console.error("Groq API error:", response.status, detail);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error:
              "I'm getting a lot of questions right now — give me a few seconds and ask again.",
          }),
          { status: 429, headers: { "Retry-After": "20" } },
        );
      }
      throw new Error(`Groq API error: ${response.status}`);
    }

    // Return the streaming response directly
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-RateLimit-Remaining": String(remaining),
      },
    });
  } catch (error) {
    console.error("Groq API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process chat request" }),
      { status: 500 },
    );
  }
}
