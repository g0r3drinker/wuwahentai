import { errorJson, fetchRule34Html, htmlDecode, normalizeRule34Url, okJson, proxiedMediaUrl } from "./_lib/rule34-utils.js";

export default async function handler(req, res) {
  try {
    const tags = String(req.query.tags || "");
    const pageIndex = Math.max(0, Number.parseInt(String(req.query.pid || "0"), 10) || 0);
    const limit = Math.max(1, Math.min(42, Number.parseInt(String(req.query.limit || "24"), 10) || 24));

    if (!tags) {
      errorJson(res, 400, "Missing tags");
      return;
    }

    const remotePid = pageIndex * 42;
    const query = new URLSearchParams({
      page: "post",
      s: "list",
      pid: String(remotePid),
      tags,
    });
    const html = await fetchRule34Html(`https://rule34.xxx/index.php?${query.toString()}`);
    const posts = [];
    const spanPattern = /<span id="s(?<id>\d+)" class="thumb"[\s\S]*?<\/span>/g;
    let match;

    while ((match = spanPattern.exec(html)) && posts.length < limit) {
      const block = match[0];
      const img = /<img[^>]+src="(?<src>[^"]+)"[^>]*>/i.exec(block);
      if (!img) continue;

      const href = /<a[^>]+href="(?<href>[^"]+)"/i.exec(block);
      const title = /(?:title|alt)="(?<title>[^"]*)"/i.exec(block);
      const src = normalizeRule34Url(htmlDecode(img.groups.src));
      const hrefValue = normalizeRule34Url(htmlDecode(href?.groups?.href || ""));

      posts.push({
        id: match.groups.id,
        preview_url: proxiedMediaUrl(src),
        source_url: hrefValue,
        tags: htmlDecode(title?.groups?.title || "").trim(),
      });
    }

    okJson(res, posts);
  } catch (error) {
    errorJson(res, error.status || 502, error.message || "Rule34 proxy failed");
  }
}
