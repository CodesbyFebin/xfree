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

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker
        .register("/home/service-worker.js", { scope: "/home/" })
        .catch(function () { /* offline is non-critical */ });
    });
  }
})();
