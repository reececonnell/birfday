# AGENTS.md

## What this repo does

`birfday` finds NASA's Astronomy Picture of the Day (APOD) for the same birthday across every year from the user's birth year through the present.

The birthday is always passed at runtime. Never hard-code a user's birthday into the source.

## How to run

```bash
node index.js YYYY-MM-DD
```

If a user gives a birthday in natural language, convert it to `YYYY-MM-DD` before running.

## Source of truth

The official APOD archive page is the primary source.

For each date, the script constructs:

```text
https://apod.nasa.gov/apod/apYYMMDD.html
```

It parses the title, direct/high-resolution image when available, and provenance from that page.

The NASA APOD API is only a fallback if the archive page cannot be read. Normal runs do not require an API key.

## Output modes

Default output is chronological JSON:

```bash
node index.js YYYY-MM-DD
```

If the user explicitly asks to **show, render, display, or view the pictures in an AI/chat interface**, use:

```bash
node index.js YYYY-MM-DD --markdown
```

The Markdown mode emits headings, titles, inline Markdown image syntax, and the canonical NASA APOD link for each birthday. It is designed to be portable across AI clients that support Markdown rendering.

If the current AI/chat client does not render remote Markdown images, do not fail or rewrite the repo. Show the returned image URLs as clickable links and keep the NASA APOD links.

Each JSON record contains:

- `year`
- `age`
- `date`
- `title`
- `image_url`
- `apod_url`
- `rights.credit`
- `rights.copyright`
- `rights.license`
- `source`

Do not invent missing provenance. A `null` rights field means the parser did not find that item explicitly.

## Agent behavior

When a user asks to run their birthday:

1. Read the birthday from the user's request.
2. Convert it to `YYYY-MM-DD`.
3. If the user only asks to run/get the data, run `node index.js YYYY-MM-DD`.
4. If the user asks to see/render/display the pictures in the AI or chat, run `node index.js YYYY-MM-DD --markdown`.
5. Return results chronologically.
6. Render the Markdown directly when the client supports remote images.
7. If the client does not render remote images, surface the `image_url` values as clickable links instead.
8. If the user asks for the NASA source, use `apod_url`.
9. Preserve the returned rights/provenance when displaying or reusing an image.
10. Do not modify source code just to change the birthday.

## Rights and provenance

APOD uses several historical formats, including:

- `Credit:`
- `Image Credit:`
- `Credit & Copyright:`
- `Image Credit & Copyright:`
- `Processing & Copyright:`
- `Processing & License:`

The script normalizes these into the `rights` object while keeping unknown values as `null`.

## NASA API fallback

The fallback uses NASA's `DEMO_KEY` by default.

If the fallback hits a rate limit, use a valid `NASA_API_KEY` environment variable. Do not put an API key into source code.

## Edge cases

- APOD starts on 1995-06-16.
- Dates before APOD existed are skipped.
- A future birthday in the current year is not requested.
- February 29 birthdays only return real February 29 dates.
- Some APOD entries are not images, so `image_url` may be `null`.

## Keep it simple

This repo is intentionally a small reusable date loop.

Do not add UI frameworks, databases, authentication, or deployment infrastructure unless explicitly requested.
