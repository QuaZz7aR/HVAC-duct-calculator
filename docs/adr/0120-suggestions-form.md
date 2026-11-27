# 0120. Suggestions form on the site, letters through Resend

- Status: Accepted
- Date: 2026-11-27
- Source: the owner after a talk with the engineer's friend (2026-11-27): «добавить возможность предложений прямо на сайте, чтобы знакомые инженера могли сразу на сайте написать что они хотят и это приходило мне на почту»

## Context
The site has no backend: everything is calculated in the browser. Engineers who try it have no way to tell the owner what they miss, except through him personally. The site runs on Vercel Hobby; a letter needs a mail service with a free plan, and the owner's address must not be in the public repository.

## Decision
- A «Запропонувати ідею» / «Suggest an idea» button in the page footer opens a dialog: the suggestion (5-4000 characters) and an optional contact (e-mail or phone). `FeedbackDialog.tsx`, texts in `dict.feedback`.
- `POST /api/feedback` (`src/app/api/feedback/route.ts`, the first route handler) checks the body with `parseFeedback` (`src/lib/feedback/feedback.ts`, plain TS, tested) and sends a plain-text letter through the Resend HTTP API with `fetch`, no SDK, no new dependency. A contact that looks like an e-mail becomes `reply_to`.
- Settings only from the environment: `RESEND_API_KEY`, `FEEDBACK_TO` (the owner's address), optional `FEEDBACK_FROM` (default Resend's shared `onboarding@resend.dev`, which may write only to the Resend account owner's own address, enough here; a verified domain is not needed).
- Without the key or the address the button is not rendered (`page.tsx` passes `feedback` from `feedbackEnv(process.env)` at build time) and the route answers `disabled` (503). Local runs and CI need nothing.
- Anti-spam: a hidden honeypot field `website` (a filled one gets a plain «ok» and no letter) and at least 3 s between opening the form and sending it (faster gets `tooFast`, «зачекайте кілька секунд», so a quick paste is not lost silently); 3 letters per IP in 10 minutes and 50 per day per server instance (memory only, resets with the instance; the free plan allows 100 a day).
- Errors are short: invalid, too many, unavailable, failed.

## Consequences
- The page stays static; after adding or changing the variables in Vercel the site needs a redeploy so the button appears.
- The in-memory limit is weak against a determined bot (several instances, restarts); enough for a small audience. A shared store (Vercel KV, Upstash) or a captcha is deferred until there is spam.
- The help's «дані нікуди не надсилаються» stays true for the calculation: only what the user types into this form is sent.
