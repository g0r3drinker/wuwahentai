const characters = [
  { name: "Aemeath", stars: 5, status: "adult-only", element: "Fusion" },
  { name: "Augusta", stars: 5, status: "adult-only", element: "Electro" },
  { name: "Baizhi", stars: 4, status: "adult-only", element: "Glacio" },
  { name: "Buling", stars: 4, status: "restricted", element: "Electro" },
  { name: "Camellya", stars: 5, status: "adult-only", element: "Havoc" },
  { name: "Cantarella", stars: 5, status: "adult-only", element: "Havoc" },
  { name: "Carlotta", stars: 5, status: "adult-only", element: "Glacio" },
  { name: "Cartethyia", stars: 5, status: "adult-only", element: "Aero" },
  { name: "Changli", stars: 5, status: "adult-only", element: "Fusion" },
  { name: "Chisa", stars: 5, status: "adult-only", element: "Havoc" },
  { name: "Chixia", stars: 4, status: "adult-only", element: "Fusion" },
  { name: "Ciaccona", stars: 5, status: "adult-only", element: "Aero" },
  { name: "Danjin", stars: 4, status: "adult-only", element: "Havoc" },
  { name: "Denia", stars: 5, status: "adult-only", element: "Fusion" },
  { name: "Galbrena", stars: 5, status: "adult-only", element: "Fusion" },
  { name: "Hiyuki", stars: 5, status: "adult-only", element: "Glacio" },
  { name: "Hsin", stars: 5, status: "adult-only", element: "Electro" },
  { name: "Iuno", stars: 5, status: "adult-only", element: "Aero" },
  { name: "Jianxin", stars: 5, status: "adult-only", element: "Aero" },
  { name: "Jinhsi", stars: 5, status: "adult-only", element: "Spectro" },
  { name: "Lucilla", stars: 5, status: "adult-only", element: "Glacio" },
  { name: "Lucy", stars: 5, status: "adult-only", element: "Spectro" },
  { name: "Lumi", stars: 4, status: "adult-only", element: "Electro" },
  { name: "Lupa", stars: 5, status: "adult-only", element: "Fusion" },
  { name: "Lynae", stars: 5, status: "adult-only", element: "Spectro" },
  { name: "Mornye", stars: 5, status: "adult-only", element: "Spectro" },
  { name: "Phoebe", stars: 5, status: "adult-only", element: "Spectro" },
  { name: "Phrolova", stars: 5, status: "adult-only", element: "Havoc" },
  { name: "Qingxiao", stars: 5, status: "adult-only", element: "Aero" },
  { name: "Rebecca", stars: 5, status: "adult-only", element: "Electro" },
  { name: "Roccia", stars: 5, status: "adult-only", element: "Havoc" },
  { name: "Sanhua", stars: 4, status: "adult-only", element: "Glacio" },
  { name: "Sigrika", stars: 5, status: "adult-only", element: "Spectro" },
  { name: "Suisui", stars: 5, status: "restricted", element: "Glacio" },
  { name: "Taoqi", stars: 4, status: "adult-only", element: "Havoc" },
  { name: "The Shorekeeper", stars: 5, status: "adult-only", element: "Spectro" },
  { name: "Yangyang", stars: 4, status: "adult-only", element: "Aero" },
  { name: "Yangyang: Xuanling", stars: 5, status: "adult-only", element: "Havoc" },
  { name: "Yinlin", stars: 5, status: "adult-only", element: "Electro" },
  { name: "Youhu", stars: 4, status: "restricted", element: "Glacio" },
  { name: "Zani", stars: 5, status: "adult-only", element: "Spectro" },
  { name: "Zhezhi", stars: 5, status: "adult-only", element: "Glacio" }
].sort((a, b) => a.name.localeCompare(b.name));

const ageGate = document.querySelector("#ageGate");
const enterButton = document.querySelector("#enterButton");
const list = document.querySelector("#characters");
const searchForm = document.querySelector(".search-form");
const searchInput = document.querySelector("#searchInput");
const filterButtons = document.querySelectorAll(".side-link");
const galleryModal = document.querySelector("#galleryModal");
const modalTitle = document.querySelector("#modalTitle");
const modalNote = document.querySelector("#modalNote");
const modalTabs = document.querySelector("#modalTabs");
const modalControls = document.querySelector("#modalControls");
const modalGrid = document.querySelector("#modalGrid");
const galleryCloseButtons = document.querySelectorAll("[data-close-gallery]");

