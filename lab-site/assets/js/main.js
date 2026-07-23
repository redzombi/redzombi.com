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

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
    if (!localStorage.getItem(STORAGE_KEY)) applyTheme("auto");
  });

  /* ---------- live clock ---------- */
  const clockEl = document.getElementById("clock");
  function tickClock() {
    if (!clockEl) return;
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  tickClock();
  setInterval(tickClock, 1000 * 15);

  /* ---------- uptime counter (since relaunch 2026-07-22) ---------- */
  const uptimeEl = document.getElementById("uptime");
  const LAUNCH_DATE = new Date("2026-07-22T00:00:00").getTime();
  function tickUptime() {
    if (!uptimeEl) return;
    const now = Date.now();
    const ms = now - LAUNCH_DATE;
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    uptimeEl.textContent = days + "d " + String(hours).padStart(2, "0") + "h";
  }
  tickUptime();
  setInterval(tickUptime, 1000 * 60);

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

  /* ---------- boot sequence (first load only) ---------- */
  function showBootSequence() {
    const bootEl = document.getElementById("boot-sequence");
    const bootText = bootEl.querySelector(".boot-text");
    const bootButton = bootEl.querySelector(".boot-skip");
    if (!bootEl) return;

    const messages = [
      "redzombi.com [v0.1.0]",
      "booting up...",
      "",
      "// digital playground",
      "// no roadmap. no deadline.",
      "",
      "ready.",
    ];

    let idx = 0;
    const interval = setInterval(function () {
      if (idx < messages.length) {
        bootText.textContent += (bootText.textContent ? "\n" : "") + messages[idx];
        idx++;
      } else {
        clearInterval(interval);
      }
    }, 80);

    bootEl.hidden = false;

    const closeBoot = function () {
      bootEl.hidden = true;
      localStorage.setItem("redzombi-boot-skip", "true");
      document.removeEventListener("keydown", closeBoot);
      document.removeEventListener("click", closeBoot);
      window.removeEventListener("keydown", closeBoot);
      if (bootButton) bootButton.removeEventListener("click", closeBoot);
    };

    // Multiple attach points to ensure it works
    document.addEventListener("keydown", closeBoot);
    document.addEventListener("click", closeBoot);
    window.addEventListener("keydown", closeBoot);
    if (bootButton) bootButton.addEventListener("click", closeBoot);
  }

  if (!localStorage.getItem("redzombi-boot-skip")) {
    showBootSequence();
  }

  /* ---------- random transmissions (glitch effect) ---------- */
  const TRANSMISSIONS = [
    "// lost signal",
    "// signal degraded",
    "// [ERROR]",
    "// --",
    "// scanning...",
    "// offline",
  ];

  function showTransmission() {
    const messages = document.querySelectorAll(".log-entry p, .post-item p");
    if (messages.length > 0) {
      const random = messages[Math.floor(Math.random() * messages.length)];
      const tx = document.createElement("span");
      tx.className = "transmission";
      tx.textContent = TRANSMISSIONS[Math.floor(Math.random() * TRANSMISSIONS.length)];
      random.parentNode.insertBefore(tx, random.nextSibling);
      setTimeout(function () { tx.remove(); }, 300);
    }
  }

  window.addEventListener("scroll", function () {
    if (Math.random() < 0.05) showTransmission();
  });

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
        const copyBtn = '<button class="copy-btn" data-copy="log" title="copy to clipboard">copy</button>';
        return (
          '<article class="log-entry">' +
          '<div class="log-line"><time>' + escapeHTML(e.date) + "</time>" + tag + copyBtn + "</div>" +
          "<p>" + escapeHTML(e.body) + "</p>" +
          "</article>"
        );
      })
      .join("");

    document.querySelectorAll(".log-entry .copy-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const text = btn.parentNode.nextElementSibling.textContent;
        navigator.clipboard.writeText(text).then(function () {
          btn.classList.add("copied");
          btn.textContent = "✓";
          setTimeout(function () {
            btn.classList.remove("copied");
            btn.textContent = "copy";
          }, 1500);
        });
      });
    });
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

  /* ---------- command palette ---------- */
  const paletteEl = document.getElementById("palette");
  const paletteInput = document.getElementById("palette-input");
  const paletteResults = document.getElementById("palette-results");

  const COMMANDS = [
    { name: "help", desc: "show keyboard shortcuts" },
    { name: "clear", desc: "clear all (just a prompt easter egg)" },
    { name: "uptime", desc: "show system uptime" },
  ];

  function openPalette() {
    if (paletteEl) {
      paletteEl.hidden = false;
      paletteInput.focus();
      paletteInput.value = "";
      searchPalette("");
    }
  }

  function closePalette() {
    if (paletteEl) paletteEl.hidden = true;
  }

  function searchPalette(query) {
    query = query.toLowerCase();

    let results = [];

    // search posts
    postIndex.forEach(function (p) {
      if (
        p.title.toLowerCase().includes(query) ||
        (Array.isArray(p.tags) && p.tags.some(function (t) { return t.toLowerCase().includes(query); }))
      ) {
        results.push({
          type: "post",
          name: p.title,
          desc: "post",
          action: function () { window.location.hash = "post/" + p.slug; closePalette(); },
        });
      }
    });

    // search commands
    COMMANDS.forEach(function (cmd) {
      if (cmd.name.includes(query) || cmd.desc.includes(query)) {
        results.push({
          type: "command",
          name: cmd.name,
          desc: cmd.desc,
          action: function () { executeCommand(cmd.name); closePalette(); },
        });
      }
    });

    paletteResults.innerHTML = results
      .map(function (r, i) {
        return (
          '<div class="palette-item ' + r.type + '" data-idx="' + i + '">' +
          '<strong>' + escapeHTML(r.name) + "</strong> " +
          '<span style="color: var(--text-muted); font-size: 11px;">// ' + escapeHTML(r.desc) + "</span>" +
          "</div>"
        );
      })
      .join("");

    document.querySelectorAll(".palette-item").forEach(function (item, i) {
      item.addEventListener("click", function () { results[i].action(); });
      item.addEventListener("mouseenter", function () {
        document.querySelectorAll(".palette-item").forEach(function (el) { el.classList.remove("selected"); });
        item.classList.add("selected");
      });
    });
  }

  function executeCommand(cmd) {
    switch (cmd) {
      case "help":
        alert(
          "keyboard shortcuts:\n" +
          "/ - open command palette\n" +
          "j/k - next/prev post\n" +
          "h/l - scroll left/right\n" +
          "? - this help"
        );
        break;
      case "clear":
        alert("root@redzombi:~# clear\n\n");
        break;
      case "uptime":
        alert("System uptime: " + (uptimeEl ? uptimeEl.textContent : "unknown"));
        break;
    }
  }

  if (paletteInput) {
    paletteInput.addEventListener("input", function () { searchPalette(paletteInput.value); });
    paletteInput.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closePalette();
      if (e.key === "Enter") {
        const first = paletteResults.querySelector(".palette-item");
        if (first) first.click();
      }
    });
  }

  if (paletteEl) {
    paletteEl.querySelector(".palette-backdrop").addEventListener("click", closePalette);
  }

  /* ---------- vim keybinds ---------- */
  const KEY_REPEAT_DELAY = 300;
  let lastKeyTime = {};

  document.addEventListener("keydown", function (e) {
    const now = Date.now();
    const key = e.key.toLowerCase();

    // ignore if typing in an input
    if (e.target.tagName === "INPUT") return;

    // command palette
    if (key === "/") {
      e.preventDefault();
      openPalette();
      return;
    }

    // help
    if (key === "?") {
      e.preventDefault();
      executeCommand("help");
      return;
    }

    // vim keybinds (prevent repeat spam)
    if (lastKeyTime[key] && now - lastKeyTime[key] < KEY_REPEAT_DELAY) return;
    lastKeyTime[key] = now;

    // hjkl scrolling
    if (key === "h") {
      e.preventDefault();
      window.scrollBy(-100, 0);
    } else if (key === "l") {
      e.preventDefault();
      window.scrollBy(100, 0);
    } else if (key === "j") {
      e.preventDefault();
      window.scrollBy(0, 200);
    } else if (key === "k") {
      e.preventDefault();
      window.scrollBy(0, -200);
    }
  });

  /* ---------- hero status line ---------- */
  function updateHeroStatus(logCount, projectCount, postCount) {
    const statusText = document.getElementById("hero-status");
    if (!statusText) return;

    const parts = [];
    if (projectCount) parts.push(projectCount + " project" + (projectCount === 1 ? "" : "s"));
    if (postCount) parts.push(postCount + " post" + (postCount === 1 ? "" : "s"));
    if (logCount) parts.push(logCount + " log entr" + (logCount === 1 ? "y" : "ies"));

    statusText.textContent = parts.length
      ? "STATUS: ACTIVE · " + parts.join(", ")
      : "STATUS: EMPTY · nothing published yet";
  }

  /* ---------- boot ---------- */
  Promise.all([
    loadJSON("data/log.json"),
    loadJSON("data/projects.json"),
    loadJSON("data/posts.json"),
  ]).then(function (results) {
    const logEntries = results[0] || [];
    const projects = results[1] || [];
    const posts = results[2] || [];

    renderLog(logEntries);
    renderProjects(projects);
    postIndex = posts;
    routePosts();
    updateHeroStatus(logEntries.length, projects.length, posts.length);
  });
})();
