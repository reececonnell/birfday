# AGENTS.md

## What this repo does

`birfday` finds NASA's Astronomy Picture of the Day (APOD) for the same birthday across every year from the user's birth year through the present.

The birthday is always passed in at runtime. Do not hard-code a user's birthday into the source.

## How to run

```bash
node index.js YYYY-MM-DD
```

Example pattern only:

```bash
node index.js 2000-01-01
```

If the user gives a birthday in natural language, convert it to `YYYY-MM-DD` before running.

## Output

The script prints a JSON array. Each record contains:

- `year`
- `age`
- `date`
- `title`
- `image_url`
- `apod_url`

Keep results in chronological order.

## Agent behavior

When a user asks to run their birthday:

1. Read the birthday from the user's request.
2. Convert it to `YYYY-MM-DD`.
3. Run `node index.js YYYY-MM-DD`.
4. Return the results clearly.
5. If the user asks to see the pictures, render or surface the `image_url` values in chronological order.
6. If the user asks for links, include the `apod_url` values.
7. Do not modify source code just to change the birthday.

## NASA API

The script uses NASA's `DEMO_KEY` if `NASA_API_KEY` is not set.

If the DEMO_KEY rate limit is reached, use a valid NASA API key through the `NASA_API_KEY` environment variable rather than changing the source.

## Edge cases

- NASA APOD begins on 1995-06-16.
- Dates before APOD existed are skipped.
- If this year's birthday has not happened yet, that future date is not requested.
- February 29 birthdays only return real February 29 dates.
- Video APODs use a thumbnail as `image_url` when available.

## Keep it simple

This repo is intentionally a small reusable loop.

Do not add UI frameworks, databases, authentication, or deployment infrastructure unless the user explicitly asks for them.