let activeFilter = "all";
let searchTerm = "";
let activeGalleryCharacter = null;
let activeGalleryRow = null;
let activeGalleryTab = "r34-latest";
let activeGalleryPage = 0;
let previewLoadRun = 0;

if (localStorage.getItem("wuwa-index-age-ok") === "yes") {
  ageGate.classList.add("hidden");
}

enterButton.addEventListener("click", () => {
  localStorage.setItem("wuwa-index-age-ok", "yes");
  ageGate.classList.add("hidden");
});

function colorFor(index) {
  const colors = [
    ["#334b66", "#66d9ff"],
    ["#573351", "#ff4d7d"],
    ["#4e432d", "#f0b85a"],
    ["#294f48", "#39d6d0"],
    ["#34325c", "#8f6cff"],
    ["#593338", "#ff755f"]
  ];
  return colors[index % colors.length];
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function imagePath(character, index) {
  const fileNumber = String(index).padStart(2, "0");
  return `assets/characters/${slugify(character.name)}/${fileNumber}.jpg`;
}

function rule34Tag(character) {
  return `${character.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")}_(wuthering_waves)`;
}

function localRule34ProxyUrl(character, tab, page) {
  const tags = tab === "r34-top" ? `${rule34Tag(character)} sort:score` : rule34Tag(character);
  const params = new URLSearchParams({
    limit: "24",
    pid: String(page),
    tags
  });
  const base = window.location.protocol === "file:" ? "http://127.0.0.1:8000" : "";
  return `${base}/api/rule34?${params.toString()}`;
}

async function fetchRule34(character, tab, page) {
  const response = await fetch(localRule34ProxyUrl(character, tab, page), {
    headers: { Accept: "application/json" }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Request returned ${response.status}`);
  }

  return data;
}

function fakeCount(character, index) {
  return character.status === "restricted" ? 0 : 80 + ((character.name.length * 37 + index * 53) % 1900);
}

function matchesFilter(character) {
  if (activeFilter === "all") return true;
  if (activeFilter === "five") return character.stars === 5;
  if (activeFilter === "four") return character.stars === 4;
  return character.status === activeFilter;
}

function renderCharacters() {
  previewLoadRun += 1;
  const visible = characters.filter((character) => {
    const searchable = `${character.name} ${character.element} ${character.stars}`;
    return matchesFilter(character) && searchable.toLowerCase().includes(searchTerm);
  });

  list.innerHTML = "";

  if (visible.length === 0) {
    list.innerHTML = '<p class="empty-state">No characters found.</p>';
    return;
  }

  visible.forEach((character, index) => {
    const [swatch, hair] = colorFor(index);
    const statusText = character.status === "restricted" ? "SFW / age review" : "18+ allowed";
    const statusClass = character.status === "restricted" ? "tag-warning" : "tag-ok";
    const count = fakeCount(character, index);
    const row = document.createElement("article");

    row.className = "character-row";
    row.dataset.characterName = character.name;
    row.style.setProperty("--swatch", swatch);
    row.style.setProperty("--hair", hair);
    row.innerHTML = `
      <div class="avatar" aria-hidden="true"></div>
      <div class="character-main">
        <div class="row-head">
          <h2>${character.name}</h2>
          <span class="${statusClass}">${statusText}</span>
        </div>
        <p class="count">${count} images - ${character.stars} stars - ${character.element}</p>
        <div class="preview-strip" aria-label="${character.name} latest images">
          ${Array.from({ length: 6 }, () => '<div class="preview waiting"></div>').join("")}
        </div>
      </div>
      <div class="row-action">
        <a class="view-button" href="${galleryPageUrl(character)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${character.name} gallery">VIEW ALL</a>
      </div>
    `;
    list.append(row);
  });

  loadVisibleRowsSequentially(previewLoadRun);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function galleryPageUrl(character) {
  return `gallery.html?name=${encodeURIComponent(character.name)}&status=${encodeURIComponent(character.status)}`;
}

async function loadVisibleRowsSequentially(runId) {
  const rows = Array.from(list.querySelectorAll(".character-row"));

  for (const row of rows) {
    if (runId !== previewLoadRun) return;
    const character = characters.find((item) => item.name === row.dataset.characterName);

    if (!character || character.status === "restricted") {
      await loadRowPreviews(character, row);
      continue;
    }

    row.querySelectorAll(".preview").forEach((preview) => {
      preview.classList.remove("waiting");
      preview.classList.add("loading");
    });

    await loadRowPreviews(character, row);
    await wait(1600);
  }
}

function imageUrlForBrowser(url) {
  if (window.location.protocol === "file:" && url && url.startsWith("/")) {
    return `http://127.0.0.1:8000${url}`;
  }
  return url;
}

async function loadRowPreviews(character, row) {
  const previews = row.querySelectorAll(".preview");

  if (!character) {
    previews.forEach((preview) => preview.classList.add("blocked"));
    return;
  }

  if (character.status === "restricted") {
    previews.forEach((preview) => {
      preview.classList.remove("loading");
      preview.classList.remove("waiting");
      preview.classList.add("blocked");
    });
    return;
  }

  try {
    const posts = normalizeRule34Posts(await fetchRule34(character, "r34-latest", 0)).slice(0, previews.length);
    fillPreviewStrip(character, row, posts);
  } catch (error) {
    previews.forEach((preview) => {
      preview.classList.remove("loading");
      preview.classList.remove("waiting");
      preview.classList.add("blocked");
    });
  }
}

function fillPreviewStrip(character, row, posts) {
  const previews = row.querySelectorAll(".preview");

  previews.forEach((preview, index) => {
    const post = posts[index];
    preview.classList.remove("loading");
    preview.classList.remove("waiting");

    if (!post) {
      preview.classList.add("blocked");
      return;
    }

    const imageUrl = imageUrlForBrowser(post.preview_url || post.sample_url || post.file_url);
    const img = document.createElement("img");
    img.alt = `${character.name} latest image ${index + 1}`;
    img.loading = "lazy";
    img.referrerPolicy = "no-referrer";
    img.src = imageUrl;
    img.addEventListener("error", () => {
      img.remove();
      preview.classList.add("blocked");
    }, { once: true });
    preview.innerHTML = "";
    preview.append(img);
  });
}

function openGallery(characterName, row) {
  const character = characters.find((item) => item.name === characterName);
  if (!character) return;

  previewLoadRun += 1;
  activeGalleryCharacter = character;
  activeGalleryRow = row;
  activeGalleryTab = character.status === "restricted" ? "local" : "r34-latest";
  activeGalleryPage = 0;
  modalTitle.textContent = character.name;

  galleryModal.classList.add("open");
  galleryModal.setAttribute("aria-hidden", "false");
  renderGalleryTabs();
  renderActiveGallery();
}

function closeGallery() {
  galleryModal.classList.remove("open");
  galleryModal.setAttribute("aria-hidden", "true");
  modalGrid.innerHTML = "";
}

function renderGalleryTabs() {
  const restricted = activeGalleryCharacter.status === "restricted";
  const tabs = [
    { id: "r34-latest", label: "R34 Latest", disabled: restricted },
    { id: "r34-top", label: "R34 Top", disabled: restricted },
    { id: "local", label: "Local" }
  ];

  modalTabs.innerHTML = tabs.map((tab) => `
    <button
      class="modal-tab ${activeGalleryTab === tab.id ? "active" : ""}"
      type="button"
      data-gallery-tab="${tab.id}"
      ${tab.disabled ? "disabled" : ""}
    >${tab.label}</button>
  `).join("");
}

function renderGalleryControls() {
  modalControls.innerHTML = activeGalleryTab === "local" ? "" : `
    <button class="pager-button" type="button" data-gallery-page="prev" ${activeGalleryPage === 0 ? "disabled" : ""}>Prev</button>
    <span>R34 Page ${activeGalleryPage + 1}</span>
    <button class="pager-button" type="button" data-gallery-page="next">Next</button>
  `;
}

function renderLocalGallery(character) {
  modalNote.textContent = `Local reviewed folder: assets/characters/${slugify(character.name)}/01.jpg, 02.jpg, 03.jpg...`;
  modalGrid.innerHTML = "";

  Array.from({ length: 12 }, (_, index) => index + 1).forEach((imageIndex) => {
    const tile = document.createElement("div");
    const img = document.createElement("img");
    tile.className = "gallery-tile";
    tile.style.setProperty("--swatch", colorFor(imageIndex)[0]);
    tile.style.setProperty("--hair", colorFor(imageIndex)[1]);
    img.alt = `${character.name} local preview ${imageIndex}`;
    img.src = imagePath(character, imageIndex);
    img.addEventListener("error", () => {
      img.remove();
      tile.classList.add("missing");
      tile.textContent = `${String(imageIndex).padStart(2, "0")}.jpg`;
    }, { once: true });
    tile.append(img);
    modalGrid.append(tile);
  });
}

function normalizeRule34Posts(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.post)) return data.post;
  return [];
}

