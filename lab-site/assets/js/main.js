/* ==========================================================================
   SIGNAL BENCH — site script
   No build step, no dependencies. Edit directly.
   ========================================================================== */

(function () {
  "use strict";

  /* ---------- theme: auto by default, manual override persisted ---------- */
  const root = document.documentElement;
  const rocker = document.getElementById("theme-toggle");
  const STORAGE_KEY = "signal-bench-theme"; // "day" | "night" | absent = auto

  function systemPrefersNight() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function applyTheme(mode) {
    // mode: "day" | "night" | "auto"
    if (mode === "auto") {
      root.removeAttribute("data-theme");
    } else {
      root.setAttribute("data-theme", mode);
    }
    const effective = mode === "auto" ? (systemPrefersNight() ? "night" : "day") : mode;
    if (rocker) {
      rocker.setAttribute("data-state", effective);
      rocker.setAttribute("aria-checked", effective === "night");
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
      const current = root.getAttribute("data-theme") || (systemPrefersNight() ? "night" : "day");
      const next = current === "night" ? "day" : "night";
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

  /* ---------- data-driven sections: modules + notebook ---------- */
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

  function renderModules(modules) {
    const grid = document.getElementById("module-grid");
    const empty = document.getElementById("module-empty");
    const count = document.getElementById("module-count");
    if (!grid) return;

    if (!modules.length) {
      grid.hidden = true;
      if (empty) empty.hidden = false;
      if (count) count.textContent = "0";
      return;
    }

    if (empty) empty.hidden = true;
    grid.hidden = false;
    if (count) count.textContent = String(modules.length);

    grid.innerHTML = modules
      .map(function (m) {
        const link = m.url
          ? '<a href="' + escapeHTML(m.url) + '">' + escapeHTML(m.linkLabel || "open \u2192") + "</a>"
          : "";
        return (
          '<article class="module-card">' +
          '<div class="tag">' + escapeHTML(m.status || "active") + "</div>" +
          "<h3>" + escapeHTML(m.title) + "</h3>" +
          "<p>" + escapeHTML(m.description) + "</p>" +
          link +
          "</article>"
        );
      })
      .join("");
  }

  function renderNotebook(entries) {
    const feed = document.getElementById("notebook-feed");
    const empty = document.getElementById("notebook-empty");
    const count = document.getElementById("notebook-count");
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

    const sorted = entries.slice().sort(function (a, b) {
      return new Date(b.date) - new Date(a.date);
    });

    feed.innerHTML = sorted
      .map(function (e) {
        const tag = e.tag
          ? '<span class="entry-tag">' + escapeHTML(e.tag) + "</span>"
          : "";
        return (
          '<article class="notebook-entry">' +
          "<time>" + escapeHTML(e.date) + "</time>" +
          "<div><h3>" + escapeHTML(e.title) + "</h3>" +
          "<p>" + escapeHTML(e.body) + "</p>" +
          tag +
          "</div></article>"
        );
      })
      .join("");
  }

  Promise.all([loadJSON("data/modules.json"), loadJSON("data/notebook.json")]).then(
    function (results) {
      renderModules(results[0] || []);
      renderNotebook(results[1] || []);
    }
  );
})();
