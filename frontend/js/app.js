import { APP_CONFIG } from "./config.js";
import { api } from "./api.js";

const state = {
  config: { ...APP_CONFIG.fallback },
  guestName: "Tamu Undangan",
  guestToken: "",
  wishesPage: 1,
  wishesTotalPages: 1,
  isOpen: false,
  audioReady: false
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const formatNumber = (value) => new Intl.NumberFormat("id-ID").format(Number(value || 0));

const setText = (selector, value) => {
  $$(selector).forEach((element) => { element.textContent = value ?? ""; });
};

const setImage = (selector, src, alt) => {
  $$(selector).forEach((image) => {
    image.src = src || image.dataset.fallback || "./assets/images/placeholder.svg";
    if (alt) image.alt = alt;
  });
};

const parseGuest = () => {
  const params = new URLSearchParams(window.location.search);
  const rawName = params.get("to") || params.get("guest") || "Tamu Undangan";
  state.guestName = rawName.trim().slice(0, 80) || "Tamu Undangan";
  state.guestToken = (params.get("token") || "").trim().slice(0, 120);
  setText("[data-guest-name]", state.guestName);
};

const applyTheme = () => {
  const root = document.documentElement;
  root.style.setProperty("--primary", state.config.themePrimary || APP_CONFIG.fallback.themePrimary);
  root.style.setProperty("--secondary", state.config.themeSecondary || APP_CONFIG.fallback.themeSecondary);
  root.style.setProperty("--accent", state.config.themeAccent || APP_CONFIG.fallback.themeAccent);
};

const applyConfig = () => {
  const c = state.config;
  document.title = `${c.siteTitle} - ${c.celebrantName}`;

  setText("[data-site-title]", c.siteTitle);
  setText("[data-celebrant-name]", c.celebrantName);
  setText("[data-nickname]", c.nickname);
  setText("[data-age]", formatNumber(c.age));
  $$("[data-age-wrap]").forEach((element) => { element.hidden = !(Number(c.age) > 0); });
  setText("[data-date-label]", c.dateLabel);
  setText("[data-time-label]", c.timeLabel);
  setText("[data-venue]", c.venue);
  setText("[data-address]", c.address);
  setText("[data-greeting]", c.greeting);
  setText("[data-story-title]", c.storyTitle);
  setText("[data-story-text]", c.storyText);
  setText("[data-dress-code]", c.dressCode);
  setText("[data-host-name]", c.hostName);
  setText("[data-closing-message]", c.closingMessage);
  setText("[data-gift-title]", c.giftTitle);
  setText("[data-gift-description]", c.giftDescription);
  setText("[data-gift-bank]", c.giftBank);
  setText("[data-gift-account-name]", c.giftAccountName);
  setText("[data-gift-account-number]", c.giftAccountNumber);

  setImage("[data-hero-image]", c.heroImage, `Foto ${c.celebrantName}`);
  setImage("[data-portrait-image]", c.portraitImage, `Potret ${c.celebrantName}`);

  const mapLinks = $$('[data-map-link]');
  mapLinks.forEach((link) => { link.href = c.mapUrl || "#"; });

  $("#gift-section")?.toggleAttribute("hidden", !Boolean(c.giftEnabled));
  $("#upload-section")?.toggleAttribute("hidden", !Boolean(c.uploadEnabled));
  $("#music-toggle")?.toggleAttribute("hidden", !(c.musicEnabled && c.musicUrl));

  const audio = $("#background-music");
  if (audio && c.musicEnabled && c.musicUrl) {
    audio.src = c.musicUrl;
    audio.load();
    state.audioReady = true;
  }

  $("#calendar-link").href = createCalendarUrl(c);
  applyTheme();
};

const createCalendarUrl = (config) => {
  const cleanDate = (value) => new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", `${config.siteTitle} - ${config.celebrantName}`);
  url.searchParams.set("dates", `${cleanDate(config.eventStart)}/${cleanDate(config.eventEnd)}`);
  url.searchParams.set("details", config.greeting || "Undangan ulang tahun digital");
  url.searchParams.set("location", `${config.venue}, ${config.address}`);
  url.searchParams.set("ctz", config.timezone || "Asia/Jakarta");
  return url.toString();
};

const loadRemoteConfig = async () => {
  try {
    const response = await api.get("config");
    if (response?.data) {
      state.config = { ...state.config, ...response.data };
    }
  } catch (error) {
    console.info("Menggunakan konfigurasi lokal:", error.message);
    showStatus("Mode demo aktif. Hubungkan Apps Script untuk data dinamis.", "info");
  }
  applyConfig();
};

const setupCountdown = () => {
  const endMessage = $("#countdown-ended");
  const target = new Date(state.config.eventStart).getTime();

  const update = () => {
    const distance = target - Date.now();
    if (!Number.isFinite(target) || distance <= 0) {
      ["days", "hours", "minutes", "seconds"].forEach((unit) => setText(`[data-countdown='${unit}']`, "00"));
      if (endMessage) endMessage.hidden = false;
      return false;
    }

    const values = {
      days: Math.floor(distance / 86400000),
      hours: Math.floor((distance % 86400000) / 3600000),
      minutes: Math.floor((distance % 3600000) / 60000),
      seconds: Math.floor((distance % 60000) / 1000)
    };

    Object.entries(values).forEach(([unit, value]) => {
      setText(`[data-countdown='${unit}']`, String(value).padStart(2, "0"));
    });
    return true;
  };

  update();
  const timer = setInterval(() => {
    if (!update()) clearInterval(timer);
  }, 1000);
};

const openInvitation = async () => {
  if (state.isOpen) return;
  state.isOpen = true;
  document.body.classList.add("invitation-open");
  $("#cover").setAttribute("aria-hidden", "true");
  $("#main-content").removeAttribute("inert");
  $("#home").focus({ preventScroll: true });
  launchConfetti();

  if (state.audioReady) {
    try {
      await $("#background-music").play();
      $("#music-toggle").classList.add("is-playing");
      $("#music-toggle").setAttribute("aria-pressed", "true");
    } catch {
      // Autoplay dapat ditolak; pengguna tetap dapat menyalakan musik secara manual.
    }
  }
};

const setupMusic = () => {
  $("#music-toggle")?.addEventListener("click", async () => {
    const audio = $("#background-music");
    if (!audio?.src) return;
    if (audio.paused) await audio.play();
    else audio.pause();
    const playing = !audio.paused;
    $("#music-toggle").classList.toggle("is-playing", playing);
    $("#music-toggle").setAttribute("aria-pressed", String(playing));
  });
};

const showStatus = (message, type = "success", target = "#global-status") => {
  const element = $(target);
  if (!element) return;
  element.textContent = message;
  element.dataset.type = type;
  element.hidden = false;
  clearTimeout(element._hideTimer);
  element._hideTimer = setTimeout(() => { element.hidden = true; }, 7000);
};

const createWishCard = (wish) => {
  const article = document.createElement("article");
  article.className = "wish-card";
  const initial = escapeHtml((wish.name || "T").trim().charAt(0).toUpperCase());
  const date = wish.timestamp ? new Date(wish.timestamp).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short"
  }) : "";

  article.innerHTML = `
    <div class="wish-avatar" aria-hidden="true">${initial}</div>
    <div class="wish-body">
      <div class="wish-meta">
        <strong>${escapeHtml(wish.name || "Tamu")}</strong>
        <time>${escapeHtml(date)}</time>
      </div>
      <p>${escapeHtml(wish.message || "")}</p>
      ${wish.attendance ? `<span class="attendance-badge">${escapeHtml(wish.attendance)}</span>` : ""}
    </div>`;
  return article;
};

