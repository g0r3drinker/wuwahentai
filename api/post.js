import { errorJson, fetchRule34Html, htmlDecode, normalizeRule34Url, okJson, proxiedMediaUrl } from "./_lib/rule34-utils.js";

function extractTitle(html) {
  const match = /<title>(?<title>[\s\S]*?)<\/title>/i.exec(html);
  return htmlDecode((match?.groups?.title || "").replace(/\s+/g, " ").trim());
}

function extractPostMedia(html, postId) {
  const title = extractTitle(html);
  const video = /<video[\s\S]*?<source[^>]+src="(?<src>[^"]+)"/i.exec(html);

  if (video) {
    const src = normalizeRule34Url(htmlDecode(video.groups.src));
    return {
      id: postId,
      type: "video",
      file_url: proxiedMediaUrl(src),
      source_url: `https://rule34.xxx/index.php?page=post&s=view&id=${postId}`,
      tags: title,
    };
  }

  const imagePatterns = [
    /(?<src>https:\/\/[^"']+\/images\/[^"']+)/i,
    /<img[^>]+id="image"[^>]+src="(?<src>[^"]+)"/i,
    /<img[^>]+src="(?<src>[^"]+)"[^>]+id="image"/i,
    /highres-show[^>]+href="(?<src>[^"]+)"/i,
  ];

  for (const pattern of imagePatterns) {
    const match = pattern.exec(html);
    if (!match) continue;
    const src = normalizeRule34Url(htmlDecode(match.groups.src));
    return {
      id: postId,
      type: "image",
      file_url: proxiedMediaUrl(src),
      source_url: `https://rule34.xxx/index.php?page=post&s=view&id=${postId}`,
      tags: title,
    };
  }

  return null;
}

export default async function handler(req, res) {
  try {
    const postId = String(req.query.id || "");

    if (!/^\d+$/.test(postId)) {
      errorJson(res, 400, "Invalid post id");
      return;
    }

    const html = await fetchRule34Html(`https://rule34.xxx/index.php?page=post&s=view&id=${postId}`);
    const media = extractPostMedia(html, postId);

    if (!media) {
      errorJson(res, 404, "Could not find media on this post");
      return;
    }

    okJson(res, media);
  } catch (error) {
    errorJson(res, error.status || 502, error.message || "Rule34 post fetch failed");
  }
}
