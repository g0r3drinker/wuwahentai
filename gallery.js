const params = new URLSearchParams(window.location.search);
const characterName = params.get("name") || "Aemeath";
const characterStatus = params.get("status") || "adult-only";

const title = document.querySelector("#galleryTitle");
const tagLine = document.querySelector("#galleryTag");
const statusBox = document.querySelector("#galleryStatus");
const grid = document.querySelector("#galleryGrid");
const tabs = document.querySelector("#galleryTabs");
const controls = document.querySelector("#galleryControls");
const pageLabel = document.querySelector("#galleryPageLabel");
const floatingPager = document.querySelector("#floatingPager");
const floatingPageLabel = document.querySelector("#floatingPageLabel");
const viewer = document.querySelector("#imageViewer");
const viewerMedia = document.querySelector("#viewerMedia");

let activeTab = "latest";
let activePage = 0;
let galleryPosts = [];
let viewerIndex = 0;

title.textContent = characterName;
tagLine.textContent = rule34Tag(characterName);

function rule34Tag(name) {
  return `${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")}_(wuthering_waves)`;
}

function rule34ProxyUrl() {
  const tags = activeTab === "top" ? `${rule34Tag(characterName)} sort:score` : rule34Tag(characterName);
  const query = new URLSearchParams({
    limit: "42",
    pid: String(activePage),
    tags
  });
  const base = window.location.protocol === "file:" ? "http://127.0.0.1:8000" : "";
  return `${base}/api/rule34?${query.toString()}`;
}

function imageUrlForBrowser(url) {
  if (window.location.protocol === "file:" && url && url.startsWith("/")) {
    return `http://127.0.0.1:8000${url}`;
  }
  return url;
}

function postProxyUrl(post) {
  const base = window.location.protocol === "file:" ? "http://127.0.0.1:8000" : "";
  return `${base}/api/post?id=${encodeURIComponent(post.id)}`;
}

async function loadGallery() {
  updatePager();
  statusBox.textContent = "Loading...";
  grid.innerHTML = "";
  galleryPosts = [];

  if (characterStatus === "restricted") {
    statusBox.textContent = "This character is SFW only / age review. Adult image fetching is blocked.";
    return;
  }

  try {
    const response = await fetch(rule34ProxyUrl(), { headers: { Accept: "application/json" } });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `Request failed with ${response.status}`);
    }

    if (!Array.isArray(data) || data.length === 0) {
      statusBox.textContent = "No results found for this page.";
      return;
    }

    statusBox.textContent = `${data.length} results`;

    galleryPosts = data;

    data.forEach((post, index) => {
      const tile = document.createElement("article");
      const img = document.createElement("img");
      tile.className = "booru-tile";
      tile.tabIndex = 0;
      tile.dataset.imageIndex = String(index);
      img.alt = post.tags || `${characterName} result`;
      img.loading = "lazy";
      img.referrerPolicy = "no-referrer";
      img.src = imageUrlForBrowser(post.preview_url || post.sample_url || post.file_url);
      img.addEventListener("error", () => {
        tile.classList.add("missing");
        tile.textContent = "Image blocked";
      }, { once: true });
      tile.append(img);
      grid.append(tile);
    });
  } catch (error) {
    statusBox.textContent = error.message || "Could not load this gallery.";
  }
}

function updatePager() {
  const pageText = `Page ${activePage + 1}`;
  pageLabel.textContent = pageText;
  floatingPageLabel.textContent = pageText;
  document.querySelectorAll('[data-page="prev"]').forEach((button) => {
    button.disabled = activePage === 0;
  });
}

tabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-tab]");
  if (!button) return;
  activeTab = button.dataset.tab;
  activePage = 0;
  tabs.querySelectorAll(".modal-tab").forEach((tab) => tab.classList.remove("active"));
  button.classList.add("active");
  loadGallery();
});

controls.addEventListener("click", (event) => {
  handlePagerClick(event);
});

floatingPager.addEventListener("click", (event) => {
  handlePagerClick(event);
});

function handlePagerClick(event) {
  const button = event.target.closest("[data-page]");
  if (!button || button.disabled) return;
  activePage = button.dataset.page === "next" ? activePage + 1 : Math.max(0, activePage - 1);
  window.scrollTo({ top: 0, behavior: "smooth" });
  loadGallery();
}

async function openViewer(index) {
  if (!galleryPosts[index]) return;
  viewerIndex = index;
  const post = galleryPosts[viewerIndex];
  viewerMedia.textContent = "Loading high quality media...";
  document.body.classList.add("viewer-open");
  viewer.classList.add("open");
  viewer.setAttribute("aria-hidden", "false");

  try {
    const response = await fetch(postProxyUrl(post), { headers: { Accept: "application/json" } });
    const media = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(media.error || `Media request failed with ${response.status}`);
    }

    renderViewerMedia(media, post);
  } catch (error) {
    viewerMedia.textContent = error.message || "Could not load high quality media.";
  }
}

function renderViewerMedia(media, post) {
  const mediaUrl = imageUrlForBrowser(media.file_url || post.sample_url || post.file_url || post.preview_url);
  viewerMedia.innerHTML = "";

  if (media.type === "video" || /\.(webm|mp4)(\?|$)/i.test(mediaUrl)) {
    const video = document.createElement("video");
    video.controls = true;
    video.autoplay = true;
    video.loop = true;
    video.src = mediaUrl;
    viewerMedia.append(video);
    return;
  }

  const img = document.createElement("img");
  img.alt = media.tags || post.tags || `${characterName} image ${viewerIndex + 1}`;
  img.src = mediaUrl;
  viewerMedia.append(img);
}

function closeViewer() {
  viewer.classList.remove("open");
  viewer.setAttribute("aria-hidden", "true");
  document.body.classList.remove("viewer-open");
  viewerMedia.innerHTML = "";
}

function stepViewer(step) {
  if (!galleryPosts.length) return;
  viewerIndex = (viewerIndex + step + galleryPosts.length) % galleryPosts.length;
  openViewer(viewerIndex);
}

grid.addEventListener("click", (event) => {
  const tile = event.target.closest("[data-image-index]");
  if (!tile) return;
  openViewer(Number(tile.dataset.imageIndex));
});

grid.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  const tile = event.target.closest("[data-image-index]");
  if (!tile) return;
  event.preventDefault();
  openViewer(Number(tile.dataset.imageIndex));
});

viewer.addEventListener("click", (event) => {
  const closeTarget = event.target.closest("[data-close-viewer]");
  const stepTarget = event.target.closest("[data-viewer-step]");

  if (closeTarget) {
    closeViewer();
  }

  if (stepTarget) {
    stepViewer(Number(stepTarget.dataset.viewerStep));
  }
});

document.addEventListener("keydown", (event) => {
  if (!viewer.classList.contains("open")) return;

  if (event.key === "Escape") {
    closeViewer();
  } else if (event.key === "ArrowLeft") {
    stepViewer(-1);
  } else if (event.key === "ArrowRight") {
    stepViewer(1);
  }
});

loadGallery();
