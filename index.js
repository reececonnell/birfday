#!/usr/bin/env node

const APOD_ARCHIVE_BASE = "https://apod.nasa.gov/apod/";
const APOD_API = "https://api.nasa.gov/planetary/apod";
const APOD_START_DATE = "1995-06-16";

function usage() {
  console.log(`
birfday

See NASA's Astronomy Picture of the Day from every birthday you've had.

Usage:
  node index.js YYYY-MM-DD

Optional fallback key:
  NASA_API_KEY=your_key node index.js YYYY-MM-DD

The official APOD archive is the primary source. The NASA API is only used
as a fallback if an archive page cannot be read.
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
  return `${APOD_ARCHIVE_BASE}ap${year.slice(-2)}${month}${day}.html`;
}

function decodeHtmlEntities(value) {
  const named = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    nbsp: " ",
    ndash: "–",
    mdash: "—",
    copy: "©"
  };

  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCodePoint(Number.parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, decimal) =>
      String.fromCodePoint(Number.parseInt(decimal, 10))
    )
    .replace(/&([a-z]+);/gi, (match, name) => named[name.toLowerCase()] ?? match);
}

function cleanText(value) {
  return decodeHtmlEntities(
    value
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\s+/g, " ")
    .trim();
}

function htmlToLines(html) {
  const withBreaks = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(?:p|center|div|h[1-6]|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ");

  return decodeHtmlEntities(withBreaks)
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function extractAttribute(match, indexes) {
  for (const index of indexes) {
    if (match[index]) return match[index];
  }
  return null;
}

function resolveUrl(value, baseUrl) {
  if (!value) return null;

  try {
    return new URL(value, baseUrl).href;
  } catch {
    return null;
  }
}

function looksLikeImage(value, baseUrl) {
  try {
    const url = new URL(value, baseUrl);
    return /\.(?:jpe?g|png|gif|webp|tiff?|bmp)$/i.test(url.pathname);
  } catch {
    return false;
  }
}

function extractImageUrl(html, pageUrl) {
  const linkedImage = html.match(
    /<a\b[^>]*href\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))[^>]*>\s*<img\b[^>]*src\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i
  );

  if (linkedImage) {
    const href = extractAttribute(linkedImage, [1, 2, 3]);
    const src = extractAttribute(linkedImage, [4, 5, 6]);

    if (href && looksLikeImage(href, pageUrl)) {
      return resolveUrl(href, pageUrl);
    }

    if (src) return resolveUrl(src, pageUrl);
  }

  const image = html.match(
    /<img\b[^>]*src\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))/i
  );

  return image
    ? resolveUrl(extractAttribute(image, [1, 2, 3]), pageUrl)
    : null;
}

function extractTitle(html, date) {
  const titleTag = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);

  if (titleTag) {
    let title = cleanText(titleTag[1]).replace(/^APOD:\s*/i, "");

    title = title.replace(
      /^(?:\d{4}\s+[A-Za-z]+\s+\d{1,2}|[A-Za-z]+\s+\d{1,2},?\s+\d{4})\s*(?:[-–—:]\s*)?/i,
      ""
    );

    if (title) return title;
  }

  const lines = htmlToLines(html);
  const [year, month, day] = date.split("-");
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const monthName = monthNames[Number(month) - 1];

  const datePatterns = [
    `${year} ${monthName} ${Number(day)}`,
    `${monthName} ${Number(day)}, ${year}`
  ];

  const dateIndex = lines.findIndex((line) =>
    datePatterns.some((pattern) => line.includes(pattern))
  );

  if (dateIndex >= 0) {
    for (let i = dateIndex + 1; i < lines.length; i += 1) {
      const line = lines[i];
      if (/^(?:Image\s+)?Credit\b/i.test(line)) break;
      if (!/^Astronomy Picture of the Day$/i.test(line)) return line;
    }
  }

  return null;
}

function extractRights(html) {
  const lines = htmlToLines(html);

  const creditLine = lines.find((line) =>
    /^(?:Image\s+)?Credit(?:\s*&\s*Copyright)?\s*:/i.test(line)
  );

  const standaloneCopyrightLine = lines.find((line) =>
    /^Copyright\s*:/i.test(line)
  );

  const licenseAnchor = html.match(
    /<a\b[^>]*href\s*=\s*(?:"([^"]+)"|'([^']+)'|([^\s>]+))[^>]*>\s*License\s*<\/a>/i
  );

  const rights = {
    credit: null,
    copyright: null,
    license: licenseAnchor
      ? resolveUrl(
          extractAttribute(licenseAnchor, [1, 2, 3]),
          APOD_ARCHIVE_BASE
        )
      : null
  };

  if (!creditLine) {
    if (standaloneCopyrightLine) {
      rights.copyright = standaloneCopyrightLine.replace(/^Copyright\s*:\s*/i, "").trim() || null;
    }
    return rights;
  }

  const combinedCreditCopyright =
    /^(?:Image\s+)?Credit\s*&\s*Copyright\s*:/i.test(creditLine);

  let content = creditLine
    .replace(/^(?:Image\s+)?Credit(?:\s*&\s*Copyright)?\s*:\s*/i, "")
    .trim();

  const processingCopyright = content.match(
    /^(.*?)\s*;\s*Processing\s*&\s*Copyright\s*:\s*(.+)$/i
  );

  const processingLicense = content.match(
    /^(.*?)\s*;\s*Processing\s*&\s*License\s*:\s*(.+)$/i
  );

  const inlineCopyright = content.match(
    /^(.*?)\s*;?\s*Copyright\s*:\s*(.+)$/i
  );

  if (processingCopyright) {
    rights.credit = processingCopyright[1].trim() || null;
    rights.copyright = processingCopyright[2].trim() || null;
  } else if (processingLicense) {
    const baseCredit = processingLicense[1].trim();
    const processor = processingLicense[2].trim();
    rights.credit = [baseCredit, processor ? `Processing: ${processor}` : null]
      .filter(Boolean)
      .join("; ") || null;
  } else if (inlineCopyright) {
    rights.credit = inlineCopyright[1].trim() || null;
    rights.copyright = inlineCopyright[2].trim() || null;
  } else {
    rights.credit = content || null;

    if (combinedCreditCopyright) {
      rights.copyright = content || null;
    }
  }

  if (!rights.copyright && standaloneCopyrightLine) {
    rights.copyright =
      standaloneCopyrightLine.replace(/^Copyright\s*:\s*/i, "").trim() || null;
  }

  return rights;
}

function parseArchivePage(html, date, pageUrl) {
  const title = extractTitle(html, date);

  if (!title) {
    throw new Error("Could not parse APOD title from archive page");
  }

  return {
    title,
    image_url: extractImageUrl(html, pageUrl),
    rights: extractRights(html)
  };
}

async function fetchArchive(date) {
  const pageUrl = apodPageUrl(date);
  const response = await fetch(pageUrl, {
    headers: {
      "user-agent": "birfday/0.2 (+https://github.com/reececonnell/birfday)"
    }
  });

  if (!response.ok) {
    throw new Error(`APOD archive returned ${response.status}`);
  }

  const html = await response.text();
  return parseArchivePage(html, date, pageUrl);
}

async function fetchApiFallback(date) {
  const apiKey = process.env.NASA_API_KEY || "DEMO_KEY";
  const params = new URLSearchParams({
    api_key: apiKey,
    date,
    thumbs: "true"
  });

  const response = await fetch(`${APOD_API}?${params}`);

  if (!response.ok) {
    throw new Error(`NASA APOD API fallback returned ${response.status}`);
  }

  const apod = await response.json();

  return {
    title: apod.title,
    image_url:
      apod.media_type === "image"
        ? apod.hdurl || apod.url
        : apod.thumbnail_url || null,
    rights: {
      credit: null,
      copyright: apod.copyright || null,
      license: null
    }
  };
}

async function getApod(date) {
  try {
    return await fetchArchive(date);
  } catch (archiveError) {
    try {
      return await fetchApiFallback(date);
    } catch (apiError) {
      throw new Error(
        `Archive failed: ${archiveError.message}; API fallback failed: ${apiError.message}`
      );
    }
  }
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
  const results = [];

  for (let year = birthYear; year <= currentYear; year += 1) {
    const date = `${year}-${month}-${day}`;

    if (!isRealDate(date)) continue;
    if (date < APOD_START_DATE) continue;
    if (date > todayIso) continue;

    try {
      const apod = await getApod(date);

      results.push({
        year,
        age: year - birthYear,
        date,
        title: apod.title,
        image_url: apod.image_url,
        apod_url: apodPageUrl(date),
        rights: apod.rights,
        source: "NASA APOD"
      });
    } catch (error) {
      console.error(`Skipping ${date}: ${error.message}`);
    }
  }

  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
