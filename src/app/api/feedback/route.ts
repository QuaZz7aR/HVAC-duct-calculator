import { buildEmail, createLimiter, feedbackEnv, parseFeedback, type FeedbackError } from "@/lib/feedback/feedback";

// Suggestions form (ADR 0120): the letter goes through Resend's HTTP API, no SDK dependency.
const allow = createLimiter();
const fail = (error: FeedbackError, status: number) => Response.json({ ok: false, error }, { status });

export async function POST(request: Request) {
  const env = feedbackEnv(process.env);
  if (!env) return fail("disabled", 503);
  let body: unknown;
  try { body = await request.json(); } catch { return fail("invalid", 400); }
  const parsed = parseFeedback(body);
  // a bot that filled the honeypot gets a plain «ok» and no letter
  if (!parsed.ok) return parsed.error === "spam" ? Response.json({ ok: true }) : fail(parsed.error, 400);
  const sender = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (!allow(sender, Date.now())) return fail("tooMany", 429);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(buildEmail(parsed.value, env)),
    });
    if (!res.ok) return fail("failed", 502);
  } catch { return fail("failed", 502); }
  return Response.json({ ok: true });
}
