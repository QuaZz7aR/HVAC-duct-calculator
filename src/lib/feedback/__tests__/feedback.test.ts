import { describe, expect, it } from "vitest";
import { buildEmail, createLimiter, defaultFrom, feedbackEnv, feedbackLimits, parseFeedback } from "../feedback";
import { en } from "@/lib/i18n/en";
import { uk } from "@/lib/i18n/uk";

const ok = { message: "Додати клапани", contact: "a@b.ua", website: "", lang: "uk", page: "/", elapsedMs: 5000 };

describe("suggestions form (ADR 0120)", () => {
  it("is off without the key or the address", () => {
    expect(feedbackEnv({})).toBeUndefined();
    expect(feedbackEnv({ RESEND_API_KEY: "k" })).toBeUndefined();
    expect(feedbackEnv({ FEEDBACK_TO: "x@y.ua" })).toBeUndefined();
    expect(feedbackEnv({ RESEND_API_KEY: " k ", FEEDBACK_TO: "x@y.ua" })).toEqual({ apiKey: "k", to: "x@y.ua", from: defaultFrom });
    expect(feedbackEnv({ RESEND_API_KEY: "k", FEEDBACK_TO: "x@y.ua", FEEDBACK_FROM: "me@d.ua" })?.from).toBe("me@d.ua");
  });

  it("accepts a normal message", () => {
    const r = parseFeedback(ok);
    expect(r).toEqual({ ok: true, value: { message: "Додати клапани", contact: "a@b.ua", lang: "uk", page: "/" } });
  });

  it("rejects empty, too long and malformed bodies", () => {
    expect(parseFeedback(null)).toEqual({ ok: false, error: "invalid" });
    expect(parseFeedback({ ...ok, message: "  ab " })).toEqual({ ok: false, error: "invalid" });
    expect(parseFeedback({ ...ok, message: "x".repeat(feedbackLimits.messageMax + 1) })).toEqual({ ok: false, error: "invalid" });
    expect(parseFeedback({ ...ok, contact: "x".repeat(feedbackLimits.contactMax + 1) })).toEqual({ ok: false, error: "invalid" });
  });

  it("treats a filled honeypot as spam and a too fast send as tooFast", () => {
    expect(parseFeedback({ ...ok, website: "http://spam" })).toEqual({ ok: false, error: "spam" });
    expect(parseFeedback({ ...ok, elapsedMs: 500 })).toEqual({ ok: false, error: "tooFast" });
    expect(parseFeedback({ ...ok, elapsedMs: undefined })).toEqual({ ok: false, error: "tooFast" });
  });

  it("limits a sender and the day", () => {
    const allow = createLimiter({ ...feedbackLimits, perSender: 2, perDay: 3 });
    const t = Date.UTC(2026, 10, 27, 12);
    expect([allow("a", t), allow("a", t + 1), allow("a", t + 2)]).toEqual([true, true, false]);
    expect(allow("a", t + feedbackLimits.windowMs + 1)).toBe(true);
    expect(allow("b", t + 3)).toBe(false); // day cap of 3 reached
    expect(allow("b", Date.UTC(2026, 10, 28, 1))).toBe(true);
  });

  it("builds a plain-text letter, reply-to only for an e-mail contact", () => {
    const env = { apiKey: "k", to: "owner@x.ua", from: defaultFrom };
    const v = { message: "Line one\n<b>two</b>", contact: "a@b.ua", lang: "uk", page: "/" };
    const mail = buildEmail(v, env);
    expect(mail.to).toEqual(["owner@x.ua"]);
    expect(mail.subject).toBe("Пропозиція: Line one");
    expect(mail.text).toContain("<b>two</b>");
    expect(mail).not.toHaveProperty("html");
    expect(mail.reply_to).toBe("a@b.ua");
    expect(buildEmail({ ...v, contact: "+380 50 000" }, env)).not.toHaveProperty("reply_to");
  });

  it("has every text in both languages", () => {
    expect(Object.keys(en.feedback.errors).sort()).toEqual(Object.keys(uk.feedback.errors).sort());
    for (const d of [uk, en]) for (const s of [...Object.values(d.feedback).filter((x) => typeof x === "string"), ...Object.values(d.feedback.errors)]) expect((s as string).trim()).not.toBe("");
  });
});
