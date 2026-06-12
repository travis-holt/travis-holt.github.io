/* ============================================================
   hero-anim.js — vanilla port of the "AI UGC Hero" CombinedStory.
   One looping sequence, three acts:
     A · Performance dashboard (ROAS rises, curve draws, chips light up)
     B · Hook test → one creative crowned the winner (+318% vs control)
     D · Optimization → field narrows to one scaling winner (71% hook rate)
   Ported from a React/Babel design prototype to framework-free JS so it
   fits this site. Accent is read from CSS vars (--a1/--a2) → matches the
   site palette. Mounts into #heroAnim.
   ============================================================ */
(function () {
  'use strict';
  const mount = document.getElementById('heroAnim');
  if (!mount) return;

  /* ---------- math ---------- */
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, x) => a + (b - a) * x;
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const easeOut = (x) => 1 - Math.pow(1 - x, 3);
  const easeOutQuint = (x) => 1 - Math.pow(1 - x, 5);
  const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
  const back = (x) => { const c = 1.70158, c3 = c + 1; return 1 + c3 * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  const grad = (a1, a2) => `linear-gradient(110deg, ${a1}, ${a2})`;

  /* accent from the site's CSS vars (hex, so 8-digit alpha suffixes work) */
  const css = getComputedStyle(document.documentElement);
  const a1 = (css.getPropertyValue('--a1').trim() || '#c2632f');
  const a2 = (css.getPropertyValue('--a2').trim() || '#e89a3c');

  /* ---------- shared bits ---------- */
  const arrow = (up = true, small = false) => {
    const sz = small ? 13 : 15;
    return `<svg width="${sz}" height="${sz}" viewBox="0 0 14 14" fill="none" style="flex:0 0 auto;transform:${up ? 'none' : 'scaleY(-1)'}"><path d="M7 11V3M7 3L3.5 6.5M7 3l3.5 3.5" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  };

  const creativeFrame = (hue, dim = 0, radius = 14, big = false) => `
    <div style="position:absolute;inset:0;border-radius:${radius}px;overflow:hidden;background:linear-gradient(155deg, hsl(${hue} 78% 62%), hsl(${hue + 14} 72% 42%));${dim ? `filter:saturate(${1 - dim * 0.8}) brightness(${1 + dim * 0.18}) opacity(${1 - dim * 0.35});` : ''}transition:filter .5s;">
      <div style="position:absolute;left:50%;top:34%;width:70%;height:70%;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle, hsla(${hue} 95% 78% / .6), transparent 68%);"></div>
      <div style="position:absolute;left:50%;top:${big ? '34%' : '40%'};transform:translate(-50%,-50%);width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.28);border:1.5px solid rgba(255,255,255,.85);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(2px);">
        <div style="width:0;height:0;border-left:9px solid #fff;border-top:6px solid transparent;border-bottom:6px solid transparent;margin-left:3px;"></div>
      </div>
      ${!big ? `<div style="position:absolute;left:12px;right:12px;bottom:14px;display:flex;flex-direction:column;gap:6px;">
        <div style="height:6px;width:88%;border-radius:4px;background:rgba(255,255,255,.8);"></div>
        <div style="height:6px;width:64%;border-radius:4px;background:rgba(255,255,255,.5);"></div></div>` : ''}
      ${big ? `<div style="position:absolute;inset:0;background:linear-gradient(to top, rgba(40,22,10,.6) 0%, rgba(40,22,10,.12) 36%, transparent 60%);"></div>` : ''}
      <div style="position:absolute;top:9px;left:9px;font-size:9px;font-weight:700;color:rgba(255,255,255,.95);background:rgba(0,0,0,.28);padding:2px 6px;border-radius:5px;">0:1${hue % 7}</div>
    </div>`;

  /* ---------- SCENE A — dashboard (static path precomputed) ---------- */
  const N = 30, W = 480, H = 150;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const f = i / N, x = W * f, wob = Math.sin(f * 9) * 2.0 * f;
    pts.push([x, H - 8 - (Math.pow(f, 1.75) * (H - 26)) + wob]);
  }
  const linePath = 'M' + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L');
  const fillPath = linePath + ` L${W} ${H} L0 ${H} Z`;
  const gridLines = [0.33, 0.66, 1].map((g) => `<line x1="0" x2="${W}" y1="${H - g * (H - 16)}" y2="${H - g * (H - 16)}" stroke="var(--line)" stroke-width="1" stroke-dasharray="2 5"/>`).join('');

  function sceneDashboard(t) {
    const draw = easeOutQuint(seg(t, 0.1, 0.66));
    const li = clamp(draw * N, 0, N), i0 = Math.floor(li), i1 = Math.min(N, i0 + 1), fr = li - i0;
    const leadX = lerp(pts[i0][0], pts[i1][0], fr), leadY = lerp(pts[i0][1], pts[i1][1], fr);
    const roas = lerp(1.6, 4.3, easeOut(seg(t, 0.12, 0.68)));
    const delta = Math.round(lerp(0, 182, easeOut(seg(t, 0.2, 0.72))));
    const winGlow = seg(t, 0.7, 0.85);
    const on = winGlow > 0.1;
    const chips = [
      { k: 'Hook rate', from: 18, to: 47, suf: '%', up: true },
      { k: 'Conv. rate', from: 1.1, to: 3.9, suf: '%', dec: 1, up: true },
      { k: 'CPA', from: 46, to: 18, pre: '$', up: false },
    ];
    const chipsHTML = chips.map((c, i) => {
      const v = lerp(c.from, c.to, easeOut(seg(t, 0.5 + i * 0.06, 0.78)));
      const ty = (1 - easeOut(seg(t, 0.46 + i * 0.06, 0.62))) * 14;
      const op = seg(t, 0.46 + i * 0.06, 0.6);
      const val = (c.pre || '') + (c.dec ? v.toFixed(1) : Math.round(v)) + (c.suf || '');
      return `<div class="s-card" style="padding:14px 14px 13px;background:var(--surface-2);transform:translateY(${ty}px);opacity:${op};">
        <div style="font-size:12px;color:var(--ink-faint);font-weight:600;">${c.k}</div>
        <div style="display:flex;align-items:baseline;gap:6px;margin-top:7px;">
          <span style="font-size:26px;font-weight:700;letter-spacing:-0.02em;">${val}</span>
          <span style="color:${a1};display:inline-flex;">${arrow(c.up, true)}</span>
        </div></div>`;
    }).join('');
    const leadCircle = draw > 0.01 ? `<circle cx="${draw >= 0.999 ? pts[N][0] : leadX}" cy="${draw >= 0.999 ? pts[N][1] : leadY}" r="5.5" fill="${draw >= 0.999 ? a2 : '#fff'}" stroke="${a1}" stroke-width="${draw >= 0.999 ? 0 : 2}" style="filter:drop-shadow(0 0 7px ${a1}aa)"/>` : '';
    return `<div class="s-scene"><div style="position:absolute;inset:34px;display:flex;flex-direction:column;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span class="s-eyebrow">Account performance</span>
        <span class="s-pill" style="background:${on ? 'var(--accent-soft)' : 'var(--surface-2)'};color:${on ? a1 : 'var(--ink-soft)'};border:1px solid ${on ? 'var(--accent-line)' : 'var(--line)'};box-shadow:0 0 ${18 * winGlow}px ${a1}44;transition:all .35s;">
          <span style="width:7px;height:7px;border-radius:9px;background:currentColor;"></span>Beating control</span>
      </div>
      <div style="margin-top:26px;display:flex;align-items:flex-end;gap:16px;">
        <div>
          <div style="font-size:14px;color:var(--ink-soft);font-weight:600;margin-bottom:4px;">Blended ROAS</div>
          <div style="font-size:78px;font-weight:700;line-height:0.9;letter-spacing:-0.03em;background:${grad(a1, a2)};-webkit-background-clip:text;background-clip:text;color:transparent;">${roas.toFixed(1)}×</div>
        </div>
        <span class="s-pill" style="margin-bottom:8px;background:var(--accent-soft);color:${a1};border:1px solid var(--accent-line);opacity:${seg(t, 0.22, 0.4)};">${arrow(true)}${delta}%</span>
      </div>
      <div style="position:relative;margin-top:22px;">
        <svg viewBox="0 0 ${W} ${H}" width="100%" height="150" style="display:block;overflow:visible;">
          <defs>
            <linearGradient id="sArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a1}" stop-opacity="0.22"/><stop offset="1" stop-color="${a1}" stop-opacity="0"/></linearGradient>
            <linearGradient id="sLine" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="${a1}"/><stop offset="1" stop-color="${a2}"/></linearGradient>
            <clipPath id="sClip"><rect x="0" y="-10" width="${leadX}" height="${H + 12}"/></clipPath>
          </defs>
          ${gridLines}
          <g clip-path="url(#sClip)"><path d="${fillPath}" fill="url(#sArea)"/><path d="${linePath}" fill="none" stroke="url(#sLine)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></g>
          ${leadCircle}
        </svg>
      </div>
      <div style="margin-top:auto;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;">${chipsHTML}</div>
    </div></div>`;
  }

  /* ---------- SCENE B — creative becomes the winner ---------- */
  function sceneWinner(t) {
    const winner = 1;
    const cards = [{ hue: 28, roas: 2.1 }, { hue: 12, roas: 4.6 }, { hue: 40, roas: 1.8 }, { hue: 348, roas: 2.7 }];
    const decide = seg(t, 0.5, 0.74);
    const vsCtrl = Math.round(lerp(0, 318, easeOut(seg(t, 0.62, 0.88))));
    const CW = 116, CH = 206, gap = 18;
    const cardsHTML = cards.map((c, i) => {
      const intro = easeOut(seg(t, 0.04 + i * 0.07, 0.34 + i * 0.07));
      const isWin = i === winner;
      const dim = isWin ? 0 : decide * 0.9;
      const scale = isWin ? 1 + decide * 0.16 : 1 - decide * 0.06;
      const lift = isWin ? -decide * 8 : 0;
      const roasV = lerp(0, c.roas, easeOut(seg(t, 0.28, 0.5)));
      const op = intro * (isWin ? 1 : 1 - decide * 0.5);
      const ring = (isWin && decide > 0.02) ? `<div style="position:absolute;inset:-3px;border-radius:19px;pointer-events:none;border:2.5px solid transparent;background-origin:border-box;background:${grad(a1, a2)} border-box;-webkit-mask:linear-gradient(#000 0 0) padding-box, linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;opacity:${decide};box-shadow:0 0 ${28 * decide}px ${a1}55;"></div>
        <div style="position:absolute;top:-13px;left:50%;transform:translate(-50%,${(1 - back(decide)) * -20}px);opacity:${decide};background:${grad(a1, a2)};color:#fff;font-weight:800;font-size:10.5px;letter-spacing:.1em;padding:4px 11px;border-radius:999px;white-space:nowrap;box-shadow:0 6px 16px ${a1}55;">WINNER</div>` : '';
      const roasStyle = (isWin && decide > 0.3) ? `background:${grad(a1, a2)};-webkit-background-clip:text;background-clip:text;color:transparent;` : `color:var(--ink);`;
      return `<div style="width:${CW}px;transform:translateY(${(1 - intro) * 30 + lift}px) scale(${scale});opacity:${op};z-index:${isWin ? 3 : 1};">
        <div style="position:relative;width:${CW}px;height:${CH}px;">${creativeFrame(c.hue, dim, 16)}${ring}</div>
        <div style="text-align:center;margin-top:12px;opacity:${seg(t, 0.26, 0.42)};">
          <div style="font-size:${isWin ? 19 : 15}px;font-weight:700;letter-spacing:-0.02em;${roasStyle}">${roasV.toFixed(1)}×</div>
          <div style="font-size:10.5px;color:var(--ink-faint);font-weight:600;margin-top:2px;">ROAS</div>
        </div></div>`;
    }).join('');
    const won = decide > 0.5;
    return `<div class="s-scene"><div style="position:absolute;inset:34px;display:flex;flex-direction:column;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span class="s-eyebrow">Hook test · 4 variations</span>
        <span class="s-pill" style="background:${won ? 'var(--accent-soft)' : 'var(--surface-2)'};color:${won ? a1 : 'var(--ink-soft)'};border:1px solid ${won ? 'var(--accent-line)' : 'var(--line)'};transition:all .4s;">${won ? 'Winner found' : 'Testing…'}</span>
      </div>
      <div style="flex:1;display:flex;align-items:center;justify-content:center;gap:${gap}px;margin-top:6px;">${cardsHTML}</div>
      <div style="text-align:center;opacity:${seg(t, 0.6, 0.74)};transform:translateY(${(1 - easeOut(seg(t, 0.6, 0.78))) * 14}px);">
        <span style="font-size:22px;font-weight:700;letter-spacing:-0.02em;background:${grad(a1, a2)};-webkit-background-clip:text;background-clip:text;color:transparent;">+${vsCtrl}%</span>
        <span style="color:var(--ink-soft);font-weight:600;font-size:16px;">&nbsp; vs your control</span>
      </div>
    </div></div>`;
  }

  /* ---------- SCENE D — optimization: winner survives & scales ---------- */
  function sceneOptimize(t) {
    const winner = 4;
    const cols = 3, gx = 18, gy = 22, tileW = 144, tileH = 150;
    const gridW = cols * tileW + (cols - 1) * gx;
    const tiles = [
      { hue: 30, hook: 0.31, out: 0.50 }, { hue: 12, hook: 0.44, out: 0.60 }, { hue: 40, hook: 0.27, out: 0.46 },
      { hue: 22, hook: 0.52, out: 0.66 }, { hue: 8, hook: 0.71, out: 1.0 }, { hue: 348, hook: 0.38, out: 0.56 },
    ];
    const hookV = lerp(0, 0.71, easeOut(seg(t, 0.52, 0.82)));
    const tilesHTML = tiles.map((tile, i) => {
      const intro = easeOut(seg(t, 0.04 + i * 0.04, 0.3));
      const isWin = i === winner;
      const col = i % cols, row = Math.floor(i / cols);
      const baseX = col * (tileW + gx), baseY = row * (tileH + gy);
      const elim = isWin ? 0 : seg(t, tile.out, tile.out + 0.14);
      const grow = isWin ? easeInOut(seg(t, 0.62, 0.86)) : 0;
      const bigW = gridW, bigH = 440;
      const x = isWin ? lerp(baseX, (gridW - bigW) / 2, grow) : baseX;
      const y = isWin ? lerp(baseY, 28, grow) : baseY;
      const w = isWin ? lerp(tileW, bigW, grow) : tileW;
      const hh = isWin ? lerp(tileH, bigH, grow) : tileH;
      const meter = lerp(0, tile.hook, easeOut(seg(t, 0.34 + i * 0.02, 0.58)));
      const ring = (isWin && grow > 0.02) ? `<div style="position:absolute;inset:-2px;border-radius:16px;pointer-events:none;border:2.5px solid transparent;background-origin:border-box;background:${grad(a1, a2)} border-box;-webkit-mask:linear-gradient(#000 0 0) padding-box, linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;opacity:${grow};box-shadow:0 0 ${30 * grow}px ${a1}55;"></div>` : '';
      const meterHTML = (!isWin) ? `<div style="position:absolute;left:10px;right:10px;bottom:10px;"><div style="height:4px;border-radius:3px;background:rgba(255,255,255,.4);overflow:hidden;"><div style="height:100%;width:${meter * 100}%;background:#fff;border-radius:3px;"></div></div></div>` : '';
      const readout = (isWin && grow > 0.3) ? `<div style="position:absolute;left:18px;bottom:18px;opacity:${seg(t, 0.7, 0.84)};color:#fff;"><div style="display:flex;align-items:baseline;gap:8px;"><span style="font-size:54px;font-weight:700;letter-spacing:-0.03em;">${Math.round(hookV * 100)}%</span>${arrow(true)}</div><div style="font-size:13px;color:rgba(255,255,255,.9);font-weight:600;letter-spacing:.01em;margin-top:-1px;white-space:nowrap;">Thumbstop · hook rate</div></div>` : '';
      const scaling = (isWin && grow > 0.5) ? `<span class="s-pill" style="position:absolute;top:14px;right:14px;opacity:${seg(t, 0.78, 0.9)};background:rgba(255,255,255,.92);color:${a1};font-size:11.5px;"><span style="width:6px;height:6px;border-radius:9px;background:currentColor;"></span>Scaling</span>` : '';
      return `<div style="position:absolute;left:0;top:0;width:${w}px;height:${hh}px;transform:translate(${x}px,${y}px) scale(${1 - elim * 0.25});opacity:${intro * (1 - elim)};z-index:${isWin ? 5 : 1};filter:${elim ? `blur(${elim * 4}px)` : 'none'};">
        <div style="position:relative;width:100%;height:100%;">${creativeFrame(tile.hue, 0, 14, isWin && grow > 0.4)}${ring}${meterHTML}${readout}${scaling}</div></div>`;
    }).join('');
    return `<div class="s-scene"><div style="position:absolute;inset:34px;display:flex;flex-direction:column;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span class="s-eyebrow">Creative testing</span>
        <span style="font-size:13px;color:var(--ink-soft);font-weight:600;">${seg(t, 0.66, 0.7) > 0.5 ? '1 scaling winner' : '6 variants live'}</span>
      </div>
      <div style="position:relative;flex:1;margin-top:18px;">${tilesHTML}</div>
    </div></div>`;
  }

  /* ---------- assemble + run ---------- */
  mount.innerHTML = `
    <div class="anim-stage-wrap">
      <div class="s-card anim-card">
        <div class="anim-stage">
          <div class="anim-layer"></div><div class="anim-layer"></div><div class="anim-layer"></div>
        </div>
      </div>
      <div class="anim-dots"><span></span><span></span><span></span></div>
    </div>`;
  const card = mount.querySelector('.anim-card');
  const stage = mount.querySelector('.anim-stage');
  const layers = mount.querySelectorAll('.anim-layer');
  const dots = mount.querySelectorAll('.anim-dots span');

  const acts = [
    { start: 0.00, end: 0.345, render: sceneDashboard },
    { start: 0.345, end: 0.685, render: sceneWinner },
    { start: 0.685, end: 1.00, render: sceneOptimize },
  ];

  // scale the fixed 600px stage to fit the responsive card
  const fit = () => { if (card) stage.style.transform = `scale(${card.clientWidth / 600})`; };
  if ('ResizeObserver' in window) { const ro = new ResizeObserver(fit); ro.observe(card); }
  else window.addEventListener('resize', fit);
  fit();

  function frame(T) {
    acts.forEach((act, i) => {
      const local = clamp((T - act.start) / (act.end - act.start), 0, 1);
      const fadeIn = seg(T, act.start - 0.015, act.start + 0.025);
      const fadeOut = 1 - seg(T, act.end - 0.025, act.end + 0.015);
      const op = clamp(Math.min(fadeIn, fadeOut), 0, 1);
      const enter = seg(T, act.start - 0.01, act.start + 0.04);
      const exit = seg(T, act.end - 0.04, act.end + 0.01);
      const layer = layers[i];
      layer.style.opacity = op;
      layer.style.transform = `translateY(${(1 - enter) * 14 - exit * 14}px) scale(${lerp(0.985, 1, enter)})`;
      if (op > 0.001) { layer.innerHTML = act.render(local); layer.dataset.on = '1'; }
      else if (layer.dataset.on === '1') { layer.innerHTML = ''; layer.dataset.on = '0'; }
    });
    dots.forEach((d, i) => {
      const on = T >= acts[i].start - 0.02 && T < acts[i].end - 0.02;
      d.style.width = on ? '26px' : '6px';
      d.style.background = on ? grad(a1, a2) : 'var(--line)';
    });
  }

  const DURATION = 19000 / 1.7;   // matches the design's chosen speed (1.7×)
  const INITIAL_T = 0.30;         // first paint lands on a settled dashboard frame
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduce) {
    frame(INITIAL_T);             // hold a complete, legible frame, no animation
  } else {
    let start = null;
    const tick = (now) => {
      if (start == null) start = now - INITIAL_T * DURATION;
      frame(((now - start) % DURATION) / DURATION);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
})();
