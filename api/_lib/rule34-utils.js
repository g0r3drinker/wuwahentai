const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36";

export function okJson(res, payload, cacheSeconds = 300) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", `s-maxage=${cacheSeconds}, stale-while-revalidate=86400`);
  res.status(200).send(JSON.stringify(payload));
}

export function errorJson(res, status, message) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.status(status).send(JSON.stringify({ error: message }));
}

export function normalizeRule34Url(value) {
  if (!value) return "";
  if (value.startsWith("//")) return `https:${value}`;
  if (value.startsWith("/")) return `https://rule34.xxx${value}`;
  return value;
}

export function htmlDecode(value = "") {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export async function fetchRule34Html(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "text/html",
      "Accept-Language": "en-US,en;q=0.9",
      "User-Agent": USER_AGENT,
    },
  });

  const body = await response.text();

  if (!response.ok) {
    const message = response.status === 429
      ? "Rule34 is rate-limiting this deployment right now. Wait a few minutes and try again."
      : `Rule34 returned ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  if (body.includes("Rule34.xxx CAPTCHA") || body.includes("captcha-box")) {
    const error = new Error("Rule34 showed a CAPTCHA to this deployment. Try again later.");
    error.status = 429;
    throw error;
  }

  return body;
}

export function proxiedMediaUrl(url) {
  return `/api/image?url=${encodeURIComponent(url)}`;
}
