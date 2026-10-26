# 0015. Vercel Web Analytics, page views only

- Status: Accepted
- Date: 2026-10-11
- Source: owner decision; PR #15

## Context
The owner wants demand data for the site.

## Decision
**Web analytics** is Vercel Web Analytics: the `@vercel/analytics` package (the only runtime dependency besides Next, React, Zod) and one `<Analytics />` in the root layout. It is cookie-free page-view counting only; the component sends no custom events, so calculator inputs never leave the browser (keep it that way).

## Consequences
- The script is a no-op in dev; data is collected only after the owner turns on Web Analytics in the Vercel project.
- The Vercel Hobby plan is for non-commercial use: moving to a paid service (see the commercial plan) requires the Pro plan.
