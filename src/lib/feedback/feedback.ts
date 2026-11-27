// Suggestions form (ADR 0120): plain TS, no framework imports, so it is tested without a server.
// The route handler in `src/app/api/feedback/route.ts` wires it to Resend.

/** Limits of the form. */
export const feedbackLimits = {
  messageMin: 5,
  messageMax: 4000,
  contactMax: 200,
  /** a human needs at least this long between opening the form and sending it */
  minFillMs: 3000,
  /** per sender (IP), within `windowMs` */
  perSender: 3,
  windowMs: 10 * 60 * 1000,
  /** per server instance and day, keeps well under the free plan (100 letters a day) */
  perDay: 50,
} as const;

export type FeedbackError = "invalid" | "spam" | "tooFast" | "tooMany" | "disabled" | "failed";

export interface Feedback {
  message: string;
  contact: string;
  lang: string;
  page: string;
}

/** Server settings from the environment: the key and the address live only there, never in the code. */
export interface FeedbackEnv {
  apiKey: string;
  to: string;
  from: string;
}

/** Resend's shared test sender: it may write only to the account owner's own address, which is what we need. */
export const defaultFrom = "HVAC calculator <onboarding@resend.dev>";

export function feedbackEnv(env: Record<string, string | undefined>): FeedbackEnv | undefined {
  const apiKey = env.RESEND_API_KEY?.trim();
  const to = env.FEEDBACK_TO?.trim();
  if (!apiKey || !to) return undefined;
  return { apiKey, to, from: env.FEEDBACK_FROM?.trim() || defaultFrom };
}

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Checks a posted body. `website` is the hidden honeypot, `openedAt` the time the form was opened (client clock is not trusted: only the elapsed time counts). */
export function parseFeedback(body: unknown): { ok: true; value: Feedback } | { ok: false; error: FeedbackError } {
  if (typeof body !== "object" || body === null) return { ok: false, error: "invalid" };
  const b = body as Record<string, unknown>;
  if (typeof b.website === "string" && b.website.trim() !== "") return { ok: false, error: "spam" };
  const elapsed = typeof b.elapsedMs === "number" ? b.elapsedMs : 0;
  // too fast: maybe a bot, maybe a quick paste, so the person is told to send again
  if (!(elapsed >= feedbackLimits.minFillMs)) return { ok: false, error: "tooFast" };
  const raw = typeof b.message === "string" ? b.message.trim() : "";
  if (raw.length < feedbackLimits.messageMin || raw.length > feedbackLimits.messageMax) return { ok: false, error: "invalid" };
  const contact = typeof b.contact === "string" ? b.contact.trim() : "";
  if (contact.length > feedbackLimits.contactMax) return { ok: false, error: "invalid" };
  return { ok: true, value: { message: raw, contact, lang: text(b.lang, 5), page: text(b.page, 200) } };
}

/** A sliding-window limit per sender plus a daily cap. Memory only: it resets with the server instance, enough against a careless bot. */
export function createLimiter(limits: { perSender: number; perDay: number; windowMs: number } = feedbackLimits) {
  const hits = new Map<string, number[]>();
  let day = "";
  let dayCount = 0;
  return (sender: string, now: number): boolean => {
    const today = new Date(now).toISOString().slice(0, 10);
    if (today !== day) { day = today; dayCount = 0; }
    if (dayCount >= limits.perDay) return false;
    const recent = (hits.get(sender) ?? []).filter((t) => now - t < limits.windowMs);
    if (recent.length >= limits.perSender) { hits.set(sender, recent); return false; }
    recent.push(now);
    hits.set(sender, recent);
    dayCount++;
    // keep the map small
    if (hits.size > 1000) for (const [k, v] of hits) if (v.every((t) => now - t >= limits.windowMs)) hits.delete(k);
    return true;
  };
}

/** The letter for Resend's POST /emails. Plain text only, so nothing the sender typed is rendered as HTML. */
export function buildEmail(f: Feedback, env: FeedbackEnv) {
  const first = f.message.split("\n")[0].slice(0, 60);
  const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.contact) ? f.contact : undefined;
  return {
    from: env.from,
    to: [env.to],
    subject: `Пропозиція: ${first}`,
    text: [f.message, "", `Контакт: ${f.contact || "—"}`, `Мова: ${f.lang || "—"}`, `Сторінка: ${f.page || "—"}`].join("\n"),
    ...(email ? { reply_to: email } : {}),
  };
}
