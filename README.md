# birfday

**The universe on every one of your birthdays.**

Give `birfday` a date of birth. It loops through that same month and day for every year since, asks NASA for the Astronomy Picture of the Day, and returns a clean JSON timeline.

## Run it

Requires Node.js 18+.

```bash
node index.js 1998-09-25
```

Or:

```bash
npm run birfday -- 1998-09-25
```

## Output

Each birthday returns:

```json
{
  "year": 1998,
  "age": 0,
  "date": "1998-09-25",
  "title": "Twin Proto-Planetary Disks",
  "image_url": "https://...",
  "apod_url": "https://apod.nasa.gov/apod/ap980925.html"
}
```

The full command prints an array of those records, one for every available birthday.

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
NASA_API_KEY=your_key node index.js 1998-09-25
```

PowerShell:

```powershell
$env:NASA_API_KEY="your_key"
node index.js 1998-09-25
```

## Rules

- NASA APOD began on **1995-06-16**, so birthdays before then are ignored until APOD exists.
- If this year's birthday has not happened yet, the loop stops at last year's birthday.
- A February 29 birthday only returns actual February 29 dates; non-leap years are skipped.
- If an APOD is a video, `image_url` uses NASA's thumbnail when one is available.

## Current shape

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
