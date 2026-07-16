/* Rabie Panelbeaters - global interactions.
   Motion language: engineered, weighted, no bounce.
   Everything degrades: content is fully visible without JS. */
(function () {
  "use strict";

  var docEl = document.documentElement;
  docEl.classList.add("js"); // enables reveal styling (CSS gates on html.js)

  var motionOK = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;

  /* ---------- Footer year ---------- */
  var y = document.getElementById("y");
  if (y) y.textContent = String(new Date().getFullYear());

  /* ---------- Sticky header shadow / parallax / timeline progress ---------- */
  var header = document.querySelector(".site-header");
  var parallaxEls = motionOK
    ? Array.prototype.slice.call(document.querySelectorAll("[data-parallax], .page-hero__bg, .cta-banner__bg"))
    : [];
  var timeline = document.querySelector(".timeline");
  var timelineSteps = timeline ? Array.prototype.slice.call(timeline.querySelectorAll(".timeline__step")) : [];
  var ticking = false;

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      ticking = false;
      var sy = window.scrollY;
      if (header) header.classList.toggle("is-scrolled", sy > 8);

      for (var i = 0; i < parallaxEls.length; i++) {
        var el = parallaxEls[i];
        // Measure the untransformed anchor, not the shifted element itself
        var anchor = el.closest(".page-hero, .cta-banner, .hero") || el.parentElement || el;
        var r = anchor.getBoundingClientRect();
        var vh = window.innerHeight;
        if (r.bottom < 0 || r.top > vh) continue;
        var mid = r.top + r.height / 2 - vh / 2;
        var shift = Math.max(-24, Math.min(24, -mid / vh * 48));
        var isBg = el.classList.contains("page-hero__bg") || el.classList.contains("cta-banner__bg");
        el.style.transform = "translateY(" + shift.toFixed(1) + "px)" + (isBg ? " scale(1.1)" : "");
      }

      if (timeline) {
        var tr = timeline.getBoundingClientRect();
        var vh2 = window.innerHeight;
        var progress = Math.max(0, Math.min(1, (vh2 * 0.8 - tr.top) / tr.height));
        timeline.style.setProperty("--progress", String(progress));
        var progPx = progress * tr.height;
        for (var s = 0; s < timelineSteps.length; s++) {
          timelineSteps[s].classList.toggle("is-active", timelineSteps[s].offsetTop + 24 <= progPx);
        }
      }
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Reveal on enter + counters ---------- */
  function setCounterFinal(el) {
    el.textContent = el.getAttribute("data-counter") + (el.getAttribute("data-suffix") || "");
  }
  function runCounter(el) {
    var target = parseInt(el.getAttribute("data-counter"), 10);
    var suffix = el.getAttribute("data-suffix") || "";
    var t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / 600);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(target * eased)) + suffix;
      if (p < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }

  /* Auto-choreography: stagger grid children, reveal section headings.
     Runs before the reveal list is collected; no-op under reduced motion. */
  if (motionOK) {
    var groups = document.querySelectorAll(".card-grid, .stat-row, .chip-list, .gallery-grid, .checklist, .trust-strip ul");
    Array.prototype.forEach.call(groups, function (group) {
      Array.prototype.forEach.call(group.children, function (child, i) {
        child.classList.add("reveal");
        child.style.setProperty("--stagger-i", String(i % 8));
      });
    });
    var heads = document.querySelectorAll(".section h2, .section .lead");
    Array.prototype.forEach.call(heads, function (el) {
      if (!el.closest(".hero") && !el.closest(".page-hero")) el.classList.add("reveal");
    });
  }

  var counters = Array.prototype.slice.call(document.querySelectorAll("[data-counter]"));
  var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal, .img-reveal"));

  if (!motionOK || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("reveal--visible"); });
    counters.forEach(setCounterFinal);
  } else {
    var seen = new WeakSet();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || seen.has(entry.target)) return;
        seen.add(entry.target);
        entry.target.classList.add("reveal--visible");
        if (entry.target.hasAttribute("data-counter")) runCounter(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15 });
    reveals.forEach(function (el) { io.observe(el); });
    counters.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Mobile menu ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("mobile-menu");
  var closeBtn = menu ? menu.querySelector(".mobile-menu__close") : null;
  var lastFocus = null;

  function openMenu() {
    lastFocus = document.activeElement;
    menu.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
    var first = menu.querySelector("a, button");
    if (first) first.focus();
  }
  function closeMenu() {
    menu.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      if (menu.classList.contains("is-open")) closeMenu(); else openMenu();
    });
    if (closeBtn) closeBtn.addEventListener("click", closeMenu);
    menu.addEventListener("click", function (e) {
      if (e.target.tagName === "A") closeMenu();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("is-open")) closeMenu();
    });
  }

  /* ---------- Services dropdown (keyboard + touch) ---------- */
  var dropdown = document.querySelector(".dropdown");
  var dropBtn = dropdown ? dropdown.querySelector(".dropdown__btn") : null;
  if (dropdown && dropBtn) {
    dropBtn.addEventListener("click", function () {
      var open = dropdown.classList.toggle("is-open");
      dropBtn.setAttribute("aria-expanded", String(open));
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && dropdown.classList.contains("is-open")) {
        dropdown.classList.remove("is-open");
        dropBtn.setAttribute("aria-expanded", "false");
        dropBtn.focus();
      }
    });
    document.addEventListener("click", function (e) {
      if (!dropdown.contains(e.target) && dropdown.classList.contains("is-open")) {
        dropdown.classList.remove("is-open");
        dropBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- Accordion (FAQ) ---------- */
  var accBtns = Array.prototype.slice.call(document.querySelectorAll(".accordion__btn"));
  accBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      if (panel) panel.style.maxHeight = open ? "0px" : panel.scrollHeight + "px";
    });
  });
})();
