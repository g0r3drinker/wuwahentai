from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from html import unescape
from pathlib import Path
from urllib.parse import parse_qs, quote, urlencode, urlparse
from urllib.request import Request, urlopen
import json
import re
import time


CACHE_DIR = Path(".cache/rule34")
CACHE_SECONDS = 3600
CACHE_DIR.mkdir(parents=True, exist_ok=True)


class SiteHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/rule34":
            self.proxy_rule34(parsed.query)
            return
        if parsed.path == "/api/image":
            self.proxy_image(parsed.query)
            return
        if parsed.path == "/api/post":
            self.proxy_post(parsed.query)
            return

        super().do_GET()

    def proxy_rule34(self, query):
        params = parse_qs(query)
        tags = params.get("tags", [""])[0]
        page_index = max(0, int(params.get("pid", ["0"])[0]))
        remote_pid = str(page_index * 42)
        limit = params.get("limit", ["24"])[0]

        if not tags:
            self.send_json({"error": "Missing tags"}, 400)
            return

        cache_key = re.sub(r"[^a-zA-Z0-9_.-]+", "_", f"{tags}_{page_index}_{limit}")
        cache_file = CACHE_DIR / f"{cache_key}.json"

        if cache_file.exists() and time.time() - cache_file.stat().st_mtime < CACHE_SECONDS:
            self.send_json(json.loads(cache_file.read_text(encoding="utf-8")), 200)
            return

        remote_query = urlencode({
            "page": "post",
            "s": "list",
            "pid": remote_pid,
            "tags": tags,
        })
        request = Request(
            f"https://rule34.xxx/index.php?{remote_query}",
            headers={
                "Accept": "text/html",
                "Accept-Language": "en-US,en;q=0.9",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
            },
        )

        try:
            with urlopen(request, timeout=15) as response:
                body = response.read().decode("utf-8", errors="replace")
        except Exception as error:
            status = getattr(getattr(error, "fp", None), "status", None) or getattr(getattr(error, "response", None), "status", None)
            message = str(error)
            if "429" in message:
                self.send_json({"error": "Rule34 is rate-limiting this local server right now. Wait a few minutes, then click VIEW ALL again."}, 429)
            else:
                self.send_json({"error": f"Rule34 proxy failed: {message}"}, status or 502)
            return

        if "Rule34.xxx CAPTCHA" in body or "captcha-box" in body:
            self.send_json({"error": "Rule34 showed a CAPTCHA to the local server. Open rule34.xxx once in your browser, solve it if asked, wait a minute, then try VIEW ALL again."}, 429)
            return

        posts = []
        for match in re.finditer(r'<span id="s(?P<id>\d+)" class="thumb"[\s\S]*?</span>', body):
            block = match.group(0)
            img = re.search(r'<img[^>]+src="(?P<src>[^"]+)"[^>]*>', block)
            if not img:
                continue
            href = re.search(r'<a[^>]+href="(?P<href>[^"]+)"', block)
            title = re.search(r'(?:title|alt)="(?P<title>[^"]*)"', block)
            src = unescape(img.group("src"))
            href_value = unescape(href.group("href")) if href else ""
            title_value = unescape(title.group("title")).strip() if title else ""
            if src.startswith("//"):
                src = f"https:{src}"
            if href_value.startswith("/"):
                href_value = f"https://rule34.xxx{href_value}"
            posts.append({
                "id": match.group("id"),
                "preview_url": f"/api/image?url={quote(src, safe='')}",
                "source_url": href_value,
                "tags": title_value,
            })
            if len(posts) >= int(limit):
                break

        cache_file.write_text(json.dumps(posts), encoding="utf-8")
        self.send_json(posts, 200)

    def proxy_post(self, query):
        params = parse_qs(query)
        post_id = params.get("id", [""])[0]

        if not re.fullmatch(r"\d+", post_id):
            self.send_json({"error": "Invalid post id"}, 400)
            return

        cache_file = CACHE_DIR / f"post_{post_id}.json"
        if cache_file.exists() and time.time() - cache_file.stat().st_mtime < CACHE_SECONDS:
            self.send_json(json.loads(cache_file.read_text(encoding="utf-8")), 200)
            return

        request = Request(
            f"https://rule34.xxx/index.php?page=post&s=view&id={post_id}",
            headers={
                "Accept": "text/html",
                "Accept-Language": "en-US,en;q=0.9",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
            },
        )

        try:
            with urlopen(request, timeout=15) as response:
                body = response.read().decode("utf-8", errors="replace")
        except Exception as error:
            message = str(error)
            if "429" in message:
                self.send_json({"error": "Rule34 is rate-limiting post details right now. Wait a few minutes and try again."}, 429)
            else:
                self.send_json({"error": f"Rule34 post fetch failed: {message}"}, 502)
            return

        if "Rule34.xxx CAPTCHA" in body or "captcha-box" in body:
            self.send_json({"error": "Rule34 showed a CAPTCHA while loading this post."}, 429)
            return

        media = self.extract_post_media(body, post_id)
        if not media:
            self.send_json({"error": "Could not find media on this post"}, 404)
            return

        cache_file.write_text(json.dumps(media), encoding="utf-8")
        self.send_json(media, 200)

    def extract_post_media(self, body, post_id):
        title = ""
        title_match = re.search(r'<title>(?P<title>[\s\S]*?)</title>', body)
        if title_match:
            title = unescape(re.sub(r"\s+", " ", title_match.group("title"))).strip()

        video = re.search(r'<video[\s\S]*?<source[^>]+src="(?P<src>[^"]+)"', body, re.IGNORECASE)
        if video:
            src = self.normalize_url(unescape(video.group("src")))
            return {
                "id": post_id,
                "type": "video",
                "file_url": f"/api/image?url={quote(src, safe='')}",
                "source_url": f"https://rule34.xxx/index.php?page=post&s=view&id={post_id}",
                "tags": title,
            }

        image_patterns = [
            r'(?P<src>https://[^"\']+/images/[^"\']+)',
            r'<img[^>]+id="image"[^>]+src="(?P<src>[^"]+)"',
            r'<img[^>]+src="(?P<src>[^"]+)"[^>]+id="image"',
            r'highres-show[^>]+href="(?P<src>[^"]+)"',
        ]

        for pattern in image_patterns:
            match = re.search(pattern, body, re.IGNORECASE)
            if match:
                src = self.normalize_url(unescape(match.group("src")))
                return {
                    "id": post_id,
                    "type": "image",
                    "file_url": f"/api/image?url={quote(src, safe='')}",
                    "source_url": f"https://rule34.xxx/index.php?page=post&s=view&id={post_id}",
                    "tags": title,
                }

        return None

    def normalize_url(self, value):
        if value.startswith("//"):
            return f"https:{value}"
        if value.startswith("/"):
            return f"https://rule34.xxx{value}"
        return value

    def proxy_image(self, query):
        params = parse_qs(query)
        url = params.get("url", [""])[0]
        parsed = urlparse(url)

        if parsed.scheme != "https" or not parsed.netloc.endswith("rule34.xxx"):
            self.send_json({"error": "Invalid image URL"}, 400)
            return

        request = Request(
            url,
            headers={
                "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
                "Referer": "https://rule34.xxx/",
                "User-Agent": "Mozilla/5.0",
            },
        )
        range_header = self.headers.get("Range")
        if range_header:
            request.add_header("Range", range_header)

        try:
            with urlopen(request, timeout=15) as response:
                body = response.read()
                content_type = response.headers.get("Content-Type", "application/octet-stream")
                status = getattr(response, "status", 200)
                content_range = response.headers.get("Content-Range")
        except Exception:
            self.send_response(404)
            self.end_headers()
            return

        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Accept-Ranges", "bytes")
        if content_range:
            self.send_header("Content-Range", content_range)
        self.send_header("Cache-Control", "public, max-age=3600")
        self.end_headers()
        self.wfile.write(body)

    def send_json(self, payload, status):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    host = "127.0.0.1"
    port = 8000
    print(f"Serving WUWAHENTAI at http://{host}:{port}/")
    ThreadingHTTPServer((host, port), SiteHandler).serve_forever()
