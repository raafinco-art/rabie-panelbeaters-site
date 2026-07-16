/* Gallery interactions: before/after slider, category filter, lightbox. */
(function () {
  "use strict";

  /* ---------- Before / after slider ---------- */
  var slider = document.querySelector(".ba-slider");
  if (slider) {
    var range = slider.querySelector(".ba-slider__range");
    range.addEventListener("input", function () {
      slider.style.setProperty("--split", range.value + "%");
    });
  }

  /* ---------- Category filter ---------- */
  var bar = document.querySelector(".filter-bar");
  var figures = Array.prototype.slice.call(document.querySelectorAll(".gallery-grid figure"));
  if (bar) {
    bar.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      Array.prototype.forEach.call(bar.querySelectorAll("button"), function (b) {
        b.setAttribute("aria-pressed", String(b === btn));
      });
      var cat = btn.getAttribute("data-filter");
      figures.forEach(function (fig) {
        fig.hidden = cat !== "all" && fig.getAttribute("data-cat") !== cat;
      });
    });
  }

  /* ---------- Lightbox ---------- */
  var box = document.getElementById("lightbox");
  if (box && typeof box.showModal === "function") {
    var img = box.querySelector("img");
    var caption = box.querySelector(".lightbox__caption");
    var current = -1;

    function visibleFigures() {
      return figures.filter(function (f) { return !f.hidden; });
    }
    function show(i) {
      var vis = visibleFigures();
      if (!vis.length) return;
      current = (i + vis.length) % vis.length;
      var f = vis[current];
      var src = f.querySelector("img");
      img.src = src.getAttribute("data-full") || src.src;
      img.alt = src.alt;
      caption.textContent = f.querySelector("figcaption").textContent;
    }
    document.querySelector(".gallery-grid").addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      var fig = btn.closest("figure");
      show(visibleFigures().indexOf(fig));
      box.showModal();
    });
    box.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") show(current + 1);
      if (e.key === "ArrowLeft") show(current - 1);
    });
    box.querySelector(".lightbox__close").addEventListener("click", function () { box.close(); });
    box.addEventListener("click", function (e) {
      if (e.target === box) box.close(); // backdrop click
    });
  }
})();