const loadWishes = async (page = 1) => {
  const container = $("#wish-list");
  const empty = $("#wish-empty");
  const loadButton = $("#load-more-wishes");
  if (!container) return;

  try {
    loadButton.disabled = true;
    loadButton.textContent = "Memuat...";
    const response = await api.get("wishes", { page, limit: APP_CONFIG.wishesPerPage });
    const items = response?.data?.items || [];
    const pagination = response?.data?.pagination || {};

    if (page === 1) container.replaceChildren();
    items.forEach((wish) => container.appendChild(createWishCard(wish)));
    state.wishesPage = Number(pagination.page || page);
    state.wishesTotalPages = Number(pagination.totalPages || 1);

    empty.hidden = container.children.length > 0;
    loadButton.hidden = state.wishesPage >= state.wishesTotalPages;
  } catch (error) {
    empty.hidden = false;
    empty.textContent = api.isConfigured()
      ? "Ucapan belum dapat dimuat. Silakan coba kembali."
      : "Belum ada ucapan pada mode demo.";
    loadButton.hidden = true;
  } finally {
    loadButton.disabled = false;
    loadButton.textContent = "Muat ucapan lainnya";
  }
};

const submitWish = async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const submit = $("button[type='submit']", form);
  const data = Object.fromEntries(new FormData(form));
  data.guestToken = state.guestToken;
  data.source = window.location.hostname;
  data.userAgent = navigator.userAgent.slice(0, 240);

  submit.disabled = true;
  submit.textContent = "Mengirim...";
  try {
    const response = await api.post("wish", data);
    form.reset();
    showStatus(response.message || "Ucapan berhasil dikirim dan menunggu moderasi.", "success", "#form-status");
    await loadWishes(1);
  } catch (error) {
    showStatus(error.message, "error", "#form-status");
  } finally {
    submit.disabled = false;
    submit.textContent = "Kirim ucapan";
  }
};

