/* ==========================================================================
   REDZOMBI LABS — site script
   No build step, no bundler. marked.js loaded via CDN <script> in index.html.
   ========================================================================== */

(function () {
  "use strict";

  /* ---------- theme: auto by default, manual override persisted ---------- */
  const root = document.documentElement;
  const rocker = document.getElementById("theme-toggle");
  const STORAGE_KEY = "redzombi-labs-theme"; // "crt" | "print" | absent = auto

  function systemPrefersCrt() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function applyTheme(mode) {
    // mode: "crt" | "print" | "auto"
    if (mode === "auto") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", mode);
    }
    const effective = mode === "auto" ? (systemPrefersCrt() ? "crt" : "print") : mode;
    if (rocker) {
      rocker.setAttribute("data-state", effective);
      rocker.setAttribute("aria-checked", effective === "crt");
      rocker.setAttribute(
        "aria-label",
        "Theme: " + effective + " (click to override, auto-follows system by default)"
      );
    }
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  applyTheme(stored || "auto");

  if (rocker) {
    rocker.addEventListener("click", function () {
      const current = root.getAttribute("data-theme") || (systemPrefersCrt() ? "crt" : "print");
      const next = current === "crt" ? "print" : "crt";
      localStorage.setItem(STORAGE_KEY, next);
      applyTheme(next);
    });
  }

  // If user hasn't manually overridden, keep following system changes live
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
    if (!localStorage.getItem(STORAGE_KEY)) applyTheme("auto");
  });

  /* ---------- live clock (local time, quiet status-bar detail) ---------- */
  const clockEl = document.getElementById("clock");
  function tickClock() {
    if (!clockEl) return;
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  tickClock();
  setInterval(tickClock, 1000 * 15);

  /* ---------- shared helpers ---------- */
  async function loadJSON(path) {
    try {
      const res = await fetch(path, { cache: "no-store" });
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      console.warn("Could not load", path, err);
      return [];
    }
  }

  function escapeHTML(str) {
    const div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function byDateDesc(a, b) {
    return new Date(b.date) - new Date(a.date);
  }

  /* ---------- log ---------- */
  function renderLog(entries) {
    const feed = document.getElementById("log-feed");
    const empty = document.getElementById("log-empty");
    const count = document.getElementById("log-count");
    if (!feed) return;

    if (!entries.length) {
      feed.hidden = true;
      if (empty) empty.hidden = false;
      if (count) count.textContent = "0";
      return;
    }

    if (empty) empty.hidden = true;
    feed.hidden = false;
    if (count) count.textContent = String(entries.length);

    const sorted = entries.slice().sort(byDateDesc);

    feed.innerHTML = sorted
      .map(function (e) {
        const tag = e.tag ? '<span class="log-tag">#' + escapeHTML(e.tag) + "</span>" : "";
        return (
          '<article class="log-entry">' +
          '<div class="log-line"><time>' + escapeHTML(e.date) + "</time>" + tag + "</div>" +
          "<p>" + escapeHTML(e.body) + "</p>" +
          "</article>"
        );
      })
      .join("");
  }

  /* ---------- projects ---------- */
  function renderProjects(projects) {
    const grid = document.getElementById("project-grid");
    const empty = document.getElementById("project-empty");
    const count = document.getElementById("project-count");
    if (!grid) return;

    if (!projects.length) {
      grid.hidden = true;
      if (empty) empty.hidden = false;
      if (count) count.textContent = "0";
      return;
    }

    if (empty) empty.hidden = true;
    grid.hidden = false;
    if (count) count.textContent = String(projects.length);

    grid.innerHTML = projects
      .map(function (p) {
        const status = (p.status || "idea").toLowerCase();
        const link = p.url
          ? '<a href="' + escapeHTML(p.url) + '">' + escapeHTML(p.linkLabel || "open \u2192") + "</a>"
          : "";
        return (
          '<article class="card project-card">' +
          '<div class="status ' + escapeHTML(status) + '">' + escapeHTML((p.status || "IDEA").toUpperCase()) + "</div>" +
          "<h3>" + escapeHTML(p.name) + "</h3>" +
          "<p>" + escapeHTML(p.description) + "</p>" +
          link +
          "</article>"
        );
      })
      .join("");
  }

  /* ---------- posts (list + hash-routed detail) ---------- */
  let postIndex = [];

  function renderPostList() {
    const list = document.getElementById("post-list");
    const empty = document.getElementById("post-empty");
    const count = document.getElementById("post-count");
    if (!list) return;

    if (!postIndex.length) {
      list.hidden = true;
      if (empty) empty.hidden = false;
      if (count) count.textContent = "0";
      return;
    }

    if (empty) empty.hidden = true;
    list.hidden = false;
    if (count) count.textContent = String(postIndex.length);

    const sorted = postIndex.slice().sort(byDateDesc);

    list.innerHTML = sorted
      .map(function (p) {
        const tags = Array.isArray(p.tags)
          ? p.tags.map(function (t) { return '<span class="tag">#' + escapeHTML(t) + "</span>"; }).join(" ")
          : "";
        return (
          '<article class="post-item">' +
          "<time>" + escapeHTML(p.date) + "</time>" +
          '<h3><a href="#post/' + escapeHTML(p.slug) + '">' + escapeHTML(p.title) + "</a></h3>" +
          "<p>" + escapeHTML(p.summary) + "</p>" +
          tags +
          "</article>"
        );
      })
      .join("");
  }

  async function renderPostDetail(slug) {
    const listEl = document.getElementById("post-list");
    const emptyEl = document.getElementById("post-empty");
    const detailEl = document.getElementById("post-detail");
    const articleEl = document.getElementById("post-article");
    if (!detailEl || !articleEl) return;

    const meta = postIndex.find(function (p) { return p.slug === slug; });
    if (!meta) {
      // unknown slug — fall back to list view
      window.location.hash = "posts";
      return;
    }

    try {
      const res = await fetch("posts/" + encodeURIComponent(slug) + ".md", { cache: "no-store" });
      const md = res.ok ? await res.text() : "*Could not load this post.*";
      articleEl.innerHTML = window.marked ? window.marked.parse(md) : escapeHTML(md);
    } catch (err) {
      console.warn("Could not load post", slug, err);
      articleEl.innerHTML = "<p><em>Could not load this post.</em></p>";
    }

    if (listEl) listEl.hidden = true;
    if (emptyEl) emptyEl.hidden = true;
    detailEl.hidden = false;
  }

  function showPostList() {
    const detailEl = document.getElementById("post-detail");
    if (detailEl) detailEl.hidden = true;
    renderPostList();
  }

  function routePosts() {
    const hash = window.location.hash.replace(/^#/, "");
    const match = hash.match(/^post\/(.+)$/);
    if (match) {
      renderPostDetail(decodeURIComponent(match[1]));
    } else {
      showPostList();
    }
  }

  window.addEventListener("hashchange", routePosts);

  /* ---------- boot ---------- */
  Promise.all([
    loadJSON("data/log.json"),
    loadJSON("data/projects.json"),
    loadJSON("data/posts.json"),
  ]).then(function (results) {
    renderLog(results[0] || []);
    renderProjects(results[1] || []);
    postIndex = results[2] || [];
    routePosts();
  });
})();
