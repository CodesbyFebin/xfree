/* XFree Home — production script
 * Strict mode, IIFE, no globals, no eval.
 * Respects prefers-reduced-motion via CSS.
 */

(function () {
  "use strict";

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $$(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  function rafThrottle(fn) {
    var ticking = false;
    return function () {
      var args = arguments;
      var ctx = this;
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(function () {
          fn.apply(ctx, args);
          ticking = false;
        });
      }
    };
  }

  var toastEl = null;
  var toastTimer = null;
  function showToast(message, isError) {
    if (!toastEl) toastEl = $("#toast");
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.toggle("toast-error", Boolean(isError));
    toastEl.hidden = false;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.hidden = true;
    }, 3000);
  }

  var yearEl = $("#footerYear");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  var hamburger = $("#hamburgerBtn");
  var mobileMenu = $("#mobile-menu");
  if (hamburger && mobileMenu) {
    function closeMenu() {
      hamburger.setAttribute("aria-expanded", "false");
      hamburger.setAttribute("aria-label", "Open navigation menu");
      mobileMenu.hidden = true;
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    }
    function openMenu() {
      hamburger.setAttribute("aria-expanded", "true");
      hamburger.setAttribute("aria-label", "Close navigation menu");
      mobileMenu.hidden = false;
      document.addEventListener("keydown", onKey);
      setTimeout(function () {
        document.addEventListener("click", onClick);
      }, 0);
    }
    function onKey(e) {
      if (e.key === "Escape") closeMenu();
    }
    function onClick(e) {
      if (!mobileMenu.contains(e.target) && !hamburger.contains(e.target)) {
        closeMenu();
      }
    }
    hamburger.addEventListener("click", function (e) {
      e.stopPropagation();
      if (mobileMenu.hidden) openMenu();
      else closeMenu();
    });
  }

  document.addEventListener("keydown", function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      var searchEl = $("[data-search-input]");
      if (searchEl) searchEl.focus();
    }
  });

  var pendingStats = null;
  $$("[data-source]").forEach(function (el) {
    if (el.getAttribute("data-source") === "/api/v1/stats") pendingStats = el;
  });

  if ("IntersectionObserver" in window && pendingStats) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.disconnect();
        loadStats(pendingStats);
      });
    });
    io.observe(pendingStats);
  } else if (pendingStats) {
    loadStats(pendingStats);
  }

  function loadStats(el) {
    fetch("/api/v1/stats", { credentials: "omit" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data) return;
        var toolsEl = $("#metricTools");
        var pillarsEl = $("#metricPillars");
        if (toolsEl && typeof data.tools === "number") toolsEl.textContent = String(data.tools);
        if (pillarsEl && typeof data.pillars === "number") pillarsEl.textContent = String(data.pillars);
      })
      .catch(function () { /* silent — public metrics are non-critical */ });
  }

  // ── JSON formatter demo (Local Mode) ────────────────────────
  // Pure functions; exposed on the IIFE-bound object for tests.
  var JSON_FORMATTER = {
    format: function (input) {
      try {
        return { ok: true, value: JSON.stringify(JSON.parse(input), null, 2) };
      } catch (err) {
        return { ok: false, error: err && err.message ? err.message : "Invalid JSON" };
      }
    },
  };

  var demoInput = $("#demoInput");
  var demoOutput = $("#demoOutput");
  var demoStatus = $("#demoStatus");
  if (demoInput && demoOutput && demoStatus) {
    function runDemo() {
      var result = JSON_FORMATTER.format(demoInput.value);
      if (result.ok) {
        demoOutput.textContent = result.value;
        demoOutput.classList.remove("demo-error");
        demoStatus.textContent = "Valid · " + result.value.length + " chars";
        demoStatus.classList.add("demo-ok");
        demoStatus.classList.remove("demo-err");
      } else {
        demoOutput.textContent = "Error: " + result.error;
        demoOutput.classList.add("demo-error");
        demoStatus.textContent = "Invalid JSON";
        demoStatus.classList.add("demo-err");
        demoStatus.classList.remove("demo-ok");
      }
    }
    demoInput.addEventListener("input", runDemo);
    runDemo();
  }

  // ── Hero search bar (Local Mode) ───────────────────────────
  // Debounced fetch against the public /api/v1/search endpoint.
  // Results are rendered into a list under the search input; the input
  // itself is the canonical form element with role="search" on the
  // wrapping <form>.
  var heroSearch = $("#heroSearch");
  var heroSearchResults = $("#heroSearchResults");
  if (heroSearch && heroSearchResults) {
    var searchSeq = 0;
    function renderSearchResults(results) {
      heroSearchResults.innerHTML = "";
      if (!results || results.length === 0) {
        var empty = document.createElement("div");
        empty.className = "hero-search-empty";
        empty.textContent = "No matches.";
        heroSearchResults.appendChild(empty);
        heroSearchResults.hidden = false;
        return;
      }
      var list = document.createElement("ul");
      results.slice(0, 8).forEach(function (r) {
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.href = r.href;
        var kind = document.createElement("span");
        kind.className = "result-kind";
        kind.textContent = r.kind === "tool" ? "Tool" : "Pillar";
        var title = document.createElement("span");
        title.className = "result-title";
        title.appendChild(kind);
        title.appendChild(document.createTextNode(r.title));
        var desc = document.createElement("span");
        desc.className = "result-desc";
        desc.textContent = r.description;
        a.appendChild(title);
        a.appendChild(desc);
        li.appendChild(a);
        list.appendChild(li);
      });
      heroSearchResults.appendChild(list);
      heroSearchResults.hidden = false;
    }
    function showSearchLoading() {
      heroSearchResults.innerHTML = "";
      var loading = document.createElement("div");
      loading.className = "hero-search-loading";
      loading.textContent = "Searching…";
      heroSearchResults.appendChild(loading);
      heroSearchResults.hidden = false;
    }
    function hideSearch() {
      heroSearchResults.hidden = true;
      heroSearchResults.innerHTML = "";
    }
    var searchDebounce = 0;
    function runSearch() {
      var q = heroSearch.value.trim();
      if (!q) { hideSearch(); return; }
      showSearchLoading();
      var seq = ++searchSeq;
      fetch("/api/v1/search?q=" + encodeURIComponent(q), { credentials: "omit" })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (data) {
          if (seq !== searchSeq) return; // stale
          if (!data) { hideSearch(); return; }
          renderSearchResults(data.results || []);
        })
        .catch(function () {
          if (seq !== searchSeq) return;
          hideSearch();
        });
    }
    heroSearch.addEventListener("input", function () {
      clearTimeout(searchDebounce);
      var q = heroSearch.value.trim();
      if (!q) { hideSearch(); return; }
      searchDebounce = window.setTimeout(runSearch, 180);
    });
    heroSearch.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        hideSearch();
        heroSearch.blur();
      }
    });
    // Ctrl/Cmd+K focuses search
    document.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        heroSearch.focus();
        heroSearch.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker
        .register("/home/service-worker.js", { scope: "/home/" })
        .catch(function () { /* offline is non-critical */ });
    });
  }
})();
