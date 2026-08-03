export default async function handler(req, res) {
  const url = String(req.query.url || "");

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    res.status(400).send("Invalid image URL");
    return;
  }

  if (parsed.protocol !== "https:" || !parsed.hostname.endsWith("rule34.xxx")) {
    res.status(400).send("Invalid image URL");
    return;
  }

  try {
    const headers = {
      Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,video/*,*/*;q=0.8",
      Referer: "https://rule34.xxx/",
      "User-Agent": "Mozilla/5.0",
    };

    if (req.headers.range) {
      headers.Range = req.headers.range;
    }

    const response = await fetch(url, { headers });
    const body = Buffer.from(await response.arrayBuffer());

    res.status(response.status);
    res.setHeader("Content-Type", response.headers.get("content-type") || "application/octet-stream");
    res.setHeader("Content-Length", String(body.length));
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=86400");

    const contentRange = response.headers.get("content-range");
    if (contentRange) {
      res.setHeader("Content-Range", contentRange);
    }

    res.send(body);
  } catch {
    res.status(404).send("Media blocked");
  }
}
