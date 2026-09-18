# birfday

**The Astronomy Picture of the Day from every birthday you've had.**

Give `birfday` any date of birth. It loops through that same month and day for every year since, reads the official NASA APOD archive page for each date, and returns a clean JSON timeline.

## Run it

Requires Node.js 18+.

```bash
node index.js YYYY-MM-DD
```

Or:

```bash
npm run birfday -- YYYY-MM-DD
```

Replace `YYYY-MM-DD` with the birthday you want to run.

No NASA API key is required for normal use.

## Source strategy

`birfday` is archive-first:

```text
official APOD archive page
        ↓
parse title + high-res image + provenance
        ↓
clean JSON
```

If an archive page cannot be read, the script falls back to NASA's APOD API. The fallback uses `DEMO_KEY` unless `NASA_API_KEY` is set.

The archive page remains the canonical `apod_url` in the output.

## Use with an AI agent

This repo includes `AGENTS.md` with portable instructions for AI coding agents.

Default machine-readable output:

```bash
node index.js YYYY-MM-DD
```

If the user asks to **show or render the pictures in an AI/chat interface**, use:

```bash
node index.js YYYY-MM-DD --markdown
```

That mode emits portable Markdown containing:

```text
Age · full birthday date
Title
Inline image
NASA APOD link
```

AI clients that support remote Markdown images can display the pictures inline. Clients that do not should show the returned image URLs as clickable links instead.

A natural-language request can be as simple as:

```text
Run birfday.
```

If no birthday is supplied, the AI should ask:

```text
What's your birthday?
```

The birthday must come from the current user request or follow-up. The repo does not hard-code or infer a birthday. Once supplied, the agent converts it to `YYYY-MM-DD` and chooses JSON or Markdown based on what the user asked to see.

If the user does **not** say how they want the results presented, the recommended AI behavior is:

```text
birthday supplied?
→ no: ask "What's your birthday?"
→ yes: run JSON mode
→ report how many birthday APODs were found
→ report earliest + latest year
→ ask: "Want me to render the pictures inline too?"
→ if yes, rerun with --markdown
```

That follow-up is handled by the AI agent, not by an interactive terminal prompt, so the repo remains safe to run in non-interactive environments.

## Output

Each record has this shape:

```json
{
  "year": 2000,
  "age": 0,
  "date": "2000-01-01",
  "title": "NASA APOD title",
  "image_url": "https://apod.nasa.gov/apod/image/...",
  "apod_url": "https://apod.nasa.gov/apod/ap000101.html",
  "rights": {
    "credit": "Credit as shown by APOD",
    "copyright": null,
    "license": null
  },
  "source": "NASA APOD"
}
```

`rights` is deliberately flexible. APOD pages use different provenance wording across the archive, including `Credit`, `Image Credit`, `Credit & Copyright`, `Processing & Copyright`, and `Processing & License`.

Sample outputs are available at `examples/output.json` and `examples/output.md`.

## The loop

```text
birthday
  ↓
take month + day
  ↓
for each year from birth year → now
  ↓
build the official APOD archive URL
  ↓
read title + image + rights
  ↓
return the birthday timeline
```

## Optional NASA API key

You do not need an API key for the normal archive-first path.

If the archive parser needs the API fallback frequently, you can provide a NASA API key:

macOS / Linux:

```bash
NASA_API_KEY=your_key node index.js YYYY-MM-DD
```

PowerShell:

```powershell
$env:NASA_API_KEY="your_key"
node index.js YYYY-MM-DD
```

## Rules

- NASA APOD began on **1995-06-16**, so dates before then are skipped.
- If this year's birthday has not happened yet, that future birthday is not requested.
- A February 29 birthday only returns actual February 29 dates.
- `image_url` prefers the high-resolution image linked by the APOD page when one exists.
- Some APOD entries are videos or other media, so `image_url` can be `null`.
- APOD images are not automatically NASA-owned. Use the `rights` fields and original APOD page when reusing media.

## Repo shape

```text
birfday/
├── README.md
├── AGENTS.md
├── index.js
├── package.json
└── examples/
    ├── output.json
    └── output.md
```

The core record is intentionally small and reusable. JSON remains the data layer; Markdown is only a presentation layer for AI/chat clients. UI, cards, timelines, sharing, and other birthday sources can sit on top later.
