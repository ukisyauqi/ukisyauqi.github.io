/* uki.dev — interactions (calm hero: Code Rain, right side) */
(function () {
  "use strict";

  /* ---------- clock (Asia/Jakarta) ---------- */
  function clocks() {
    try {
      const t = new Date().toLocaleTimeString("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
      });
      const t2 = new Date().toLocaleTimeString("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      const a = document.getElementById("clock");
      if (a) a.textContent = t;
      const b = document.getElementById("clock2");
      if (b) b.textContent = t2;
    } catch (e) {
      /* noop */
    }
  }
  clocks();
  setInterval(clocks, 10000);

  /* ---------- typer ---------- */
  const words = [
    "React apps people love.",
    "Next.js platforms that scale.",
    "mobile apps with RN.",
    "APIs with Node + Postgres.",
    "AI features users pay for.",
  ];
  const el = document.getElementById("typer");
  let wi = 0,
    ci = 0,
    del = false;
  (function type() {
    if (!el) return;
    const w = words[wi];
    el.textContent = w.slice(0, ci);
    ci += del ? -2 : 1;
    if (!del && ci > w.length + 8) del = true;
    else if (del && ci <= 0) {
      del = false;
      wi = (wi + 1) % words.length;
    }
    setTimeout(type, del ? 28 : 55);
  })();

  /* ---------- reveal + meters + counters ---------- */
  const io = new IntersectionObserver(
    (es) => {
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("in");
        e.target
          .querySelectorAll(".meter i")
          .forEach((m) => (m.style.width = m.style.getPropertyValue("--w")));
        if (e.target.classList.contains("stats")) {
          e.target.querySelectorAll("[data-count]").forEach((s) => {
            const end = +s.dataset.count;
            let cur = 0;
            const step = () => {
              cur += Math.max(1, Math.round(end / 30));
              if (cur >= end) cur = end;
              s.textContent = cur + "+";
              if (cur < end) requestAnimationFrame(step);
            };
            step();
          });
        }
        io.unobserve(e.target);
      });
    },
    { threshold: 0.15 },
  );
  document.querySelectorAll(".reveal, .stats").forEach((n) => io.observe(n));
  const mio = new IntersectionObserver(
    (es) =>
      es.forEach((e) => {
        if (e.isIntersecting) {
          e.target.style.width = e.target.style.getPropertyValue("--w");
          mio.unobserve(e.target);
        }
      }),
    { threshold: 0.4 },
  );
  document.querySelectorAll(".meter i").forEach((m) => mio.observe(m));

  /* ---------- scroll progress ---------- */
  const sf = document.getElementById("scrollFill");
  addEventListener(
    "scroll",
    () => {
      const h = document.documentElement;
      const pct = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
      sf.style.width = pct * 100 + "%";
    },
    { passive: true },
  );

  /* ---------- mobile menu ---------- */
  const mm = document.getElementById("mobileMenu");
  document.getElementById("menuBtn").onclick = () => mm.classList.add("open");
  document.getElementById("menuClose").onclick = () =>
    mm.classList.remove("open");
  mm.querySelectorAll("a").forEach(
    (a) => (a.onclick = () => mm.classList.remove("open")),
  );

  /* ---------- magnetic buttons: disabled — buttons stay still on hover ---------- */

  /* ---------- tilt cards ---------- */
  document.querySelectorAll("[data-tilt]").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = `perspective(900px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg) translateY(-3px)`;
    });
    card.addEventListener("mouseleave", () => (card.style.transform = ""));
  });

  /* ---------- hero: "Code Rain" — subtle code drizzle, locked to the right ----------
     Canvas 2D (no Three.js). Slow-falling code glyphs + a few drifting
     token chips (useState, <div/>, =>, SELECT…). Bright head + fading trail,
     lime/violet accents, brightens near the cursor. */
  try {
    const canvas = document.getElementById("gl");
    if (!canvas) throw new Error("no canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no 2d");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    const GLYPHS = "<>{}[]()/=+*;:.$_#&|!?".split("");
    const TOKENS = [
      "useState",
      "useEffect",
      "<div/>",
      "<App/>",
      "=>",
      "async",
      "await",
      "const",
      "props",
      "return",
      "import",
      "SELECT",
      "WHERE",
      "{...}",
      "&&",
      "!==",
      "JSON",
      "200 OK",
    ];
    const LIME = "#1df36b";
    const VIOLET = "#a78bff";

    let W = 0,
      H = 0,
      DPR = 1;
    let cols = [];
    let chips = [];
    let mx = -9999,
      my = -9999,
      smx = 0; // smoothed parallax
    let running = true;

    function pick(arr) {
      return arr[(Math.random() * arr.length) | 0];
    }

    function build() {
      const parent = canvas.parentElement;
      const w = parent.clientWidth,
        h = parent.clientHeight;
      DPR = Math.min(window.devicePixelRatio || 1, 1.75);
      W = w;
      H = h;
      canvas.width = Math.round(w * DPR);
      canvas.height = Math.round(h * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      const mobile = w < 760;
      // rain zone: right side on desktop, full-but-faint on mobile
      const x0 = mobile ? w * 0.04 : w * 0.56;
      const x1 = mobile ? w * 0.96 : w * 0.985;
      const gap = mobile ? 26 : 24;
      const zoneAlpha = mobile ? 0.5 : 1;
      const dropsPerSlot = mobile ? 2 : 2; // 1 kolom = 2 hujan

      cols = [];
      for (let x = x0; x <= x1; x += gap) {
        for (let k = 0; k < dropsPerSlot; k++) {
          const len = 7 + ((Math.random() * 8) | 0);
          const chars = [];
          for (let i = 0; i < len; i++) chars.push(pick(GLYPHS));
          const accentRoll = Math.random();
          cols.push({
            x: x + Math.random() * 10 - 2,
            y: Math.random() * (h + 320) - 160,
            speed: 26 + Math.random() * 38, // px/s — pelan tapi rame
            len,
            chars,
            mutate: Math.random() * 0.1,
            accent:
              accentRoll < 0.16 ? LIME : accentRoll < 0.32 ? VIOLET : null,
            zoneAlpha,
            phase: Math.random() * Math.PI * 2,
          });
        }
      }

      chips = [];
      const nChips = mobile ? 6 : 12;
      for (let i = 0; i < nChips; i++) {
        chips.push({
          text: pick(TOKENS),
          x: x0 + Math.random() * Math.max(60, x1 - x0 - 60),
          y: Math.random() * h,
          vy: 8 + Math.random() * 10, // drift up slowly
          alpha: 0.14 + Math.random() * 0.16,
          lime: Math.random() < 0.3,
          size: 11 + Math.random() * 2,
        });
      }
    }

    canvas.parentElement.addEventListener("mousemove", (e) => {
      const r = canvas.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
    });
    canvas.parentElement.addEventListener("mouseleave", () => {
      mx = -9999;
      my = -9999;
    });

    // pause when hero is off-screen (saves battery)
    new IntersectionObserver(([e]) => {
      running = e.isIntersecting;
    }).observe(canvas);

    addEventListener("resize", build);
    build();

    const FONT = "'JetBrains Mono', ui-monospace, monospace";

    function drawColumn(c, t, dt) {
      c.y += c.speed * dt * (c.hot > 0.5 ? 1.6 : 1);
      if (c.y - c.len * 17 > H + 20) {
        c.y = -20 - Math.random() * 160;
        c.accent =
          Math.random() < 0.16 ? LIME : Math.random() < 0.3 ? VIOLET : null;
      }
      // randomly mutate a trail char (matrix shimmer)
      c.mutate += dt;
      if (c.mutate > 0.1) {
        c.mutate = 0;
        c.chars[(Math.random() * c.chars.length) | 0] = pick(GLYPHS);
      }

      // heat near cursor
      const dx = Math.abs(c.x + smx - mx);
      const dy = Math.abs(c.y - my);
      const near = dx < 110 && dy < 160 ? 1 - Math.max(dx / 110, dy / 160) : 0;
      c.hot = (c.hot || 0) + (near - (c.hot || 0)) * Math.min(1, dt * 6);

      const lineH = 17;
      const sway = Math.sin(t * 0.6 + c.phase) * 3;
      ctx.textAlign = "center";
      for (let i = 0; i < c.len; i++) {
        const yy = c.y - i * lineH;
        if (yy < -20 || yy > H + 20) continue;
        const u = i / c.len; // 0 = head
        let a = (1 - u) * (1 - u) * 0.62 * c.zoneAlpha;
        a *= 1 + c.hot * 1.6;
        if (a < 0.015) continue;
        if (i === 0) {
          ctx.font = "600 14px " + FONT;
          ctx.shadowBlur = 10;
          ctx.shadowColor = c.accent || "rgba(255,255,255,.7)";
          ctx.fillStyle =
            c.accent ||
            "rgba(255,255,255," +
              Math.min(1, 0.85 + c.hot * 0.15).toFixed(2) +
              ")";
          ctx.globalAlpha = Math.min(1, (0.85 + c.hot * 0.15) * c.zoneAlpha);
        } else {
          ctx.font = "400 13px " + FONT;
          ctx.shadowBlur = 0;
          ctx.shadowColor = "transparent";
          ctx.fillStyle =
            c.accent && i < 3
              ? c.accent
              : "rgba(178,178,190," + a.toFixed(3) + ")";
          ctx.globalAlpha = 1;
        }
        ctx.fillText(c.chars[i], c.x + smx + sway * u, yy);
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }

    function drawChip(ch, dt) {
      ch.y -= ch.vy * dt;
      if (ch.y < -20) {
        ch.y = H + 20;
        ch.text = pick(TOKENS);
        ch.x = (W < 760 ? W * 0.04 : W * 0.56) + Math.random() * W * 0.38;
      }
      ctx.font = "500 " + ch.size + "px " + FONT;
      ctx.textAlign = "left";
      const near =
        Math.abs(ch.x + smx - mx) < 120 && Math.abs(ch.y - my) < 60 ? 1 : 0;
      ctx.fillStyle = ch.lime
        ? "rgba(29,243,107," + (ch.alpha + near * 0.35).toFixed(3) + ")"
        : "rgba(200,200,212," + (ch.alpha + near * 0.4).toFixed(3) + ")";
      ctx.fillText(ch.text, ch.x + smx, ch.y);
    }

    function fadeEdges() {
      // soften top & bottom so rain melts into the hero
      let g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "rgba(10,10,12,1)");
      g.addColorStop(0.14, "rgba(10,10,12,0)");
      g.addColorStop(0.86, "rgba(10,10,12,0)");
      g.addColorStop(1, "rgba(10,10,12,1)");
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "source-over";
    }

    function frame(t, dt) {
      ctx.clearRect(0, 0, W, H);
      smx +=
        ((mx === -9999 ? 0 : (mx / Math.max(1, W) - 0.5) * -14) - smx) *
        Math.min(1, dt * 3);
      for (const ch of chips) drawChip(ch, dt);
      for (const c of cols) drawColumn(c, t, dt);
      fadeEdges();
    }

    if (reduced) {
      frame(0.7, 0.016);
    } else {
      let prev = performance.now() / 1000;
      const t0 = prev;
      (function loop() {
        requestAnimationFrame(loop);
        const now = performance.now() / 1000;
        const dt = Math.min(0.05, now - prev);
        prev = now;
        if (!running || document.hidden) return;
        frame(now - t0, dt);
      })();
    }
  } catch (err) {
    const c = document.getElementById("gl");
    if (c) c.style.display = "none";
  }
})();