const submitRsvp = async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const submit = $("button[type='submit']", form);
  const data = Object.fromEntries(new FormData(form));
  data.guestToken = state.guestToken;
  data.source = window.location.hostname;

  submit.disabled = true;
  submit.textContent = "Menyimpan...";
  try {
    const response = await api.post("rsvp", data);
    showStatus(response.message || "Konfirmasi kehadiran berhasil disimpan.", "success", "#rsvp-status");
  } catch (error) {
    showStatus(error.message, "error", "#rsvp-status");
  } finally {
    submit.disabled = false;
    submit.textContent = "Simpan RSVP";
  }
};

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result).split(",")[1]);
  reader.onerror = () => reject(new Error("Gagal membaca file."));
  reader.readAsDataURL(file);
});

const submitUpload = async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const submit = $("button[type='submit']", form);
  const file = $("input[type='file']", form)?.files?.[0];

  if (!file) return showStatus("Pilih foto terlebih dahulu.", "error", "#upload-status");
  if (!APP_CONFIG.allowedUploadTypes.includes(file.type)) {
    return showStatus("Format foto harus JPG, PNG, atau WebP.", "error", "#upload-status");
  }
  if (file.size > APP_CONFIG.maxUploadBytes) {
    return showStatus("Ukuran foto maksimal 3 MB.", "error", "#upload-status");
  }

  submit.disabled = true;
  submit.textContent = "Mengunggah...";
  try {
    const base64 = await fileToBase64(file);
    const response = await api.post("upload", {
      name: new FormData(form).get("name"),
      caption: new FormData(form).get("caption"),
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      base64,
      guestToken: state.guestToken
    });
    form.reset();
    showStatus(response.message || "Foto berhasil diunggah dan menunggu moderasi.", "success", "#upload-status");
  } catch (error) {
    showStatus(error.message, "error", "#upload-status");
  } finally {
    submit.disabled = false;
    submit.textContent = "Unggah foto";
  }
};

const loadGallery = async () => {
  const grid = $("#gallery-grid");
  if (!grid) return;

  try {
    const response = await api.get("gallery");
    const items = response?.data?.items || [];
    if (!items.length) return;
    grid.replaceChildren();
    items.forEach((item) => {
      const button = document.createElement("button");
      button.className = "gallery-item";
      button.type = "button";
      button.dataset.full = item.url;
      button.setAttribute("aria-label", `Buka foto: ${item.caption || item.alt || "galeri"}`);
      const image = document.createElement("img");
      image.src = item.thumbnailUrl || item.url;
      image.alt = item.alt || item.caption || "Foto galeri ulang tahun";
      image.loading = "lazy";
      image.decoding = "async";
      button.appendChild(image);
      grid.appendChild(button);
    });
  } catch (error) {
    console.info("Galeri menggunakan aset lokal:", error.message);
  }
};