async function renderRule34Gallery(character) {
  modalNote.innerHTML = `Simulated R34 search for <span class="search-chip">${rule34Tag(character)}</span>. Results load inside this site.`;
  modalGrid.innerHTML = '<div class="gallery-tile missing wide">Loading Rule34 results...</div>';

  try {
    const posts = normalizeRule34Posts(await fetchRule34(character, activeGalleryTab, activeGalleryPage));
    modalGrid.innerHTML = "";

    if (posts.length === 0) {
      modalGrid.innerHTML = '<div class="gallery-tile missing wide">No Rule34 results found for this tag.</div>';
      return;
    }

    posts.forEach((post) => {
      const tile = document.createElement("div");
      const img = document.createElement("img");
      const imageUrl = imageUrlForBrowser(post.preview_url || post.sample_url || post.file_url);
      tile.className = "gallery-tile";
      img.alt = `${character.name} Rule34 result`;
      img.loading = "lazy";
      img.referrerPolicy = "no-referrer";
      img.src = imageUrl;
      img.addEventListener("error", () => {
        img.remove();
        tile.classList.add("missing");
        tile.textContent = "Image blocked";
      }, { once: true });
      tile.append(img);
      modalGrid.append(tile);
    });

    if (activeGalleryRow && activeGalleryPage === 0 && activeGalleryTab === "r34-latest") {
      fillPreviewStrip(character, activeGalleryRow, posts.slice(0, 6));
    }
  } catch (error) {
    modalGrid.innerHTML = `
      <div class="gallery-tile missing wide">
        ${error.message || "Could not load Rule34 right now."}
      </div>
    `;
  }
}

