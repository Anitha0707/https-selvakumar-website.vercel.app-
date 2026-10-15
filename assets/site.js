/* Insurance G. Selvakumar Ulundurpet — shared behaviour (no dependencies). */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* header: scroll shadow + mobile menu */
  var header = $(".site-header");
  if (header) {
    var onScroll = function () { header.classList.toggle("is-scrolled", window.scrollY > 8); };
    onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
  }
  var toggle = $(".nav-toggle"), links = $("#nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && links.classList.contains("is-open")) { links.classList.remove("is-open"); toggle.setAttribute("aria-expanded", "false"); toggle.focus(); }
    });
  }

  /* year */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* hero video: honour reduced motion, pause/play button */
  var hv = $("#hero-video"), hb = $("#hero-toggle");
  if (hv) {
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var setBtn = function () {
      if (!hb) return;
      var playing = !hv.paused;
      hb.setAttribute("aria-label", playing ? "Pause background video" : "Play background video");
      hb.innerHTML = playing
        ? '<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><rect x="1" y="1" width="3.5" height="10" rx="1"/><rect x="7.5" y="1" width="3.5" height="10" rx="1"/></svg>'
        : '<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true"><path d="M2 1l9 5-9 5z"/></svg>';
    };
    if (reduce) { hv.pause(); hv.removeAttribute("autoplay"); }
    hv.addEventListener("play", setBtn); hv.addEventListener("pause", setBtn); setBtn();
    if (hb) hb.addEventListener("click", function () { if (hv.paused) { hv.play().catch(function () {}); } else { hv.pause(); } });
  }

  /* copy buttons (clipboard may be refused in some views: fall back to selecting the text) */
  $$("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy"), label = btn.getAttribute("data-label") || btn.textContent;
      var done = function () { btn.classList.add("is-done"); btn.textContent = "Copied"; setTimeout(function () { btn.classList.remove("is-done"); btn.textContent = label; }, 1600); };
      var fallback = function () {
        var target = btn.closest("[data-copy-scope]"); var src = target && $("[data-copy-src]", target);
        if (src && window.getSelection) { var r = document.createRange(); r.selectNodeContents(src); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); }
        btn.textContent = "Select and copy"; setTimeout(function () { btn.textContent = label; }, 2200);
      };
      try { navigator.clipboard.writeText(text).then(done, fallback); } catch (e) { fallback(); }
    });
  });

  /* gallery: filter chips */
  var chips = $$(".chip[data-filter]");
  if (chips.length) {
    var items = $$(".gallery .g-item");
    var count = $("#g-count");
    chips.forEach(function (c) {
      c.addEventListener("click", function () {
        var f = c.getAttribute("data-filter"), n = 0;
        chips.forEach(function (o) { o.setAttribute("aria-pressed", o === c ? "true" : "false"); });
        items.forEach(function (it) { var show = f === "all" || it.getAttribute("data-cat") === f; it.hidden = !show; if (show) n++; });
        if (count) count.textContent = n + (n === 1 ? " photo" : " photos");
      });
    });
  }

  /* lightbox */
  var lb = null, lbList = [], lbIdx = 0, lastFocus = null;
  var icon = {
    x: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 4l12 12M16 4L4 16"/></svg>',
    l: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4l-6 6 6 6"/></svg>',
    r: '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 4l6 6-6 6"/></svg>'
  };
  function show(i) {
    lbIdx = (i + lbList.length) % lbList.length;
    var fig = lbList[lbIdx], img = $("img", fig);
    var stage = $(".lb-stage img", lb);
    stage.src = img.getAttribute("src"); stage.alt = img.getAttribute("alt") || "";
    $(".lb-cap b", lb).textContent = fig.getAttribute("data-title") || "";
    $(".lb-cap span", lb).textContent = fig.getAttribute("data-meta") || "";
    stage.style.animation = "none"; void stage.offsetWidth; stage.style.animation = "";
  }
  function closeLb() { if (!lb) return; document.removeEventListener("keydown", onKey); lb.remove(); lb = null; document.body.style.overflow = ""; if (lastFocus) lastFocus.focus(); }
  function onKey(e) {
    if (e.key === "Escape") closeLb();
    else if (e.key === "ArrowRight") show(lbIdx + 1);
    else if (e.key === "ArrowLeft") show(lbIdx - 1);
    else if (e.key === "Tab") { var b = $$("button", lb); var first = b[0], last = b[b.length - 1]; if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } }
  }
  function openLb(fig) {
    var scope = fig.closest("[data-gallery]") || document;
    lbList = $$(".g-item", scope).filter(function (f) { return !f.hidden; });
    var idx = lbList.indexOf(fig); if (idx < 0) return;
    lastFocus = document.activeElement;
    lb = document.createElement("div"); lb.className = "lb"; lb.setAttribute("role", "dialog"); lb.setAttribute("aria-modal", "true"); lb.setAttribute("aria-label", "Photo viewer");
    lb.innerHTML = '<div class="lb-stage"><img alt=""><button class="lb-btn lb-close" aria-label="Close photo">' + icon.x + '</button>' +
      (lbList.length > 1 ? '<button class="lb-btn lb-prev" aria-label="Previous photo">' + icon.l + '</button><button class="lb-btn lb-next" aria-label="Next photo">' + icon.r + '</button>' : '') +
      '</div><div class="lb-cap" aria-live="polite"><b></b><span></span></div>';
    document.body.appendChild(lb); document.body.style.overflow = "hidden";
    $(".lb-close", lb).addEventListener("click", closeLb);
    var p = $(".lb-prev", lb), n = $(".lb-next", lb);
    if (p) p.addEventListener("click", function () { show(lbIdx - 1); });
    if (n) n.addEventListener("click", function () { show(lbIdx + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb || e.target.classList.contains("lb-stage")) closeLb(); });
    var sx = null;
    lb.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) { if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 50) show(lbIdx + (dx < 0 ? 1 : -1)); sx = null; });
    document.addEventListener("keydown", onKey);
    show(idx); $(".lb-close", lb).focus();
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".g-open"); if (!b) return;
    var fig = b.closest(".g-item"); if (fig) openLb(fig);
  });

  /* home: which cover fits */
  var needs = $$(".need[data-title]");
  var ans = $("#answer");
  if (needs.length && ans) {
    var wa = "https://wa.me/919842586840?text=";
    var render = function (btn) {
      needs.forEach(function (n) { n.setAttribute("aria-pressed", n === btn ? "true" : "false"); });
      var t = btn.getAttribute("data-title"), tag = btn.getAttribute("data-tag"), body = btn.getAttribute("data-body"), href = btn.getAttribute("data-href"), ask = btn.getAttribute("data-ask");
      $("#ans-tag").textContent = tag; $("#ans-title").textContent = t; $("#ans-body").textContent = body;
      $("#ans-plans").setAttribute("href", href);
      $("#ans-wa").setAttribute("href", wa + encodeURIComponent(ask));
    };
    needs.forEach(function (n) { n.addEventListener("click", function () { render(n); }); });
    render(needs[0]);
  }

  /* contact: compose WhatsApp message from the enquiry form */
  var form = $("#enquiry");
  if (form) {
    var out = $("#send-wa");
    var build = function () {
      var name = $("#f-name").value.trim(), topic = $("#f-topic").value, msg = $("#f-msg").value.trim();
      var text = "Hello Mr. Selvakumar, " + (name ? "I am " + name + ". " : "") + "I would like to know about " + topic + "." + (msg ? " " + msg : "");
      out.setAttribute("href", "https://wa.me/919842586840?text=" + encodeURIComponent(text));
      var prev = $("#wa-preview"); if (prev) prev.textContent = text;
    };
    form.addEventListener("input", build); form.addEventListener("submit", function (e) { e.preventDefault(); }); build();
  }
})();
