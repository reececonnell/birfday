#!/usr/bin/env node

const APOD_ENDPOINT = "https://api.nasa.gov/planetary/apod";
const APOD_START_DATE = "1995-06-16";

function usage() {
  console.log(`
birfday

See NASA's Astronomy Picture of the Day from every birthday you've had.

Usage:
  node index.js YYYY-MM-DD

Optional:
  NASA_API_KEY=your_key node index.js YYYY-MM-DD

If NASA_API_KEY is not set, birfday uses NASA's DEMO_KEY.
`);
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function isRealDate(dateString) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;

  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function apodPageUrl(dateString) {
  const [year, month, day] = dateString.split("-");
  return `https://apod.nasa.gov/apod/ap${year.slice(-2)}${month}${day}.html`;
}

async function getApod(date, apiKey) {
  const params = new URLSearchParams({
    api_key: apiKey,
    date,
    thumbs: "true"
  });

  const response = await fetch(`${APOD_ENDPOINT}?${params}`);

  if (!response.ok) {
    const body = await response.text();
    const error = new Error(`NASA APOD request failed for ${date} (${response.status})`);
    error.details = body;
    error.status = response.status;
    throw error;
  }

  return response.json();
}

async function main() {
  const birthday = process.argv[2];

  if (!birthday || birthday === "--help" || birthday === "-h") {
    usage();
    process.exit(birthday ? 0 : 1);
  }

  if (!isRealDate(birthday)) {
    console.error("Birthday must be a real date in YYYY-MM-DD format.");
    process.exit(1);
  }

  const today = new Date();
  const todayIso = [
    today.getUTCFullYear(),
    pad(today.getUTCMonth() + 1),
    pad(today.getUTCDate())
  ].join("-");

  if (birthday > todayIso) {
    console.error("Birthday cannot be in the future.");
    process.exit(1);
  }

  const [birthYearString, month, day] = birthday.split("-");
  const birthYear = Number(birthYearString);
  const currentYear = today.getUTCFullYear();
  const apiKey = process.env.NASA_API_KEY || "DEMO_KEY";
  const results = [];

  for (let year = birthYear; year <= currentYear; year += 1) {
    const date = `${year}-${month}-${day}`;

    // Feb 29 only exists in leap years. We skip rather than invent a substitute date.
    if (!isRealDate(date)) continue;

    // APOD began on 1995-06-16.
    if (date < APOD_START_DATE) continue;

    // Don't request this year's birthday before it happens.
    if (date > todayIso) continue;

    try {
      const apod = await getApod(date, apiKey);
      const imageUrl =
        apod.media_type === "image"
          ? apod.url
          : apod.thumbnail_url || null;

      results.push({
        year,
        age: year - birthYear,
        date,
        title: apod.title,
        image_url: imageUrl,
        apod_url: apodPageUrl(date)
      });
    } catch (error) {
      if (error.status === 429) {
        console.error(
          "NASA's DEMO_KEY rate limit was reached. Set a free NASA_API_KEY and run again."
        );
        process.exit(1);
      }

      console.error(`Skipping ${date}: ${error.message}`);
    }
  }

  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