function renderActiveGallery() {
  if (!activeGalleryCharacter) return;
  renderGalleryControls();

  if (activeGalleryCharacter.status === "restricted") {
    modalNote.textContent = "This character is marked as SFW only / age review. Adult image fetching is blocked for this entry.";
    renderLocalGallery(activeGalleryCharacter);
    return;
  }

  if (activeGalleryTab === "local") {
    renderLocalGallery(activeGalleryCharacter);
  } else {
    renderRule34Gallery(activeGalleryCharacter);
  }
}

list.addEventListener("click", (event) => {
  const button = event.target.closest("[data-gallery-name]");
  if (!button) return;
  openGallery(button.dataset.galleryName, button.closest(".character-row"));
});

galleryCloseButtons.forEach((button) => {
  button.addEventListener("click", closeGallery);
});

modalTabs.addEventListener("click", (event) => {
  const button = event.target.closest("[data-gallery-tab]");
  if (!button || button.disabled) return;
  activeGalleryTab = button.dataset.galleryTab;
  activeGalleryPage = 0;
  renderGalleryTabs();
  renderActiveGallery();
});

modalControls.addEventListener("click", (event) => {
  const button = event.target.closest("[data-gallery-page]");
  if (!button || button.disabled) return;
  activeGalleryPage = button.dataset.galleryPage === "next"
    ? activeGalleryPage + 1
    : Math.max(0, activeGalleryPage - 1);
  renderActiveGallery();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeGallery();
  }
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    renderCharacters();
  });
});

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  searchTerm = searchInput.value.trim().toLowerCase();
  renderCharacters();
});

searchInput.addEventListener("input", () => {
  searchTerm = searchInput.value.trim().toLowerCase();
  renderCharacters();
});

renderCharacters();