const setupGalleryModal = () => {
  const dialog = $("#image-dialog");
  const image = $("#dialog-image");
  $("#gallery-grid")?.addEventListener("click", (event) => {
    const button = event.target.closest(".gallery-item");
    if (!button) return;
    const source = button.dataset.full || $("img", button)?.src;
    image.src = source;
    image.alt = $("img", button)?.alt || "Foto galeri";
    dialog.showModal();
  });
  $("#dialog-close")?.addEventListener("click", () => dialog.close());
  dialog?.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
};

const setupNavigation = () => {
  const links = $$(".bottom-nav a");
  const sections = links.map((link) => $(link.getAttribute("href"))).filter(Boolean);
  const observer = new IntersectionObserver((entries) => {
    const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    links.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${visible.target.id}`));
  }, { rootMargin: "-35% 0px -55%", threshold: [0.05, 0.3, 0.6] });
  sections.forEach((section) => observer.observe(section));
};

const setupShare = () => {
  $("#share-button")?.addEventListener("click", async () => {
    const shareData = {
      title: document.title,
      text: `Undangan ulang tahun ${state.config.celebrantName}`,
      url: window.location.href
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(window.location.href);
        showStatus("Tautan undangan telah disalin.", "success");
      }
    } catch (error) {
      if (error.name !== "AbortError") showStatus("Tautan belum dapat dibagikan.", "error");
    }
  });
};

const setupCopyGift = () => {
  $("#copy-account")?.addEventListener("click", async () => {
    await navigator.clipboard.writeText(state.config.giftAccountNumber || "");
    showStatus("Nomor rekening berhasil disalin.", "success");
  });
};

const launchConfetti = () => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const canvas = $("#confetti");
  const context = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const resize = () => {
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();

  const palette = [state.config.themePrimary, state.config.themeSecondary, state.config.themeAccent, "#ffffff"];
  const pieces = Array.from({ length: 90 }, () => ({
    x: Math.random() * innerWidth,
    y: -20 - Math.random() * innerHeight * 0.4,
    size: 4 + Math.random() * 7,
    speed: 2 + Math.random() * 4,
    drift: -1.5 + Math.random() * 3,
    rotation: Math.random() * Math.PI,
    spin: -0.12 + Math.random() * 0.24,
    color: palette[Math.floor(Math.random() * palette.length)]
  }));

  const started = performance.now();
  const frame = (now) => {
    context.clearRect(0, 0, innerWidth, innerHeight);
    pieces.forEach((piece) => {
      piece.y += piece.speed;
      piece.x += piece.drift;
      piece.rotation += piece.spin;
      context.save();
      context.translate(piece.x, piece.y);
      context.rotate(piece.rotation);
      context.fillStyle = piece.color;
      context.fillRect(-piece.size / 2, -piece.size / 4, piece.size, piece.size / 2);
      context.restore();
    });
    if (now - started < 4500) requestAnimationFrame(frame);
    else context.clearRect(0, 0, innerWidth, innerHeight);
  };
  requestAnimationFrame(frame);
};

const init = async () => {
  parseGuest();
  applyConfig();
  await loadRemoteConfig();
  setupCountdown();
  setupMusic();
  setupGalleryModal();
  setupNavigation();
  setupShare();
  setupCopyGift();

  $("#open-invitation")?.addEventListener("click", openInvitation);
  $("#wish-form")?.addEventListener("submit", submitWish);
  $("#rsvp-form")?.addEventListener("submit", submitRsvp);
  $("#upload-form")?.addEventListener("submit", submitUpload);
  $("#load-more-wishes")?.addEventListener("click", () => loadWishes(state.wishesPage + 1));

  await Promise.allSettled([loadGallery(), loadWishes(1)]);
};

document.addEventListener("DOMContentLoaded", init);
