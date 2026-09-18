# birfday

**The universe on every one of your birthdays.**

Give `birfday` any date of birth. It loops through that same month and day for every year since, asks NASA for the Astronomy Picture of the Day, and returns a clean JSON timeline.

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

## Use with an AI agent

This repo includes `AGENTS.md` with instructions for AI coding agents.

A simple request is enough:

```text
Run birfday for my birthday and show me the pictures in chronological order.
```

The agent should read `AGENTS.md`, convert the birthday to `YYYY-MM-DD`, run the existing script, and use the returned `image_url` values.

## Output

Each birthday returns records with this shape:

```json
{
  "year": 2000,
  "age": 0,
  "date": "2000-01-01",
  "title": "NASA APOD title",
  "image_url": "https://...",
  "apod_url": "https://apod.nasa.gov/apod/..."
}
```

The full command prints an array of those records, one for every available birthday.

A sample schema is also available at `examples/output.json`.

## The loop

```text
birthday
  ↓
take month + day
  ↓
for each year from birth year → now
  ↓
fetch NASA APOD for that date
  ↓
return year + age + date + title + image + NASA page
```

## NASA API key

By default, `birfday` uses NASA's `DEMO_KEY`, which is fine for testing but has a low rate limit.

For longer birthday histories, get a free key from [NASA Open APIs](https://api.nasa.gov/) and expose it as `NASA_API_KEY`.

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

- NASA APOD began on **1995-06-16**, so birthdays before then are ignored until APOD exists.
- If this year's birthday has not happened yet, the loop stops at last year's birthday.
- A February 29 birthday only returns actual February 29 dates; non-leap years are skipped.
- If an APOD is a video, `image_url` uses NASA's thumbnail when one is available.

## Repo shape

```text
birfday/
├── README.md
├── AGENTS.md
├── index.js
├── package.json
└── examples/
    └── output.json
```

The core record is intentionally small:

```text
year
age
date
title
image_url
apod_url
```

UI, cards, timelines, sharing and pattern-finding can all be built later on top of this same loop.
