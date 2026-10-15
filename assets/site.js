/* Infrastructure Factory: old-anchor redirects, theme, menu, citation copy, tooltips, Little's law calculator, and the two-lane queue model. */
(function () {
  "use strict";
  var root = document.documentElement;

  /* ---------- old single-page anchors -> new pages (home only) ---------- */
  var REDIRECTS = {
    what: "/infrastructure-factory/#definition", "what-it-is": "/infrastructure-factory/#definition",
    numbers: "/evidence/#evidence", evidence: "/evidence/#evidence",
    symmetry: "/software-factory/#symmetry",
    challenge: "/evidence/#why-now", "why-now": "/evidence/#why-now",
    lineage: "/lineage/",
    line: "/infrastructure-factory/#the-line", "the-line": "/infrastructure-factory/#the-line",
    terrain: "/evidence/#terrain",
    metrics: "/metrics/",
    factors: "/infrastructure-factory/#factors",
    "prior-art": "/lineage/#prior-art",
    sources: "/sources/"
  };
  var path = location.pathname;
  if ((path === "/" || path === "/index.html") && location.hash.length > 1) {
    var key = location.hash.slice(1);
    if (Object.prototype.hasOwnProperty.call(REDIRECTS, key)) { location.replace(REDIRECTS[key]); return; }
  }

  /* ---------- theme (the stored choice is applied in <head> before the stylesheet loads) ---------- */
  var THEME_KEY = "infra-factory-theme";
  var themeBtn = document.getElementById("theme-btn");
  function readTheme() { try { return localStorage.getItem(THEME_KEY) || "auto"; } catch (e) { return "auto"; } }
  function applyTheme(t) {
    if (t === "light" || t === "dark") root.setAttribute("data-theme", t); else root.removeAttribute("data-theme");
    if (themeBtn) { themeBtn.textContent = "Theme: " + t; themeBtn.setAttribute("aria-label", "Color theme: " + t + ". Activate to switch."); }
  }
  applyTheme(readTheme());
  if (themeBtn) themeBtn.addEventListener("click", function () {
    var order = ["auto", "light", "dark"];
    var next = order[(order.indexOf(readTheme()) + 1) % order.length];
    try { if (next === "auto") localStorage.removeItem(THEME_KEY); else localStorage.setItem(THEME_KEY, next); } catch (e) { /* storage unavailable */ }
    applyTheme(next);
  });

  /* ---------- menu: close after choosing a page ---------- */
  var navToggle = document.getElementById("nav-toggle");
  if (navToggle) Array.prototype.forEach.call(document.querySelectorAll(".nav-links a"), function (a) {
    a.addEventListener("click", function () { navToggle.checked = false; });
  });

  /* ---------- tooltips ---------- */
  var tip = document.getElementById("tip");
  function placeTip(x, y) {
    var w = tip.offsetWidth, h = tip.offsetHeight;
    var left = x + 14, top = y + 14;
    if (left + w > window.innerWidth - 12) left = x - w - 14;
    if (top + h > window.innerHeight - 12) top = y - h - 14;
    if (left < 8) left = 8;
    if (top < 8) top = 8;
    tip.style.left = left + "px";
    tip.style.top = top + "px";
  }
  function showTip(el, x, y) {
    if (!tip) return;
    var parts = (el.getAttribute("data-tip") || "").split("|");
    while (tip.firstChild) tip.removeChild(tip.firstChild);
    var strong = document.createElement("strong");
    strong.textContent = parts[0];
    tip.appendChild(strong);
    if (parts[1]) tip.appendChild(document.createTextNode(parts[1]));
    tip.setAttribute("data-show", "true");
    tip.setAttribute("aria-hidden", "false");
    placeTip(x, y);
  }
  function hideTip() { if (!tip) return; tip.setAttribute("data-show", "false"); tip.setAttribute("aria-hidden", "true"); }
  Array.prototype.forEach.call(document.querySelectorAll("[data-tip]"), function (el) {
    el.addEventListener("pointerenter", function (e) { showTip(el, e.clientX, e.clientY); });
    el.addEventListener("pointermove", function (e) { placeTip(e.clientX, e.clientY); });
    el.addEventListener("pointerleave", hideTip);
    el.addEventListener("focus", function () { var r = el.getBoundingClientRect(); showTip(el, r.left + r.width / 2, r.top + r.height / 2); });
    el.addEventListener("blur", hideTip);
  });
  window.addEventListener("scroll", hideTip, { passive: true });

  /* ---------- Little's law calculator ---------- */
  var inRate = document.getElementById("in-rate"), inLead = document.getElementById("in-lead"), inFast = document.getElementById("in-fast");
  if (inRate && inLead && inFast) {
    var outRate = document.getElementById("out-rate"), outLead = document.getElementById("out-lead"), outFast = document.getElementById("out-fast");
    var outWip = document.getElementById("out-wip"), outT = document.getElementById("out-wip-ticket"), outF = document.getElementById("out-wip-factory"), outText = document.getElementById("out-text");
    var fmtHours = function (h) {
      if (h < 24) return h + (h === 1 ? " hour" : " hours");
      var d = h / 24;
      return (Math.round(d * 10) / 10) + (d === 1 ? " day" : " days");
    };
    var fmtMinutes = function (m) {
      if (m < 60) return m + " min";
      var h = m / 60;
      return (Math.round(h * 10) / 10) + (h === 1 ? " hour" : " hours");
    };
    var fmtN = function (n) {
      if (n >= 100) return Math.round(n).toLocaleString("en-US");
      if (n >= 10) return (Math.round(n * 10) / 10).toString();
      return (Math.round(n * 100) / 100).toString();
    };
    var recalc = function () {
      var rate = +inRate.value, leadH = +inLead.value, fastM = +inFast.value;
      var wipTicket = rate * (leadH / 24);
      var wipFactory = rate * (fastM / 1440);
      outRate.textContent = rate;
      outLead.textContent = fmtHours(leadH);
      outFast.textContent = fmtMinutes(fastM);
      outWip.textContent = fmtN(wipTicket);
      outT.textContent = fmtN(wipTicket);
      outF.textContent = fmtN(wipFactory);
      var tail = wipFactory < 1 ? "fewer than one is." : fmtN(wipFactory) + " are.";
      outText.textContent = "At " + rate + " requests a day and a lead time of " + fmtHours(leadH) + ", " + fmtN(wipTicket) +
        " environment requests are open at any moment. Through a factory with a lead time of " + fmtMinutes(fastM) + ", " + tail;
    };
    [inRate, inLead, inFast].forEach(function (el) { el.addEventListener("input", recalc); });
    recalc();
  }

  /* ---------- two-lane queue model: full (canvas) on the evidence page, counters only on home ---------- */
  var canvas = document.getElementById("demo-canvas");
  var cPrs = document.getElementById("c-prs"), cWait = document.getElementById("c-wait"), cEnv = document.getElementById("c-env");
  if (!cPrs && !canvas) return;
  var ctx = canvas && canvas.getContext ? canvas.getContext("2d") : null;
  var headless = !ctx;
  var watchEl = canvas || (cPrs && cPrs.closest(".demo-counters")) || cPrs;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  var btnTicket = document.getElementById("mode-ticket"), btnFactory = document.getElementById("mode-factory");

  var SPAWN = 0.9;        // seconds between changes entering both lanes
  var SPEED = 80;         // px per second
  var GATE_TICKET = 4.5;  // seconds between ticket approvals
  var GATE_FACTORY = 0.2; // seconds per automated policy check
  var UNIT = 10, GAP = 14;

  var mode = "ticket";
  var state = { prs: 0, env: 0, top: [], bottom: [], spawnT: 0, gateT: 0, flash: 0 };
  var geo = { W: 1000, H: 250, startX: 24, endX: 976, gateX: 600, topY: 82, botY: 180 };
  var colors = {};
  var colorTick = 0;
  var running = false, visible = true, raf = 0, lastT = 0, timer = 0;

  function readColors() {
    var cs = getComputedStyle(root);
    function v(n) { return cs.getPropertyValue(n).trim(); }
    colors = { blue: v("--blue"), accent: v("--accent"), fg: v("--fg"), muted: v("--muted"), faint: v("--faint"), line: v("--line-strong"), surface: v("--surface"), soft: v("--accent-soft") };
  }

  function layout() {
    if (headless) {
      geo.W = 600; geo.H = 250;   // a shorter lane: the counters on the home page move within seconds
    } else {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      geo.W = canvas.clientWidth || 600;
      geo.H = geo.W < 520 ? 230 : 250;
      canvas.style.height = geo.H + "px";
      canvas.width = Math.round(geo.W * dpr);
      canvas.height = Math.round(geo.H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    geo.startX = 24;
    geo.endX = geo.W - 24;
    geo.gateX = Math.round(geo.W * 0.6);
    geo.topY = Math.round(geo.H * 0.33);
    geo.botY = Math.round(geo.H * 0.72);
    state.top = state.top.filter(function (u) { return u.x < geo.endX; });
    state.bottom = state.bottom.filter(function (u) { return u.x < geo.endX; });
  }

  function queueCapacity() { return Math.floor((geo.gateX - geo.startX - 24) / GAP); }

  function step(dt) {
    state.spawnT += dt;
    state.gateT += dt;
    state.flash = Math.max(0, state.flash - dt);
    while (state.spawnT >= SPAWN) {
      state.spawnT -= SPAWN;
      state.top.push({ x: geo.startX });
      var waiting = state.bottom.filter(function (u) { return !u.passed; }).length;
      if (waiting < queueCapacity()) state.bottom.push({ x: geo.startX, passed: false });
    }
    for (var i = state.top.length - 1; i >= 0; i--) {
      state.top[i].x += SPEED * dt;
      if (state.top[i].x > geo.endX) { state.top.splice(i, 1); state.prs++; }
    }
    var period = mode === "ticket" ? GATE_TICKET : GATE_FACTORY;
    var front = null;
    for (var k = 0; k < state.bottom.length; k++) {
      var u = state.bottom[k];
      if (!u.passed && (front === null || u.x > front.x)) front = u;
    }
    if (state.gateT >= period) {
      if (front && front.x >= geo.gateX - UNIT - 2) { front.passed = true; state.gateT = 0; state.flash = 0.25; }
      else if (mode === "factory") state.gateT = period;
      else state.gateT = 0;
    }
    state.bottom.sort(function (a, b) { return b.x - a.x; });
    var ahead = null;
    for (var j = 0; j < state.bottom.length; j++) {
      var b = state.bottom[j];
      var limit = Infinity;
      if (ahead && !ahead.passed) limit = ahead.x - GAP;
      if (!b.passed) limit = Math.min(limit, geo.gateX - UNIT - 2);
      b.x = Math.min(b.x + SPEED * dt, limit);
      ahead = b;
    }
    for (var m = state.bottom.length - 1; m >= 0; m--) {
      if (state.bottom[m].x > geo.endX) { state.bottom.splice(m, 1); state.env++; }
    }
  }

  function waitingCount() { return state.bottom.filter(function (u) { return !u.passed; }).length; }

  function updateCounters() {
    if (cPrs) cPrs.textContent = state.prs;
    if (cWait) cWait.textContent = waitingCount();
    if (cEnv) cEnv.textContent = state.env;
  }

  function text(s, x, y, opts) {
    opts = opts || {};
    ctx.font = (opts.weight || 500) + " " + (opts.size || 10) + "px 'IBM Plex Mono', ui-monospace, Menlo, monospace";
    ctx.fillStyle = opts.color || colors.muted;
    ctx.textAlign = opts.align || "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(s, x, y);
  }

  function draw() {
    if (headless) { updateCounters(); return; }
    var W = geo.W, H = geo.H;
    ctx.clearRect(0, 0, W, H);
    var narrow = W < 520;
    ctx.strokeStyle = colors.line; ctx.lineWidth = 1;
    [geo.topY, geo.botY].forEach(function (y) {
      ctx.beginPath(); ctx.moveTo(geo.startX, y + 0.5); ctx.lineTo(geo.endX, y + 0.5); ctx.stroke();
    });
    text("SOFTWARE FACTORY", geo.startX, geo.topY - 22, { color: colors.fg, weight: 600, size: narrow ? 9.5 : 10.5 });
    text("ENVIRONMENT REQUESTS", geo.startX, geo.botY - 22, { color: colors.fg, weight: 600, size: narrow ? 9.5 : 10.5 });
    var stations = ["plan", "write", "test", "review", "merge"];
    var span = geo.endX - geo.startX - 60;
    stations.forEach(function (s, i) {
      var x = Math.round(geo.startX + 30 + span * (i / (stations.length - 1))) + 0.5;
      ctx.strokeStyle = colors.line;
      ctx.beginPath(); ctx.moveTo(x, geo.topY - 6); ctx.lineTo(x, geo.topY + 6); ctx.stroke();
      if (!narrow) text(s, x, geo.topY + 20, { align: "center", color: colors.faint, size: 9.5 });
    });
    text(narrow ? "shipped" : "→ shipped", geo.endX, geo.topY - 8, { align: "right", color: colors.faint, size: 9.5 });
    text(narrow ? "delivered" : "→ delivered", geo.endX, geo.botY - 8, { align: "right", color: colors.faint, size: 9.5 });
    var gx = geo.gateX;
    if (mode === "ticket") {
      ctx.fillStyle = colors.fg;
      ctx.fillRect(gx - 3, geo.botY - 18, 6, 36);
      text("TICKET", gx + 10, geo.botY - 10, { color: colors.fg, weight: 600 });
      text(narrow ? "human approval" : "cost center · compliance owner · on-call", gx + 10, geo.botY + 26, { color: colors.muted, size: 9.5 });
      text("opens every " + GATE_TICKET + " s", gx + 10, geo.botY + 4, { color: colors.faint, size: 9.5 });
    } else {
      ctx.strokeStyle = colors.accent; ctx.lineWidth = 2;
      ctx.strokeRect(gx - 3, geo.botY - 18, 6, 36);
      if (state.flash > 0) { ctx.fillStyle = colors.accent; ctx.globalAlpha = Math.min(1, state.flash * 4); ctx.fillRect(gx - 3, geo.botY - 18, 6, 36); ctx.globalAlpha = 1; }
      text("POLICY CHECK", gx + 10, geo.botY - 10, { color: colors.fg, weight: 600 });
      text("answers in " + Math.round(GATE_FACTORY * 1000) + " ms", gx + 10, geo.botY + 4, { color: colors.faint, size: 9.5 });
      text(narrow ? "owner attached by default" : "owner · classification · budget attached by default", gx + 10, geo.botY + 26, { color: colors.muted, size: 9.5 });
    }
    ctx.fillStyle = colors.blue;
    state.top.forEach(function (u) { ctx.fillRect(Math.round(u.x), geo.topY - UNIT / 2, UNIT, UNIT); });
    ctx.fillStyle = colors.accent;
    state.bottom.forEach(function (u) { ctx.fillRect(Math.round(u.x), geo.botY - UNIT / 2, UNIT, UNIT); });
    var waiting = waitingCount();
    if (waiting > 0) {
      var full = waiting >= queueCapacity();
      text(waiting + " waiting" + (full ? (narrow ? " · lane full" : " · lane full, new requests dropped") : ""), gx - 10, geo.botY + 26, { align: "right", color: colors.fg, weight: 600 });
    }
    updateCounters();
  }

  function frame(t) {
    if (!running) return;
    if (!lastT) lastT = t;
    var dt = Math.min(0.05, (t - lastT) / 1000);
    lastT = t;
    if ((colorTick++ % 60) === 0) readColors();
    step(dt);
    draw();
    raf = window.requestAnimationFrame(frame);
  }
  function start() {
    if (running || reduceMotion.matches) return;
    running = true; lastT = 0;
    if (headless) timer = window.setInterval(function () { step(0.12); updateCounters(); }, 120);
    else raf = window.requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    if (raf) window.cancelAnimationFrame(raf);
    if (timer) window.clearInterval(timer);
    raf = 0; timer = 0;
  }
  function simulateOffline(seconds) { var n = Math.round(seconds * 30); for (var i = 0; i < n; i++) step(1 / 30); }
  function staticFrame() { readColors(); simulateOffline(mode === "ticket" ? 70 : 40); draw(); }

  function setMode(m) {
    mode = m;
    state.gateT = 0;
    if (btnTicket) btnTicket.setAttribute("aria-pressed", m === "ticket" ? "true" : "false");
    if (btnFactory) btnFactory.setAttribute("aria-pressed", m === "factory" ? "true" : "false");
    if (reduceMotion.matches) staticFrame();
  }
  if (btnTicket) btnTicket.addEventListener("click", function () { setMode("ticket"); });
  if (btnFactory) btnFactory.addEventListener("click", function () { setMode("factory"); });

  readColors();
  layout();
  if (reduceMotion.matches) {
    staticFrame();
  } else {
    simulateOffline(headless ? 60 : 12);
    draw();
    if ("IntersectionObserver" in window && watchEl) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible && !document.hidden) start(); else stop();
      }, { threshold: 0.05 }).observe(watchEl);
    } else { start(); }
    document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else if (visible) start(); });
  }
  if (reduceMotion.addEventListener) reduceMotion.addEventListener("change", function () { if (reduceMotion.matches) { stop(); staticFrame(); } else start(); });
  if (!headless) {
    if ("ResizeObserver" in window) new ResizeObserver(function () { layout(); draw(); }).observe(canvas.parentNode);
    else window.addEventListener("resize", function () { layout(); draw(); });
    new MutationObserver(function () { readColors(); draw(); }).observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    var scheme = window.matchMedia("(prefers-color-scheme: dark)");
    if (scheme.addEventListener) scheme.addEventListener("change", function () { setTimeout(function () { readColors(); draw(); }, 50); });
  }
})();
