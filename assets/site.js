class DCLogic {
  constructor(props) { this.props = props || {}; this.state = {}; }
  setState(patch) { Object.assign(this.state, typeof patch === 'function' ? patch(this.state) : patch); if (this.__mounted) this.__render(); }
  forceUpdate() { if (this.__mounted) this.__render(); }
}
class Component extends DCLogic {
  /* a theme colour from the page's CSS tokens (read from .page, so the design canvas gets the same theme) */
  static cssVar(n, d) { try { const v = getComputedStyle(document.querySelector('.page') || document.documentElement).getPropertyValue(n).trim(); return v || d; } catch (e) { return d; } }
  constructor(props) {
    super(props);
    if (!window.__amAnchor) { window.__amAnchor = true;
      document.addEventListener('click', (e) => {
        const a = e.target && e.target.closest ? e.target.closest('a[href^="#"]') : null; if (!a) return;
        const id = a.getAttribute('href').slice(1); if (!id) return; const el = document.getElementById(id); if (!el) return;
        e.preventDefault();
        const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const y0 = window.scrollY || document.documentElement.scrollTop; const hd = document.querySelector('.site-head'); const off = hd && getComputedStyle(hd).position === 'sticky' && el.getBoundingClientRect().top < 0 ? hd.offsetHeight : 0; /* the header hides when scrolling down, so only leave room for it when going up */ const y1 = y0 + el.getBoundingClientRect().top - off - (parseFloat(el.getAttribute('data-scroll-offset')) || 0);
        const dist = Math.abs(y1 - y0); if (reduce || dist < 2) { window.scrollTo(0, y1); return; }
        const D = Math.min(2000, 900 + dist * 0.3); const t0 = performance.now();
        const ease = (x) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
        let stop = false; const cancel = () => { stop = true; };
        window.addEventListener('wheel', cancel, { once: true, passive: true }); window.addEventListener('touchstart', cancel, { once: true, passive: true });
        const step = (n) => { if (stop) return; const k = Math.min(1, (n - t0) / D); window.scrollTo(0, y0 + (y1 - y0) * ease(k)); if (k < 1) requestAnimationFrame(step); else { try { history.replaceState(null, '', '#' + id); } catch (_) {} try { el.focus({ preventScroll: true }); } catch (_) {} } };
        requestAnimationFrame(step);
      });
    }
    /* headline: "Stop approving. Start proving." builds itself once from symbols when the page opens,
       then "approving." gets struck through and the line stays. */
    this.line = ['approving.', 'proving.'];
    this.pool = '∑∫∂πΔ≈±×÷√∞λσμθ≠≤≥01·−';
    this.state = { c1: this.plain(this.line[0]), c2: this.plain(this.line[1]), struck: this.fxStill() };
    this.hlT = 0; this.hlRaf = 0;
    this.pathEl = null; this.setPath = (el) => { this.pathEl = el; this.railUpdate(); };
    this.cur = { el: null, x: -100, y: -100, tx: -100, ty: -100, raf: 0, inside: false };
    this.setCur = (el) => { this.cur.el = el; };
    this.topEl = null; this.setTop = (el) => { this.topEl = el; };
    this.belEl = null; this.setBelief = (el) => { this.belEl = el; };
    this.onPtr = (e) => { if (e.pointerType && e.pointerType !== 'mouse') return; const C = this.cur; C.tx = e.clientX; C.ty = e.clientY; this.curCheck(); this.fxPtr = { x: e.clientX, y: e.clientY }; if (this.fxFar && this.fxFar.length && !this.fxPF) this.fxPF = requestAnimationFrame(() => this.fxFrame()); };
    this.onOut = (e) => { if (!e.relatedTarget) { this.fxPtr = { x: -1e5, y: -1e5 }; this.fxFrame(); } };
    this.onScroll = () => { if (this.fxFar && this.fxPtr && !this.fxPF) this.fxPF = requestAnimationFrame(() => this.fxFrame()); if (!this.railRaf) this.railRaf = requestAnimationFrame(() => { this.railRaf = 0; this.railUpdate(); }); };
    this.fxRef = (el) => this.fxAttach(el);
    this.bk = { cur: { ry: 26, rx: 4, lift: 0 }, tgt: { ry: 26, rx: 4, lift: 0 }, turn: 0, mode: 'idle', vel: 0, drag: null, raf: 0, rt: 0 };
    this.setStage = (el) => { this.bk.stage = el; }; this.setBook3 = (el) => { this.bk.book = el; if (el) this.bRender(); }; this.setBShadow = (el) => { this.bk.shadow = el; };
    this.bDown = (e) => { const B = this.bk; if (e.button !== undefined && e.button !== 0) return; if (e.pointerType === 'mouse') e.preventDefault();
      clearTimeout(B.rt); B.mode = 'drag'; B.vel = 0; B.drag = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId, type: e.pointerType };
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
      if (B.stage) { B.stage.classList.add('dragging'); B.stage.classList.add('touched'); } B.tgt.lift = 18; this.bKick(); };
    this.bMove = (e) => { const B = this.bk; if (B.mode !== 'drag' || !B.drag || e.pointerId !== B.drag.id) return;
      const now = performance.now(), dx = e.clientX - B.drag.x, dy = e.clientY - B.drag.y, dt = Math.max(1, now - B.drag.t);
      B.tgt.ry += dx * 0.55; if (B.drag.type !== 'touch') B.tgt.rx = Math.max(-28, Math.min(28, B.tgt.rx - dy * 0.3));
      B.vel = B.vel * 0.5 + (dx * 0.55) / dt * 16 * 0.5; B.drag.x = e.clientX; B.drag.y = e.clientY; B.drag.t = now; this.bKick(); };
    this.bUp = (e) => { const B = this.bk; if (B.mode !== 'drag' || !B.drag || (e && e.pointerId !== B.drag.id)) return;
      if (B.stage) B.stage.classList.remove('dragging'); B.drag = null; B.tgt.lift = 0;
      if (!this.fxStill() && Math.abs(B.vel) > 0.3) B.mode = 'inertia'; else { B.mode = 'rest'; this.bReturn(); } this.bKick(); };
    this.bKey = (e) => { const B = this.bk; const step = { ArrowLeft: -20, ArrowRight: 20 }[e.key]; if (step === undefined) return;
      e.preventDefault(); clearTimeout(B.rt); B.mode = 'rest'; B.tgt.ry += step; this.bKick(); this.bReturn(); };
    this.bNear = (e) => { const B = this.bk; if (B.mode !== 'idle' || !B.stage || this.fxStill()) return;
      if (e.pointerType && e.pointerType !== 'mouse') return;
      const r = B.stage.getBoundingClientRect(); if (!r.width) return; const sc = r.width / 300 || 1; const R = 520 * sc;
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), d = Math.hypot(dx, dy);
      let p = Math.max(0, 1 - d / R); p = p * p * (3 - 2 * p);
      const nx = Math.max(-1, Math.min(1, dx / R)), ny = Math.max(-1, Math.min(1, dy / R));
      B.tgt.ry = B.turn + 26 - p * 20 + nx * 16 * p; B.tgt.rx = 4 - ny * 10 * p; B.tgt.lift = p * 28; this.bKick(); };
  }
  initPortraitVid() {
    const w = document.querySelector('.portrait-wrap'), v = w && w.querySelector('.portrait-vid');
    if (!v || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
    const FADE = 1300, HOLD_IN = 700, HOLD_OUT = 500, RAMP = 0.7, MIN = 0.3;
    let busy = false, raf = 0;
    const ease = () => { const d = v.duration || 4, t = v.currentTime; v.playbackRate = Math.max(MIN, Math.min(1, t / RAMP, (d - t) / RAMP)); if (!v.paused && !v.ended) raf = requestAnimationFrame(ease); };
    const finish = () => { cancelAnimationFrame(raf); setTimeout(() => { w.classList.remove('vid-on'); setTimeout(() => { try { v.currentTime = 0; } catch (e) {} busy = false; }, FADE + 100); }, HOLD_OUT); };
    const start = () => { w.classList.add('vid-on'); setTimeout(() => { v.playbackRate = MIN; const p = v.play(); if (p && p.catch) p.catch(() => { w.classList.remove('vid-on'); busy = false; }); raf = requestAnimationFrame(ease); }, FADE * 0.6 + HOLD_IN); };
    const play = () => { if (busy) return; busy = true; v.preload = 'auto'; try { v.currentTime = 0; } catch (e) {} if (v.readyState >= 2) start(); else { v.addEventListener('loadeddata', start, { once: true }); v.load(); } };
    v.addEventListener('ended', finish);
    if ('IntersectionObserver' in window) { const io = new IntersectionObserver((es) => { es.forEach((e) => { if (e.isIntersecting) { io.disconnect(); setTimeout(play, 2000); } }); }, { threshold: 0.5 }); io.observe(w); } else { setTimeout(play, 2000); }
    w.addEventListener('mouseenter', play);
  }
  initMemo() {
    /* Hero background: the Grant & Bear footer's flowing line field, in ink on paper.
       Interaction as plucked strings: a line only moves once the cursor crosses it, follows the cursor
       until stretched past MAXPULL, then lets go and settles back.
       Tuned for slower machines (Firefox on integrated graphics): steady 30 fps cadence, capped pixel density,
       lines batched into a few strokes, shared wave terms computed once per frame, no CSS mask on the canvas. */
    const cv = document.querySelector('#top .memo-canvas'), top = document.getElementById('top');
    if (!cv || !cv.getContext || !top) return;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = cv.getContext('2d', { alpha: true }), GAP = 14, STEP = 10, AMP = 0.75;
    const SIGMA = 100, MAXPULL = 24, GRAB_K = 0.3, GRAB_D = 0.6, BACK_K = 0.05, BACK_D = 0.78;
    const BUCKETS = 8, FADE_FROM = 0.62;
    let W = 0, H = 0, DPR = 1, lines = [], vis = true, last = 0, cur = null, prev = null, t = 0, n = 0;
    let XS = new Float32Array(0), A1 = XS, A2 = XS, A3 = XS, A4 = XS;
    /* hero portrait: the lines flow over and around its silhouette like contour lines around a rock.
       GF is a soft (blurred) copy of the portrait's alpha on a coarse grid; every line point is lifted by CA * GF,
       which keeps the bend smooth in both directions and never lets two lines cross. */
    const CA = 64, CELL = 8;
    let GF = null, GW = 0, GH = 0;
    const lift = (x, y) => {
      if (!GF) return 0;
      const gx = x / CELL, gy = y / CELL, i = Math.floor(gx), j = Math.floor(gy);
      if (i < 0 || j < 0 || i >= GW - 1 || j >= GH - 1) return 0;
      const fx = gx - i, fy = gy - j, k = j * GW + i;
      const v = (GF[k] * (1 - fx) + GF[k + 1] * fx) * (1 - fy) + (GF[k + GW] * (1 - fx) + GF[k + GW + 1] * fx) * fy;
      return CA * v;
    };
    const field = () => {
      GF = null;
      const img = document.querySelector('#top .hero-portrait img');
      if (!img || !img.complete || !img.naturalWidth || !W || !H) return;
      const cr = cv.getBoundingClientRect(), ir = img.getBoundingClientRect();
      if (!ir.width || !ir.height) return;
      GW = Math.ceil(W / CELL) + 2; GH = Math.ceil(H / CELL) + 2;
      let data;
      try {
        const oc = document.createElement('canvas'); oc.width = GW; oc.height = GH;
        const ox = oc.getContext('2d'); ox.drawImage(img, (ir.left - cr.left) / CELL, (ir.top - cr.top) / CELL, ir.width / CELL, ir.height / CELL);
        data = ox.getImageData(0, 0, GW, GH).data;
      } catch (e) { return; }
      let a = new Float32Array(GW * GH), b = new Float32Array(GW * GH), any = false;
      for (let k = 0; k < a.length; k++) { a[k] = data[k * 4 + 3] / 255; if (a[k] > 0.5) any = true; }
      if (!any) return;
      /* three box-blur passes in each direction approximate a gaussian of about 36 px */
      const R = 4;
      for (let pass = 0; pass < 3; pass++) {
        for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) { let s = 0, c = 0; for (let d = -R; d <= R; d++) { const ii = i + d; if (ii >= 0 && ii < GW) { s += a[j * GW + ii]; c++; } } b[j * GW + i] = s / c; }
        for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) { let s = 0, c = 0; for (let d = -R; d <= R; d++) { const jj = j + d; if (jj >= 0 && jj < GH) { s += b[jj * GW + i]; c++; } } a[j * GW + i] = s / c; }
      }
      GF = a;
    };
    const t0 = performance.now();
    const accent = (getComputedStyle(cv).color || 'rgb(71,134,235)');
    const wave = (x, y0) => { const y = y0 + AMP * (40 * Math.sin(x * 0.0042 + y0 * 0.011 + t * 0.16) + 18 * Math.sin(x * 0.011 - y0 * 0.006 - t * 0.22) + 9 * Math.sin((x + y0) * 0.023 + t * 0.31) + 46 * Math.sin(y0 * 0.004 + Math.sin(x * 0.0016 + t * 0.07) * 2.2)); return y - lift(x, y); };
    const size = () => {
      const r = cv.getBoundingClientRect(); DPR = Math.min(1.5, window.devicePixelRatio || 1); W = r.width; H = r.height;
      cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
      lines = []; for (let y0 = -GAP * 6; y0 < H + GAP * 6; y0 += GAP) lines.push({ y0, a: 0, v: 0, gx: 0, held: false });
      n = Math.ceil((W + 2 * STEP) / STEP) + 1; XS = new Float32Array(n); A1 = new Float32Array(n); A2 = new Float32Array(n); A3 = new Float32Array(n); A4 = new Float32Array(n);
      for (let i = 0; i < n; i++) XS[i] = -STEP + i * STEP;
      field();
    };
    const step = () => {
      if (cur && prev && (cur.x !== prev.x || cur.y !== prev.y)) {
        for (const L of lines) {
          const dp = prev.y - wave(prev.x, L.y0), dc = cur.y - wave(cur.x, L.y0);
          if (!L.held && dp * dc <= 0) { const k = Math.abs(dp) / (Math.abs(dp) + Math.abs(dc) || 1); L.held = true; L.gx = prev.x + (cur.x - prev.x) * k; }
          if (L.held) {
            L.gx += (cur.x - L.gx) * 0.5;
            if (Math.abs(dc) > MAXPULL) { L.held = false; L.a = Math.sign(dc) * Math.max(Math.abs(L.a), MAXPULL * 0.85); L.v = 0; }
          }
        }
      }
      for (const L of lines) {
        if (L.held && cur) { const want = cur.y - wave(cur.x, L.y0); L.v = (L.v + (want - L.a) * GRAB_K) * GRAB_D; L.a += L.v; }
        else if (L.a !== 0 || L.v !== 0) { L.held = false; L.v = (L.v - L.a * BACK_K) * BACK_D; L.a += L.v; if (Math.abs(L.a) < 0.02 && Math.abs(L.v) < 0.02) { L.a = 0; L.v = 0; } }
      }
      prev = cur ? { x: cur.x, y: cur.y } : null;
    };
    const lineY = (y0, i) => y0 + AMP * (40 * Math.sin(A1[i] + y0 * 0.011) + 18 * Math.sin(A2[i] - y0 * 0.006) + 9 * Math.sin(A3[i] + y0 * 0.023) + 46 * Math.sin(y0 * 0.004 + A4[i]));
    const paths = new Array(BUCKETS), tint = new Array(5);
    const draw = () => {
      /* wave terms that depend only on x and time: once per frame instead of once per point */
      for (let i = 0; i < n; i++) { const x = XS[i]; A1[i] = x * 0.0042 + t * 0.16; A2[i] = x * 0.011 - t * 0.22; A3[i] = x * 0.023 + t * 0.31; A4[i] = Math.sin(x * 0.0016 + t * 0.07) * 2.2; }
      for (let b = 0; b < BUCKETS; b++) paths[b] = null;
      for (let b = 0; b < tint.length; b++) tint[b] = null;
      const fadeStart = H * FADE_FROM, fadeLen = H - fadeStart;
      for (const L of lines) {
        const fade = L.y0 <= fadeStart ? 1 : Math.max(0, 1 - (L.y0 - fadeStart) / fadeLen);
        if (fade <= 0.02) continue;
        const pulse = Math.sin((L.y0 / H) * 3.1 + t * 0.05);
        const alpha = (0.045 + 0.04 * pulse * pulse) * fade;               /* 0 … 0.085 */
        const b = Math.min(BUCKETS - 1, Math.round(alpha / 0.085 * (BUCKETS - 1)));
        const p = paths[b] || (paths[b] = new Path2D());
        const moving = L.a !== 0;
        let prevY = 0, prevOff = 0;
        for (let i = 0; i < n; i++) {
          const x = XS[i]; let y = lineY(L.y0, i), off = 0;
          if (GF) y -= lift(x, y);
          if (moving) { const d = x - L.gx; off = L.a * Math.exp(-(d * d) / (2 * SIGMA * SIGMA)); y += off; }
          if (i === 0) p.moveTo(x, y); else p.lineTo(x, y);
          if (moving && i > 0) {
            /* only the pulled part tints into the accent, fading as it settles (5 opacity steps, one stroke each) */
            const m = (Math.abs(prevOff) + Math.abs(off)) / 2 * fade;
            if (m >= 0.6) { const k = Math.min(4, Math.floor(Math.min(0.2, m / 32) / 0.2 * 5)); const tp = tint[k] || (tint[k] = new Path2D()); tp.moveTo(x - STEP, prevY); tp.lineTo(x, y); }
          }
          prevY = y; prevOff = off;
        }
      }
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H);
      /* line colour and strength from the canvas's CSS (--wave: r,g,b; --wave-k: alpha factor) */
      const ccs = getComputedStyle(cv), wv = ccs.getPropertyValue('--wave').trim() || '18,18,18', wk = parseFloat(ccs.getPropertyValue('--wave-k')) || 1;
      ctx.lineWidth = 0.8; ctx.strokeStyle = 'rgb(' + wv + ')';
      for (let b = 0; b < BUCKETS; b++) if (paths[b]) { ctx.globalAlpha = Math.min(1, Math.max(0.004, (b / (BUCKETS - 1)) * 0.085) * wk); ctx.stroke(paths[b]); }
      ctx.lineWidth = 1; ctx.strokeStyle = accent;
      for (let k = 0; k < tint.length; k++) if (tint[k]) { ctx.globalAlpha = (k + 1) / 5 * 0.2; ctx.stroke(tint[k]); }
      ctx.globalAlpha = 1;
    };
    size(); window.addEventListener('resize', () => { size(); draw(); });
    const pimg = document.querySelector('#top .hero-portrait img');
    if (pimg && !pimg.complete) pimg.addEventListener('load', () => { field(); draw(); }, { once: true });
    if (reduce) { draw(); return; }
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      if (x < 0 || y < 0 || x > r.width || y > r.height) { cur = null; prev = null; return; }
      cur = { x, y };
    }, { passive: true });
    document.addEventListener('mouseleave', () => { cur = null; prev = null; });
    if ('IntersectionObserver' in window) new IntersectionObserver((es) => { vis = es[0].isIntersecting; }).observe(top);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) last = 0; });
    /* steady cadence: every second display frame at 60 Hz (30 fps), every fourth at 120 Hz. Uneven skipping caused the stutter. */
    const loop = (now) => { requestAnimationFrame(loop); if (!vis || document.hidden || now - last < 1000 / 30 - 4) return; last = now; t = (now - t0) / 1000; step(); draw(); };
    requestAnimationFrame(loop);
  }
  componentDidMount() {
    this.initPrinciples(); this.initTalks(); this.initRowFill(); this.initBookHint(); this.initSharpen(); this.initMenu(); this.initDots(); this.initPortraitFit(); this.initHeadFit(); this.initMemo(); this.initPortraitVid(); this.initPhotoTrail(); this.initBtnFill(); this.initPortraitReveal(); this.initJourney();
    document.addEventListener('pointermove', this.bNear, { passive: true }); document.addEventListener('pointermove', this.onPtr, { passive: true }); document.addEventListener('mouseout', this.onOut); window.addEventListener('blur', () => this.onOut({}));
    window.addEventListener('scroll', this.onScroll, { passive: true }); window.addEventListener('resize', this.onScroll, { passive: true });
    this.railUpdate();
    /* design canvas only: a board shown zoomed out redraws the whole scaled board on every frame of the build,
       so there it shows the finished, struck-through line instead. On the live site the zoom is always 1. */
    const tEl = this.topEl, zoom = tEl && tEl.offsetWidth ? tEl.getBoundingClientRect().width / tEl.offsetWidth : 1;
    if (zoom < 0.75) this.setState({ struck: true });
    else if (!this.fxStill()) {
      const [a, b] = this.line; this.setState({ c1: this.noise(a), c2: this.noise(b) });
      this.hlT = setTimeout(() => this.build(), 300);
    }
  }
  componentWillUnmount() { document.removeEventListener('pointermove', this.bNear); document.removeEventListener('pointermove', this.onPtr); window.removeEventListener('scroll', this.onScroll); window.removeEventListener('resize', this.onScroll); clearTimeout(this.hlT); cancelAnimationFrame(this.hlRaf); }
  initPrinciples() {
    /* My principles: the cards are thrown onto a pile, one per scroll step, and the spinner turns into a progress dial.
       On the site the section pins (sticky) while the window scrolls. The design canvas never scrolls a board, so there
       the pin is imitated: the visible part of the section (from IntersectionObserver) moves the stage down with the view. */
    const sec = document.getElementById('beliefs'), list = sec && sec.querySelector('.split-list'); if (!list || !window.matchMedia) return;
    const inner = sec.querySelector('.split-inner'), cards = [...list.querySelectorAll('.thesis')], n = cards.length;
    sec.classList.add('pr-js');
    const TILT = [-2.2, 1.6, -1.1, 2.4, -1.7, .9], VH = 800;
    /* 26px between the cards on the pile on desktop, 8px on phones; 100px of scrolling per card while the section is pinned (desktop) */
    const phone = () => !!(window.matchMedia && matchMedia('(max-width:760px)').matches);
    let PILE = 26, STEPH = 100;
    const spin = sec.querySelector('.spin'), ticks = spin ? [...spin.querySelectorAll('line')] : [];
    const count = document.createElement('span'); count.className = 'dial-count'; spin && spin.after(count);
    /* each headline is split into words so it can sharpen word by word as its card lands (the struck word stays whole) */
    cards.forEach((c) => { const h = c.querySelector('.thesis-head'); let i = 0; if (!h) return;
      [...h.childNodes].forEach((x) => { if (x.nodeType === 3) { const f = document.createDocumentFragment();
          x.textContent.split(/(\s+)/).forEach((t) => { if (!t) return; if (/^\s+$/.test(t)) f.appendChild(document.createTextNode(t));
            else { const s = document.createElement('span'); s.className = 'w'; s.style.setProperty('--i', i++); s.textContent = t; f.appendChild(s); } });
          x.replaceWith(f); } else if (x.nodeType === 1) { x.classList.add('w'); x.style.setProperty('--i', i++); } }); });
    const order = ticks.map((_, j) => ticks[(9 + j) % ticks.length]);   /* clockwise from 12 o'clock */
    let k = -1, on = false;
    const show = (m) => { if (m === k) return; k = m;
      cards.forEach((c, i) => { const l = i < m; c.classList.toggle('landed', l); if (l) c.classList.add('seen'); c.style.zIndex = String(10 + i);
        c.style.transform = l ? 'translate(' + (i * PILE) + 'px,0) rotate(' + TILT[i] + 'deg)' : ''; });
      const lit = Math.round(m / n * order.length);
      order.forEach((t, j) => { t.style.opacity = j < lit ? '1' : '.16'; t.style.stroke = j < lit ? 'var(--accent)' : ''; });
      count.textContent = String(m).padStart(2, '0') + ' / ' + String(n).padStart(2, '0');
      if (nav) { prev.disabled = !done && m <= 1; next.disabled = !done && m >= n; } };
    /* after the first full pass, two arrows appear under the pile (see the deck below) */
    const ico = (d) => '<svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><path d="' + d + '" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const nav = document.createElement('div'); nav.className = 'pr-nav';
    const prev = document.createElement('button'), next = document.createElement('button');
    prev.type = next.type = 'button'; prev.className = next.className = 'pr-btn';
    prev.setAttribute('aria-label', 'Previous principle'); next.setAttribute('aria-label', 'Next principle');
    prev.innerHTML = ico('M15 5l-7 7 7 7'); next.innerHTML = ico('M9 5l7 7-7 7');
    nav.append(prev, next); list.appendChild(nav);
    /* a small hint above the arrows that the finished pile can be flicked; it goes once someone has used the deck */
    const hint = document.createElement('div'); hint.className = 'pr-hint'; hint.setAttribute('aria-hidden', 'true');
    hint.innerHTML = '<span class="pr-hint-ic"><i></i><i></i><i></i></span><span>' + (matchMedia('(hover: none)').matches ? 'Swipe the cards' : 'Drag or flick the cards') + '</span>';
    list.appendChild(hint);
    /* the stage clips the flying cards; never let focus or scrollIntoView scroll it sideways */
    inner && inner.addEventListener('scroll', () => { if (inner.scrollLeft || inner.scrollTop) { inner.scrollLeft = 0; inner.scrollTop = 0; } });
    /* after the first full pass the finished pile becomes an endless deck, like the quote deck on the talks page: flick the
       top card (drag, swipe or tap) and it flies off the way you threw it, then tucks under the pile, so the card beneath is
       on top. The left arrow does the same (the card leaves to the right, where it came from); the right arrow pulls the
       bottom card out and lays it on top, so from the last principle you come round to the first. */
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const OUT = 'cubic-bezier(.2,.7,.3,1)', TUCK = 'cubic-bezier(.22,1,.36,1)';
    let top = n - 1, busy = false;                                    /* the card on top of the pile */
    const slot = (q) => 'translate(' + (q * PILE) + 'px,0) rotate(' + TILT[q] + 'deg)';
    const tfx = (x, y, r) => 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + r.toFixed(2) + 'deg)';
    const deal = () => { cards.forEach((c, i) => { const q = n - 1 - ((top - i + n) % n);
      c.style.zIndex = String(10 + q); c.style.transform = slot(q); c.classList.toggle('front', i === top); }); };
    const throwTop = (ux, uy, from, speed) => { if (busy) return;
      const c = cards[top]; c.classList.remove('dragging');
      if (reduce) { top = (top - 1 + n) % n; deal(); return; }
      busy = true; c.classList.add('flying');
      const L = Math.hypot(ux, uy) || 1; ux /= L; uy /= L;
      const w = c.offsetWidth, h = c.offsetHeight, ax = Math.abs(ux), ay = Math.abs(uy), x0 = (n - 1) * PILE;
      const t = Math.min(ax > .05 ? w * 1.04 / ax : 1e9, ay > .05 ? h * 1.08 / ay : 1e9);
      const out = tfx(x0 + ux * t, uy * t, (ux >= 0 ? 1 : -1) * (9 + 9 * ax) + uy * 4);
      const a1 = c.animate([{ transform: from || slot(n - 1) }, { transform: out }], { duration: Math.max(200, Math.min(380, speed ? t / (speed * 1.6) : 340)), easing: OUT, fill: 'forwards' });
      a1.onfinish = () => { top = (top - 1 + n) % n; deal();          /* it is the bottom card now; the rest move up a place */
        const a2 = c.animate([{ transform: out }, { transform: slot(0) }], { duration: 620, easing: TUCK });
        a1.cancel(); busy = false; a2.onfinish = a2.oncancel = () => c.classList.remove('flying'); }; };
    const pullBottom = () => { if (busy) return;
      const j = (top + 1) % n, c = cards[j];
      if (reduce) { top = j; deal(); return; }
      busy = true; c.classList.add('flying');
      const out = tfx((n - 1) * PILE + c.offsetWidth * 1.04, -c.offsetHeight * .08, 14);
      const a1 = c.animate([{ transform: slot(0) }, { transform: out }], { duration: 320, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards' });
      a1.onfinish = () => { top = j; deal();
        const a2 = c.animate([{ transform: out }, { transform: slot(n - 1) }], { duration: 560, easing: TUCK });
        a1.cancel(); a2.onfinish = a2.oncancel = () => { c.classList.remove('flying'); busy = false; }; }; };
    let used = false;
    const use = () => { if (!used) { used = true; sec.classList.add('pr-used'); } };
    const back = () => { if (done) { use(); throwTop(.94, -.34); } }, fwd = () => { if (done) { use(); pullBottom(); } };
    prev.addEventListener('click', back); next.addEventListener('click', fwd);
    sec.addEventListener('keydown', (e) => { if (!done) return;
      if (e.key === 'ArrowLeft') { back(); e.preventDefault(); } else if (e.key === 'ArrowRight') { fwd(); e.preventDefault(); } });
    /* drag: the top card follows the pointer, tilting around where you hold it; let go fast or far and it is thrown */
    let drag = null, sx = 0, sy = 0, dx = 0, dy = 0, gy = 0, trail = [];
    const dragTf = () => tfx((n - 1) * PILE + dx, dy, TILT[n - 1] + Math.max(-16, Math.min(16, dx * .045 * (gy < .5 ? 1 : -.7))));
    list.addEventListener('pointerdown', (e) => { if (!done || busy || e.button > 0) return; const c = e.target.closest('.thesis.front'); if (!c) return;
      const r = c.getBoundingClientRect(); drag = c; sx = e.clientX; sy = e.clientY; dx = dy = 0; gy = (e.clientY - r.top) / (r.height || 1); trail = [[e.timeStamp, 0, 0]];
      c.classList.add('dragging'); try { c.setPointerCapture(e.pointerId); } catch (_) {} });
    list.addEventListener('pointermove', (e) => { if (!drag) return;
      dx = e.clientX - sx; dy = (e.pointerType === 'touch' ? .35 : 1) * (e.clientY - sy);
      trail.push([e.timeStamp, dx, dy]); while (trail.length > 2 && e.timeStamp - trail[0][0] > 90) trail.shift();
      if (Math.abs(dx) > 6) use(); drag.style.transform = dragTf(); });
    const end = (e, cancelled) => { if (!drag) return; const c = drag; drag = null;
      const dist = Math.hypot(dx, dy), t0 = trail[0], dt = Math.max(1, (e ? e.timeStamp : 0) - t0[0]);
      const vx = (dx - t0[1]) / dt, vy = (dy - t0[2]) / dt, speed = Math.hypot(vx, vy);
      if (!cancelled && dist < 6) { c.classList.remove('dragging'); back(); return; }           /* a tap flicks it away */
      if (!cancelled && (dist > Math.min(150, c.offsetWidth * .24) || (speed > .45 && dist > 24))) {
        const from = dragTf(); c.classList.remove('dragging');
        if (speed > .3) throwTop(vx, vy, from, speed); else throwTop(dx, dy, from, 0); return; }
      c.classList.remove('dragging'); deal(); };                                                /* not enough: it settles back */
    list.addEventListener('pointerup', (e) => end(e, false)); list.addEventListener('pointercancel', (e) => end(e, true));
    /* once the whole stack has been thrown, it stays a stack: scrolling back up passes over the finished pile */
    let done = false;
    /* once complete, scrolling no longer moves the cards; the buttons do */
    const at = (s) => { if (done) return; const m = Math.max(0, Math.min(n, Math.floor(s / STEPH + 1)));
      if (m >= n) { done = true; sec.classList.add('pr-complete'); nudge(); } show(m); if (done) deal(); };
    /* the moment the pile is complete, the top card lifts a corner once, so it reads as something you can throw */
    function nudge() { if (reduce) return; setTimeout(() => { if (used || busy || drag) return; const c = cards[top], base = slot(n - 1);
      c.classList.add('flying');
      const a = c.animate([{ transform: base }, { transform: tfx((n - 1) * PILE + 22, -10, TILT[n - 1] + 3.2), offset: .38 }, { transform: tfx((n - 1) * PILE - 4, 1, TILT[n - 1] - .6), offset: .72 }, { transform: base }],
        { duration: 1100, easing: 'cubic-bezier(.45,0,.2,1)' });
      a.onfinish = a.oncancel = () => c.classList.remove('flying'); }, 2300); }
    /* a window the height of a screen scrolls like the site (the live site, and a board opened full-window in the canvas);
       a frame as tall as the whole page (a board on the canvas) never scrolls, so the pin is imitated below */
    if (this.__site || innerHeight < 2000) {
      /* after the first full pass the pin is released: the section shrinks to one screen and the page scrolls past the
         finished pile normally. Leaving at the bottom, the scroll position is corrected by the height removed, so nothing jumps. */
      let freed = false;
      const free = (fix) => { freed = true; const y = window.scrollY, h0 = sec.offsetHeight; sec.style.height = ''; sec.classList.add('pr-free');
        /* the correction is not the reader scrolling up, so the header is told to ignore it (data-scroll-fix) */
        if (fix) { document.documentElement.dataset.scrollFix = '1'; window.scrollTo({ top: y - (h0 - sec.offsetHeight), behavior: 'instant' }); } };
      const upd = () => { if (!on || freed) return; const r = sec.getBoundingClientRect();
        spin && spin.classList.toggle('dial', r.top < innerHeight * 0.5); at(-r.top);
        if (done && r.bottom <= innerHeight + 1) free(true); else if (done && r.top > 0) free(false); };
      /* on phones every card gets the height of the tallest one, so the pile is even */
      const fit = () => { if (!phone()) { list.style.removeProperty('--pr-h'); return; }
        list.style.setProperty('--pr-spread', ((n - 1) * PILE) + 'px'); list.style.removeProperty('--pr-h');
        const h = Math.max(...cards.map((c) => { const b = c.querySelector('.thesis-body'); return b ? b.offsetHeight : 0; })) + 44;
        list.style.setProperty('--pr-h', Math.ceil(h) + 'px'); };
      let lw = 0;
      /* phones: no pin. Scrolling a pinned section on a phone is too easy to overshoot and fights the browser bars, so
         there the pile is dealt by itself the first time the section comes into view (the cards land one after another,
         nothing tied to the scroll), and it is a deck you can swipe from then on */
      let dealt = false;
      const dealIn = () => { if (dealt) return; dealt = true; done = true; freed = true; sec.classList.add('pr-complete', 'pr-flat'); prev.disabled = next.disabled = false;
        if (reduce) { deal(); return; }
        cards.forEach((c, i) => setTimeout(() => { c.classList.add('landed', 'seen'); c.style.zIndex = String(10 + i); c.style.transform = slot(i);
          if (i === n - 1) { deal(); nudge(); } }, 120 + i * 130)); };
      const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => { if (phone() && es.some((e) => e.isIntersecting)) { io.disconnect(); dealIn(); } }, { threshold: .35 }) : null;
      /* desktop: the section is one screen plus one scroll step per card (100svh: the screen with any browser bars shown) */
      const size = () => { const p = phone(); PILE = p ? 8 : 26; STEPH = 100; on = !p;
        if (innerWidth !== lw) { lw = innerWidth; fit(); if (done) deal(); else { const m = k; k = -1; show(Math.max(0, m)); } }
        if (p) { sec.style.height = ''; if (!dealt) { if (io) io.observe(sec); else dealIn(); } return; }
        if (freed) { sec.style.height = ''; return; }
        sec.style.height = (innerHeight + n * STEPH) + 'px'; sec.style.height = 'calc(100svh + ' + (n * STEPH) + 'px)'; upd(); };
      addEventListener('scroll', upd, { passive: true }); addEventListener('resize', size); size(); document.fonts && document.fonts.ready.then(() => { lw = 0; size(); });
      return;
    }
    /* design canvas */
    sec.classList.add('pr-canvas'); sec.style.height = (VH + n * STEPH) + 'px'; inner.style.height = VH + 'px';
    let manual = false;
    const place = (s) => { inner.style.transform = 'translateY(' + Math.max(0, Math.min(n * STEPH, s)) + 'px)'; };
    show(0);
    if ('IntersectionObserver' in window) {
      /* thin invisible strips down the section: the topmost visible strip tells how far the view has moved into it */
      const G = 12, rail = document.createElement('div'), vis = new Set(); rail.className = 'pr-rail'; rail.setAttribute('aria-hidden', 'true');
      const strips = []; for (let y = 0; y < VH + n * STEPH; y += G) { const d = document.createElement('i'); d.style.top = y + 'px'; d.dataset.y = y; rail.appendChild(d); strips.push(d); }
      sec.appendChild(rail); let raf = 0;
      const upd = () => { raf = 0; if (!vis.size) return; let s = Infinity; vis.forEach((y) => { if (y < s) s = y; });
        if (s < G && vis.size * G < 260) { if (!manual && !done) show(0); return; }
        manual = false; place(s); spin && spin.classList.add('dial'); at(s); };
      const io = new IntersectionObserver((es) => { es.forEach((e) => { const y = +e.target.dataset.y; if (e.isIntersecting) vis.add(y); else vis.delete(y); });
        if (!raf) raf = requestAnimationFrame(upd); });
      strips.forEach((d) => io.observe(d));
    }
    /* fallback: a click throws the next card (and starts over after the last one) */
    sec.addEventListener('click', (e) => { if (e.target.closest('a')) return; manual = true; spin && spin.classList.add('dial'); show(k >= n ? 0 : k + 1); });
  }
  initJourney() {
    /* THE JOURNEY: six streams merging into one river (assets/river.js). A black number floats over each stream on a
       fine line whose end is held to the stream by a spring, so it stretches a little as the stream ripples. Picking a
       stream (its number, the stream itself, or a name in the row or the bar) switches the chapter below with a blur and
       glides down to it. Reading on, a bar with a small river and the six chapters stays under the header. */
    const sec = document.getElementById('path'), rv = sec && sec.querySelector('.jr-rv'); if (!rv) return;
    sec.classList.add('jr-js');   /* without JavaScript every chapter is simply shown, one after the other (see the CSS) */
    const calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    /* every chapter is on the page as a list (see the CSS); the river is the index */
    const LIST = true; sec.classList.add('jr-all');
    const wide = () => window.innerWidth >= 1000 && !sec.classList.contains('jr-flat');
    let spyLock = 0;
    /* no WebGL (old devices, some locked-down browsers) or the river failed to load: no river, the row of names does the work */
    const flat = () => { sec.classList.add('jr-flat'); api = null; };
    const all = (s, r) => [...(r || document).querySelectorAll(s)];
    const txt = sec.querySelector('.jr-txt'), arts = all('.jc', txt), bar = sec.querySelector('.jr-bar'), svg = rv.querySelector('svg'), hd = document.querySelector('.site-head');
    const NAMES = arts.map((a) => a.dataset.name), N = NAMES.length, NS = 'http://www.w3.org/2000/svg';
    let sel = 0, hov = -1, api = null, mini = null, M = [], tid = 0, gid = 0;
    const MK = NAMES.map((n, g) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'jr-mk' + (g ? '' : ' on'); b.dataset.g = g; b.setAttribute('aria-label', n); b.setAttribute('aria-pressed', g ? 'false' : 'true');
      b.innerHTML = '<span class="n">0' + (g + 1) + '</span><span class="t">' + n + '</span>'; rv.appendChild(b); return b; });
    const LN = NAMES.map(() => { const p = document.createElementNS(NS, 'path'), d = document.createElementNS(NS, 'circle'); p.setAttribute('fill', 'none'); d.setAttribute('r', '2.6'); svg.append(p, d); return [p, d]; });
    const fades = (el) => { const l = el.scrollLeft > 2, r = el.scrollLeft + el.clientWidth < el.scrollWidth - 2; el.style.setProperty('--fl', l ? '36px' : '0px'); el.style.setProperty('--fr', r ? '36px' : '0px'); };
    all('.jr-chips', sec).forEach((el) => { el.addEventListener('scroll', () => fades(el), { passive: true }); fades(el); });
    /* one pill per row of names, sliding to the current chapter */
    const pills = all('.jr-chips', sec).map((el) => { const p = document.createElement('span'); p.className = 'jr-pill'; p.setAttribute('aria-hidden', 'true'); el.prepend(p); return p; });
    /* the pill moves like a drop of ink: its leading edge springs ahead and overshoots a touch, the trailing edge lets go
       a moment later and catches up, so it stretches on the way and squeezes a little thinner while stretched */
    const PS = new Map(), still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; let praf = 0, plast = 0;
    const drawPill = (p, s) => { const w = Math.max(4, s.r - s.l), st = Math.max(0, w - s.w0) / Math.max(1, s.w0);
      p.style.width = w + 'px'; p.style.height = s.h + 'px'; p.style.transform = 'translate(' + s.l + 'px,' + s.y + 'px) scaleY(' + (1 - Math.min(.22, st * .16)) + ')'; };
    const pillTick = (t) => { const dt = Math.min(.034, (t - (plast || t)) / 1000) || .016; plast = t; let busy = false;
      PS.forEach((s, p) => { const fwd = s.tl > s.l ? 1 : -1;
        [['l', 'vl', 'tl'], ['r', 'vr', 'tr']].forEach(([x, v, tg]) => { const lead = (x === 'r') === (fwd > 0);
          if (!lead && s.wait > 0) return;
          const k = lead ? 260 : 150, d = lead ? 19 : 20; s[v] += ((s[tg] - s[x]) * k - s[v] * d) * dt; s[x] += s[v] * dt; });
        /* it stretches, but never more than about two names' worth: the trailing edge is towed along beyond that */
        const span = s.r - s.l, MAXS = s.w0 + 200; if (span > MAXS) { if (fwd > 0) { s.l = s.r - MAXS; s.vl = Math.max(s.vl, 0); } else { s.r = s.l + MAXS; s.vr = Math.min(s.vr, 0); } }
        s.wait -= dt; drawPill(p, s);
        if (Math.abs(s.tl - s.l) + Math.abs(s.tr - s.r) + Math.abs(s.vl) + Math.abs(s.vr) > .3) busy = true; else { s.l = s.tl; s.r = s.tr; s.vl = s.vr = 0; drawPill(p, s); } });
      praf = busy ? requestAnimationFrame(pillTick) : 0; if (!busy) plast = 0; };
    const placePills = (now) => pills.forEach((p) => { const b = p.parentNode.querySelector('button.on'); if (!b || !b.offsetWidth) return;
      const L = b.offsetLeft, R = L + b.offsetWidth; let s = PS.get(p);
      if (!s || now || still) { s = { l: L, r: R, vl: 0, vr: 0, tl: L, tr: R, w0: R - L, h: b.offsetHeight, y: b.offsetTop, wait: 0 }; PS.set(p, s); drawPill(p, s); return; }
      s.tl = L; s.tr = R; s.w0 = Math.min(s.r - s.l, R - L); s.h = b.offsetHeight; s.y = b.offsetTop; s.wait = .07;
      if (!praf) praf = requestAnimationFrame(pillTick); });
    placePills(true); if ('ResizeObserver' in window) all('.jr-chips', sec).forEach((el) => new ResizeObserver(() => placePills(true)).observe(el));
    const toText = () => { const top = txt.getBoundingClientRect().top + window.scrollY - (window.innerWidth < 761 ? 120 : 150); window.scrollTo({ top, behavior: calm ? 'auto' : 'smooth' }); };
    /* picking a chapter scrolls the list to it; while that scroll runs, the follow-along below waits */
    const toArt = (g) => { const a = arts[g]; if (!a) return; spyLock = performance.now() + 1000;
      const top = a.getBoundingClientRect().top + window.scrollY - (window.innerWidth < 761 ? 120 : 150); window.scrollTo({ top, behavior: calm ? 'auto' : 'smooth' }); };
    const select = (g, from) => {
      if (g < 0 || g >= N) return; const changed = g !== sel; sel = g;
      all('.jr-mk, .jr-chips button', sec).forEach((b) => { b.classList.toggle('on', +b.dataset.g === g); b.setAttribute('aria-pressed', String(+b.dataset.g === g)); }); placePills();
      if (api) api.focus(hov >= 0 ? hov : g); if (mini) mini.focus(g);
      if (changed && !LIST) { const sl = window.getSelection && window.getSelection(); if (sl && sl.rangeCount && txt.contains(sl.anchorNode)) sl.removeAllRanges(); clearTimeout(tid); clearTimeout(gid); const prev = arts.find((x) => x.classList.contains('on')), next = arts[g];
        const h0 = txt.offsetHeight;                                   /* the height now, mid-glide included */
        arts.forEach((x) => { if (x !== prev) x.classList.remove('leave'); x.classList.remove('in'); });
        if (prev) { prev.classList.remove('on'); prev.classList.add('leave'); }
        void txt.offsetWidth; next.classList.add('on', 'in');
        tid = setTimeout(() => arts.forEach((x) => x.classList.remove('leave')), 600);
        /* the height glides from the old chapter's to the new one's, so what follows slides into place instead of jumping */
        const h1 = next.offsetHeight;
        txt.classList.remove('jr-gliding'); txt.style.height = h0 + 'px'; void txt.offsetWidth;
        txt.classList.add('jr-gliding'); txt.style.height = h1 + 'px';
        gid = setTimeout(() => { txt.classList.remove('jr-gliding'); txt.style.height = ''; }, 760); }
      if (LIST) { if (from !== 'spy') toArt(g); }
      else if (from === 'pick') toText();
      else if (from === 'next' || from === 'bar') { const r = txt.getBoundingClientRect(); if (r.top < 70 || r.top > window.innerHeight * .6) toText(); }
      all('.jr-chips', sec).forEach((el) => { const b = el.querySelector('.on'); if (b) el.scrollTo({ left: b.getBoundingClientRect().left - el.getBoundingClientRect().left + el.scrollLeft - 8, behavior: 'smooth' }); });
    };
    const hover = (g) => { hov = g; MK.forEach((m) => m.classList.toggle('hv', +m.dataset.g === g)); if (api) api.focus(g >= 0 ? g : sel); };
    /* a double click on a control would select the text beside it: stop that, and clear any selection inside the chapter
       when it switches */
    sec.addEventListener('mousedown', (e) => { if (e.detail > 1 && e.target.closest('.jr-rv, .jr-mk, .jr-chips, .jr-pn, .jr-bar')) e.preventDefault(); });
    sec.addEventListener('click', (e) => {
      const t = e.target.closest('[data-go]'); if (t) { select(+t.dataset.go, 'next'); return; }
      if (e.target.closest('.jr-mini')) { rv.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      const b = e.target.closest('.jr-mk, .jr-chips button'); if (b) { select(+b.dataset.g, b.closest('.jr-bar') ? 'bar' : 'pick'); return; }
      if (api && e.target.closest('.jr-rv')) { const r = rv.getBoundingClientRect(), g = api.pick(e.clientX - r.left, e.clientY - r.top); if (g >= 0) select(g, 'pick'); }
    });
    MK.forEach((b) => { b.addEventListener('pointerenter', () => hover(+b.dataset.g)); b.addEventListener('pointerleave', () => hover(-1)); });
    rv.addEventListener('pointermove', (e) => { if (!api || e.pointerType === 'touch' || e.target.closest('.jr-mk')) return; const r = rv.getBoundingClientRect(); hover(api.pick(e.clientX - r.left, e.clientY - r.top)); });
    /* the light: a soft lamp follows the pointer over the river (mouse only; set in assets/river.js, interact) */
    rv.addEventListener('pointermove', (e) => { if (!api || !api.pointer || e.pointerType !== 'mouse') return; const r = rv.getBoundingClientRect(); api.pointer(e.clientX - r.left, e.clientY - r.top); });
    rv.addEventListener('pointerleave', () => { hover(-1); if (api && api.pointer) api.pointer(null); });
    const place = () => { if (!api) return; const W = rv.clientWidth, H = rv.clientHeight, small = W < 600;
      M = NAMES.map((n, g) => { const tx = W * ((small ? .1 : .09) + g * (small ? .14 : .1)); let u = .03, p = api.at(g, u);
        for (let k = 0; k < 200 && !(p.x >= tx && p.y > H * .14 && p.y < H * .9); k++) { u += .003; p = api.at(g, u); }
        const lift = (small ? 40 : 58) + (g % 2) * (small ? 14 : 44) + (small ? 0 : 30);
        return { g, u, ax: p.x, ay: p.y, vx: 0, vy: 0, rx: p.x, ry: Math.max(small ? 30 : 40, p.y - lift), nx: p.x, ny: p.y - lift, nvx: 0, nvy: 0 }; }); };
    let last = performance.now();
    const tick = (now) => { const dt = Math.min(.05, (now - last) / 1000); last = now;
      if (bar.classList.contains('on') && hd) { bar.style.top = Math.max(0, hd.getBoundingClientRect().bottom) + 'px'; const hh = hd.offsetHeight + 'px'; if (bar.style.height !== hh) bar.style.height = hh; }
      const r = rv.getBoundingClientRect();
      if (api && M.length && r.bottom > 0 && r.top < window.innerHeight) { const t = now / 1000;
        M.forEach((m, i) => { const p = api.at(m.g, m.u);
          m.vx += ((p.x - m.ax) * 90 - m.vx * 11) * dt; m.vy += ((p.y - m.ay) * 90 - m.vy * 11) * dt; m.ax += m.vx * dt; m.ay += m.vy * dt;
          const tx = m.rx + Math.sin(t * .7 + i * 1.3) * 2.5, ty = m.ry + Math.sin(t * .9 + i * 2.1) * 3.5;
          m.nvx += ((tx - m.nx) * 40 - m.nvx * 7) * dt; m.nvy += ((ty - m.ny) * 40 - m.nvy * 7) * dt; m.nx += m.nvx * dt; m.ny += m.nvy * dt;
          MK[i].style.transform = 'translate(' + (m.nx - 18) + 'px,' + (m.ny - (MK[i].offsetHeight || 60) + 4) + 'px)';
          const x0 = m.nx, y0 = m.ny + 2, bend = (m.vx - m.nvx) * .06, cx = (x0 + m.ax) / 2 + bend + m.vy * .03, cy = (y0 + m.ay) / 2 - Math.abs(bend) * .3;
          const on = i === sel || i === hov, [path, dot] = LN[i];
          path.setAttribute('d', 'M' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ' ' + m.ax.toFixed(1) + ' ' + m.ay.toFixed(1));
          path.setAttribute('stroke', on ? '#121212' : 'rgba(18,18,18,.42)'); path.setAttribute('stroke-width', on ? '1.3' : '.9');
          dot.setAttribute('cx', m.ax.toFixed(1)); dot.setAttribute('cy', m.ay.toFixed(1)); dot.setAttribute('fill', on ? '#121212' : 'rgba(18,18,18,.5)'); }); }
      requestAnimationFrame(tick); };
    /* follow along: the chapter whose title has passed 42% of the screen is the current one (river, numbers, pill, bar) */
    const spy = () => { if (performance.now() < spyLock) return; const line = window.innerHeight * .42; let g = 0;
      arts.forEach((a, i) => { if (a.getBoundingClientRect().top < line) g = i; }); if (g !== sel) select(g, 'spy'); };
    let split = false, glideT = 0;
    const sizeRiver = () => { const jr = sec.querySelector('.jr'), vh = window.innerHeight, W = jr.clientWidth, w = split ? W * .48 : W, h = split ? Math.min(vh - 190, Math.max(380, w / 1.2)) : Math.min(470, Math.max(300, W * .36));
      jr.style.setProperty('--rw', Math.round(w) + 'px'); jr.style.setProperty('--rh', Math.round(h) + 'px'); jr.style.setProperty('--rt', Math.round(split ? Math.max(96, (vh - h) / 2 + 36) : 84) + 'px'); };
    /* wide screens: one threshold with a little play either way, so it never flickers: the river moves aside once the
       heading has scrolled away and comes back once it returns */
    const glide = () => { const jr = sec.querySelector('.jr');
      if (!wide()) { if (split) { split = false; sec.classList.remove('jr-split'); } ['--rw', '--rh', '--rt'].forEach((v) => jr.style.removeProperty(v)); return; }
      const hb = sec.querySelector('.jr-head').getBoundingClientRect().bottom, want = split ? hb < 170 : hb < 70;
      if (want !== split) { split = want; sec.classList.toggle('jr-split', split);
        /* while it moves the river is drawn at half resolution (cheaper per frame), sharp again once it has landed */
        if (api && api.lowRes && !calm) { api.lowRes(true); clearTimeout(glideT); glideT = setTimeout(() => api.lowRes(false), 820); } } sizeRiver(); };
    window.addEventListener('scroll', () => { glide(); spy(); }, { passive: true }); window.addEventListener('resize', glide);
    const onScroll = () => { const rr = (sec.classList.contains('jr-flat') ? sec.querySelector('.jr-chips.jr-row') : rv).getBoundingClientRect(),   /* without the river, the row of names is the anchor */ tr = txt.getBoundingClientRect(), on = wide() ? (split && tr.bottom > 200) : (rr.bottom < 170 && tr.bottom > 200);
      bar.classList.toggle('on', on); sec.classList.toggle('jr-baron', on);
      if (on && !mini && api && window.Prism3D && !wide()) { try { mini = window.Prism3D.mount(bar.querySelector('.jr-mini'), { vary: true, bg: 1, zoom: 1.2, dof: 0, white: .3 }); } catch (e) { mini = { focus() {} }; bar.classList.add('jr-nomini'); } mini.focus(sel); all('.jr-chips', bar).forEach(fades); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    const go = () => { if (!window.Prism3D) { flat(); return; } try { api = window.Prism3D.mount(rv.querySelector('.jr-gl'), { vary: true, bg: 1, interact: { light: 1 } }); } catch (e) { flat(); return; } api.focus(sel);
      requestAnimationFrame(() => { place(); requestAnimationFrame(tick); }); new ResizeObserver(() => requestAnimationFrame(place)).observe(rv); onScroll(); glide(); spy(); };
    glide();
    if (window.Prism3D) go(); else { const s = document.createElement('script'); s.src = rv.dataset.src; s.onload = go; s.onerror = flat; document.head.appendChild(s); }
  }
  initBookHint() {
    /* the small turning book in front of "Drag to turn the book" (see the CSS) */
    const h = document.querySelector('.kbhint'); if (!h || h.querySelector('.kb-ic')) return;
    const ic = document.createElement('span'); ic.className = 'kb-ic'; ic.setAttribute('aria-hidden', 'true'); ic.appendChild(document.createElement('i'));
    h.prepend(ic);
  }
  initSharpen() {
    /* the blur theme for the parts that otherwise just sit there: section headings and the book title sharpen word by word,
       the book comes into focus, the copy beside it and the list below fade up out of a blur; once, as each comes into view (see the CSS) */
    if (!('IntersectionObserver' in window)) return;
    const words = [...document.querySelectorAll('.h2-display')];
    /* the book segment (the book and its copy) comes in as one: a single blur reveal, not piece by piece */
    const blocks = [document.querySelector('#releases .book-row')].filter(Boolean); blocks.forEach((e) => e.classList.add('sh-block'));
    const book = null;
    words.forEach((h) => { let i = 0;
      [...h.childNodes].forEach((x) => { if (x.nodeType === 3) { const f = document.createDocumentFragment();
          x.textContent.split(/(\s+)/).forEach((t) => { if (!t) return; if (/^\s+$/.test(t)) f.appendChild(document.createTextNode(t));
            else { const s = document.createElement('span'); s.className = 'shw'; s.style.setProperty('--i', i++); s.textContent = t; f.appendChild(s); } });
          x.replaceWith(f); } else if (x.nodeType === 1) { x.classList.add('shw'); x.style.setProperty('--i', i++); } });
      h.classList.add('sh-words'); });
    document.documentElement.classList.add('sh-js');
    const els = [...words, ...blocks, book].filter(Boolean);
    /* the design canvas shows boards as still pictures: show everything there */
    if (!this.__site) { els.forEach((e) => e.classList.add('sh-on')); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('sh-on'); io.unobserve(e.target); } }), { threshold: .3, rootMargin: '0px 0px -8% 0px' });
    els.forEach((e) => io.observe(e));
    /* the rows of the list below the book come in one by one as each enters the screen, early and quickly, so nothing
       appears under a resting cursor; once in, they drop the effect so the hover focus pull reacts at once */
    const rows = [...document.querySelectorAll('#releases .rA')];
    rows.forEach((r, i) => { r.classList.add('sh-block', 'sh-row'); r.style.setProperty('--d', (i % 4) * 0.07 + 's');
      r.addEventListener('transitionend', (e) => { if (e.propertyName === 'transform' && r.classList.contains('sh-on')) { r.classList.remove('sh-block', 'sh-row', 'sh-on'); r.style.removeProperty('--d'); } }); });
    const io2 = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('sh-on'); io2.unobserve(e.target); } }), { threshold: 0, rootMargin: '0px 0px -4% 0px' });
    rows.forEach((r) => io2.observe(r));
  }
  initRowFill() {
    /* Off my desk: one ink shape for the whole list. Entering the list it grows out of the cursor exactly like the pill
       buttons (a circle sized to the farthest corner, scaled up from the cursor); moving to another row it flows there
       like a drop of ink, stretching across both rows and settling into the new one; leaving the list it shrinks back
       into the point where the cursor left, again like the buttons.
       The same happens when the rows slide under a resting cursor while the page scrolls (trackpads): the row under the
       cursor is checked once per frame, and each new flow starts from wherever the ink is at that moment, so quick
       changes chain into one smooth movement instead of jumping. */
    const list = document.querySelector('.rlA'); if (!list) return;
    const rows = [...list.querySelectorAll('.rA')];
    const ink = document.createElement('span'), dot = document.createElement('i');
    ink.className = 'rlA-ink'; ink.setAttribute('aria-hidden', 'true'); ink.appendChild(dot); list.prepend(ink); list.classList.add('ink-js');
    const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    let cur = null, move = null, px = null, py = null, raf = 0, mouse = false;
    const box = (row) => ({ t: row.offsetTop, h: row.offsetHeight });
    const set = (b) => { ink.style.top = b.t + 'px'; ink.style.height = b.h + 'px'; };
    const mark = (row) => { rows.forEach((x) => x.classList.toggle('is-ink', x === row)); list.classList.toggle('has-ink', !!row); };
    /* the circle: centred on the pointer, its diameter reaching the farthest corner of the ink box */
    const place = (e) => { const r = ink.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      const d = 2 * Math.ceil(Math.hypot(Math.max(x, r.width - x), Math.max(y, r.height - y))) + 4;
      dot.style.left = x.toFixed(1) + 'px'; dot.style.top = y.toFixed(1) + 'px'; dot.style.width = dot.style.height = d + 'px'; dot.style.margin = (-d / 2) + 'px 0 0 ' + (-d / 2) + 'px'; };
    dot.addEventListener('transitionend', () => { if (dot.classList.contains('in')) { if (cur) ink.classList.add('full'); } else if (!cur) ink.classList.remove('on'); });
    const go = (row, e) => {
      const b = box(row); mark(row);
      if (!cur) { move && move.cancel(); set(b); cur = b; ink.classList.add('on'); if (reduce) { ink.classList.add('full'); return; }
        place(e); dot.classList.add('now'); dot.classList.remove('in'); ink.classList.remove('full');
        void dot.offsetWidth; dot.classList.remove('now'); dot.classList.add('in'); return; }
      if (b.t === cur.t) return;
      /* start from where the ink is right now (it may still be flowing), not from the last row */
      const cs = getComputedStyle(ink), a = { t: parseFloat(cs.top), h: parseFloat(cs.height) }, r0 = cs.borderTopLeftRadius;
      cur = b; ink.classList.add('full'); move && move.cancel(); set(b); if (reduce) return;   /* while it flows, the whole box is ink */
      const top = Math.min(a.t, b.t), bottom = Math.max(a.t + a.h, b.t + b.h);
      move = ink.animate([
        { top: a.t + 'px', height: a.h + 'px', borderRadius: r0, transform: 'scaleX(1)' },
        { top: top + 'px', height: (bottom - top) + 'px', borderRadius: '34px', transform: 'scaleX(.985)', offset: .42 },
        { top: b.t + 'px', height: b.h + 'px', borderRadius: '0px', transform: 'scaleX(1)' }
      ], { duration: 720, easing: 'cubic-bezier(.45,0,.25,1)' });
    };
    const leave = (e) => { if (!cur) return; cur = null; mark(null); move && move.cancel();
      if (reduce || !e) { ink.classList.remove('on'); setTimeout(() => { if (!cur) { ink.classList.remove('full'); dot.classList.remove('in'); } }, 220); return; }
      /* hand over from the full box to a full circle at the exit point, then shrink it there */
      place(e); dot.classList.add('now', 'in'); ink.classList.remove('full'); void dot.offsetWidth; dot.classList.remove('now'); dot.classList.remove('in'); };
    /* the row under the cursor decides, whether the cursor moved or the page scrolled under it */
    const check = () => { raf = 0; if (!mouse || px === null) return;
      const el = document.elementFromPoint(px, py), row = el && el.closest ? el.closest('.rA') : null;
      if (row && list.contains(row) && !row.classList.contains('sh-block')) go(row, { clientX: px, clientY: py });
      else if (cur) leave({ clientX: px, clientY: py }); };
    const queue = () => { if (!raf) raf = requestAnimationFrame(check); };
    document.addEventListener('pointermove', (e) => { mouse = e.pointerType === 'mouse'; px = e.clientX; py = e.clientY; queue(); }, { passive: true });
    window.addEventListener('scroll', queue, { passive: true });
    document.addEventListener('pointerleave', () => { px = null; if (cur) leave(null); });
    rows.forEach((row) => row.addEventListener('focus', () => { const r = row.getBoundingClientRect(); go(row, { clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 }); }));
    list.addEventListener('focusout', (e) => { if (!list.contains(e.relatedTarget) && !list.matches(':hover')) leave(null); });
  }



  initTalks() {
    /* talk topics: four panels, one open at a time. A click, the keyboard, or resting the pointer for 0.75 s opens one;
       ink spreads from the pointer, the title hands over to the headline and its words rise one by one */
    const list = document.querySelector('#talks .tpanels'); if (!list || !window.matchMedia) return;
    const ps = [...list.querySelectorAll('.tpan')], wide = () => matchMedia('(min-width:761px)').matches;
    list.classList.add('tp-js');
    let cur = -1, dwell = 0;
    ps.forEach((c) => { const h = c.querySelector('.tpan-head'); let i = 0;
      if (h) { const f = document.createDocumentFragment();
        h.textContent.split(/(\s+)/).forEach((t) => { if (!t) return; if (/^\s+$/.test(t)) f.appendChild(document.createTextNode(t));
          else { const s = document.createElement('span'); s.className = 'w'; s.style.setProperty('--i', i++); s.textContent = t; f.appendChild(s); } });
        h.textContent = ''; h.appendChild(f); }
      const dot = document.createElement('span'); dot.className = 'pdot'; dot.setAttribute('aria-hidden', 'true'); c.prepend(dot);
      c.addEventListener('pointermove', (e) => { if (c.classList.contains('act')) return; const r = c.getBoundingClientRect();
        c.style.setProperty('--x', (e.clientX - r.left) + 'px'); c.style.setProperty('--y', (e.clientY - r.top) + 'px'); }); });
    const set = (i) => { if (i === cur) return; cur = i;
      ps.forEach((c, k) => { c.classList.toggle('act', k === i); c.setAttribute('aria-expanded', String(k === i)); });
      if (!wide()) ps.forEach((c, k) => c.style.setProperty('--h', k === i ? (c.querySelector('.tpan-body').scrollHeight + 'px') : '')); };
    /* desktop: the open panel's text gets a fixed width (no reflow while it opens) and the row fits the longest text */
    const size = () => { if (!wide()) { list.style.removeProperty('--ph'); const k = cur; cur = -1; set(k < 0 ? 0 : k); return; }
      const bw = Math.max(300, list.clientWidth - (ps.length - 1) * (64 + 10) - 76); list.style.setProperty('--bw', bw + 'px');
      let mx = 0; ps.forEach((c) => { mx = Math.max(mx, c.querySelector('.tpan-body').scrollHeight); });
      list.style.setProperty('--ph', Math.max(mx + 72, 420) + 'px');
      /* the ink circle is big enough to cover the opened panel from any starting point */
      list.style.setProperty('--fd', Math.ceil(2 * Math.hypot(bw + 80, Math.max(mx + 72, 420))) + 'px'); };
    ps.forEach((c, i) => {
      c.addEventListener('click', (e) => { if (e.target.closest('a')) return; set(i); });
      c.addEventListener('keydown', (e) => { if (e.target !== c) return;
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); set(i); }
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); ps[(i + 1) % ps.length].focus(); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); ps[(i - 1 + ps.length) % ps.length].focus(); } });
      c.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'mouse' || !wide()) return; clearTimeout(dwell); dwell = setTimeout(() => set(i), 750); });
      c.addEventListener('pointerleave', () => clearTimeout(dwell)); });
    set(0); size(); window.addEventListener('resize', size); document.fonts && document.fonts.ready.then(size);
  }
  plain(w) { return Array.from(w).map((t) => ({ t, cls: '' })); }
  glyph() { return this.pool[Math.floor(Math.random() * this.pool.length)]; }
  noise(w) { return Array.from(w).map(() => ({ t: this.glyph(), cls: 'gl' })); }
  build() {
    /* the line resolves letter by letter out of frosted-glass symbols: each new letter lands blurred and sharpens
       over six quick steps (classes b6 … b1), then "approving." gets struck through */
    const [n1, n2] = this.line, STEP = 130, SWAP = 190, IN = STEP * Math.max(n1.length, n2.length), END = IN + STEP * 3, t0 = performance.now(); let last = 0;
    const mk = (n, t) => { const per = IN / n.length;
      return Array.from(n).map((ch, i) => { const age = t - (i + 1) * per;
        /* a symbol holds for SWAP ms before it changes, so the line flickers calmly instead of boiling */
        if (age < 0) { const h = Math.imul(i + 1 + n.length * 31, 2654435761) ^ Math.imul(Math.floor(t / SWAP) + 1, 40503); return { t: this.pool[(h >>> 0) % this.pool.length], cls: 'gl' }; }
        const k = Math.floor(age / (STEP / 2)); return { t: ch, cls: k < 6 ? 'lt b' + (6 - k) : '' }; }); };
    const step = (now) => {
      const t = now - t0;
      /* the strike starts while the last letters of "approving." are still landing, so the brush sweeps in as the word forms */
      if (!this.state.struck && t >= IN - STEP * 2) this.setState({ struck: true });
      if (t >= END) { this.setState({ c1: this.plain(n1), c2: this.plain(n2) }); return; }
      if (now - last >= 40) { last = now; this.setState({ c1: mk(n1, t), c2: mk(n2, t) }); }
      this.hlRaf = requestAnimationFrame(step);
    };
    this.hlRaf = requestAnimationFrame(step);
  }
  railUpdate() {
    if (this.belEl) { const vh0 = window.innerHeight || 800; this.belEl.querySelectorAll('.bdel').forEach((d) => { const b = d.getBoundingClientRect(); if (b.top < vh0 * 0.78 && b.bottom > 0) d.classList.add('on'); else if (b.top > vh0) d.classList.remove('on'); }); } const el = this.pathEl; if (!el) return; const r = el.getBoundingClientRect(); const vh = window.innerHeight || 800;
    const p = Math.max(0, Math.min(1, (vh * 0.45 - r.top) / Math.max(1, r.height - vh * 0.35)));
    el.style.setProperty('--p', p.toFixed(4));
    const inView = r.top < vh * 0.6 && r.bottom > vh * 0.4; el.classList.toggle('tracking', inView);
    const focus = vh * 0.62, span = vh * 0.26;   /* the reading line: a group comes into focus once its top passes 62% of the screen */
    /* a group is in focus anywhere in the reading band, from just below the header down to the reading line, so text
       read near the top of the screen stays sharp; it only goes soft once it has left the band */
    const band = vh * 0.12;
    el.querySelectorAll('.pgrp').forEach((g) => { const b = g.getBoundingClientRect();
      const d = b.bottom >= band && b.top <= focus ? 0 : (b.bottom < band ? band - b.bottom : b.top - focus);
      const floor = b.bottom < band ? 0.68 : 0.4; const k = Math.min(1, d / span); const e = k * k * (3 - 2 * k);
      g.style.setProperty('--go', inView ? (1 - (1 - floor) * e).toFixed(3) : '1'); });
    const near = vh * 0.2;
    el.querySelectorAll('.prow').forEach((row) => { const b = row.getBoundingClientRect(); const c = b.top + b.height / 2; const d = Math.abs(c - focus);
      let k = Math.max(0, 1 - d / near); k = k * k * (3 - 2 * k);
      const fill = c < focus ? 1 : k;
      row.style.setProperty('--rc', (inView || r.top < focus ? k : 0).toFixed(3)); row.style.setProperty('--rf', (r.top < focus ? fill : 0).toFixed(3)); });
    this.curCheck(); }
  curCheck() { const C = this.cur, el = this.pathEl; if (!C.el || !el) return;
    const r = el.getBoundingClientRect(); const inside = !this.fxStill() && C.tx >= r.left && C.tx <= r.right && C.ty >= r.top && C.ty <= r.bottom;
    if (inside !== C.inside) { C.inside = inside; C.el.classList.toggle('show', inside); if (inside) C.snap = true; }
    if (!C.raf) C.raf = requestAnimationFrame(() => this.curTick()); }
  curTick() { const C = this.cur, el = this.pathEl; C.raf = 0; if (!C.el || !el) return;
    const r = el.getBoundingClientRect(); const sc = (el.offsetWidth ? r.width / el.offsetWidth : 1) || 1;
    const lx = (C.tx - r.left) / sc, ly = (C.ty - r.top) / sc;
    if (C.snap) { C.x = lx; C.y = ly; C.snap = false; }
    C.x += (lx - C.x) * 0.22; C.y += (ly - C.y) * 0.22;
    C.el.style.transform = 'translate(' + C.x.toFixed(1) + 'px,' + C.y.toFixed(1) + 'px)';
    if (C.inside && (Math.abs(lx - C.x) > 0.3 || Math.abs(ly - C.y) > 0.3)) C.raf = requestAnimationFrame(() => this.curTick()); }
  fxFrame() { this.fxPF = 0; const P0 = this.fxPtr; if (!P0 || !this.fxFar) return; const still = this.fxStill();
    this.fxFar.forEach((G) => { if (!G.el.isConnected) return; const r = G.el.getBoundingClientRect(); const t = getComputedStyle(G.el).translate;
      const m = t && t !== 'none' ? t.split(' ').map(parseFloat) : [0, 0];
      const cx = r.left + r.width / 2 - (m[0] || 0), cy = r.top + r.height / 2 - (m[1] || 0);
      const dx = P0.x - cx, dy = P0.y - cy; const R = Math.max(r.width, r.height) / 2 + (G.mR || 220);
      let p = still ? 0 : Math.max(0, 1 - Math.hypot(dx, dy) / R); p = p * p * (3 - 2 * p);
      const tx = dx * (G.mX || 0.38) * p, ty = dy * (G.mY || 0.5) * p; G.el.style.translate = tx.toFixed(1) + 'px ' + ty.toFixed(1) + 'px'; if (G.fol) G.fol.style.translate = (tx * G.folK).toFixed(1) + 'px ' + (ty * G.folK).toFixed(1) + 'px'; }); }
  fxStill() { return (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  fxAttach(el) {
    if (!el || el.__fx) return;
    const kind = el.getAttribute('data-fx') || 'ink';
    const P = { mag: { mag: 0.55 }, magfar: { far: 1 }, big: { fill: Component.cssVar('--accent-rgb', '242,96,12'), from: Component.cssVar('--paper-rgb', '238,235,229'), to: Component.cssVar('--paper-rgb', '238,235,229'), mag: 0 }, link: {}, nav: {} }[kind] || {};
    const F = { el, kind, P, h: 0, hv: 0, ht: 0, s: 1, vs: 0, ts: 1, ox: 0.5, oy: 0.5, raf: 0, last: 0 };
    el.__fx = F;
    F.blob = el.querySelector(':scope > .fxb'); F.sheen = el.querySelector(':scope > .fxs'); F.line = el.querySelector(':scope > .fxl'); F.arrow = el.querySelector('[data-fx-arrow]');
    if (F.blob) F.blob.style.background = 'rgb(' + P.fill + ')';
    if (F.blob) { el.style.transition = 'translate .9s cubic-bezier(.22,1,.36,1)'; }
    if (kind === 'mag' || kind === 'magfar') F.arrow = null;
    if (kind === 'magfar') { F.mR = 220; F.mX = 0.38; F.mY = 0.5; const fk = parseFloat(el.getAttribute('data-fx-k')); if (fk > 0) { F.mX *= fk; F.mY *= fk; } const fr = parseFloat(el.getAttribute('data-fx-r')); if (fr > 0) F.mR = fr; const ft = parseFloat(el.getAttribute('data-fx-t')); if (ft > 0) el.style.transition = 'translate ' + ft + 's cubic-bezier(.22,1,.36,1), transform .6s cubic-bezier(.3,1.6,.5,1)'; const fw = el.parentElement && el.parentElement.querySelector(':scope > [data-fx-follow]'); if (fw) { F.fol = fw; F.folK = parseFloat(fw.getAttribute('data-fx-follow')) || 0.7; fw.style.transition = 'translate ' + ((ft > 0 ? ft : .7) + .25) + 's cubic-bezier(.22,1,.36,1)'; fw.style.display = 'inline-block'; } (this.fxFar = this.fxFar || []).push(F); el.style.transition = 'translate .7s cubic-bezier(.22,1,.36,1), color .5s cubic-bezier(.22,1,.36,1), transform .6s cubic-bezier(.3,1.6,.5,1)'; }
    const loc = (e) => { const r = el.getBoundingClientRect(); return [(e.clientX - r.left) / (r.width || 1), (e.clientY - r.top) / (r.height || 1)]; };
    el.addEventListener('pointerenter', (e) => { const [x, y] = loc(e); F.ox = x; F.oy = y; F.ht = 1; F.sheenT = performance.now(); this.fxKick(F); });
    if (P.mag) { F.mR = 70; F.mX = 0.2; F.mY = 0.28; (this.fxFar = this.fxFar || []).push(F); }
    el.addEventListener('pointerleave', (e) => { const [x, y] = loc(e); F.ox = x; F.oy = y; F.ht = 0; F.ts = 1; this.fxKick(F); });
    el.addEventListener('pointerdown', (e) => { F.ts = 0.94; if (e.pointerType !== 'mouse') { const [x, y] = loc(e); F.ox = x; F.oy = y; F.ht = 1; F.sheenT = performance.now(); } this.fxKick(F); });
    const up = (e) => { F.ts = 1; F.vs += 1.2; if (e && e.pointerType && e.pointerType !== 'mouse') setTimeout(() => { F.ht = 0; this.fxKick(F); }, 380); this.fxKick(F); };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
    el.addEventListener('focus', () => { F.ox = 0.5; F.oy = 0.5; F.ht = 1; this.fxKick(F); });
    el.addEventListener('blur', () => { F.ht = 0; this.fxKick(F); });
  }
  fxKick(F) { if (!F.raf) { F.last = performance.now(); F.raf = requestAnimationFrame((n) => this.fxStep(F, n)); } }
  fxStep(F, now) {
    F.raf = 0; if (!F.el.isConnected) return;
    const dt = Math.min(0.033, Math.max(0.001, (now - F.last) / 1000)); F.last = now;
    const still = this.fxStill();
    const spring = (k, t, v, K, D) => { const a = K * (t - F[k]) - D * F[v]; F[v] += a * dt; F[k] += F[v] * dt; };
    if (still) { F.h = F.ht; F.s = 1; } else { if (F.kind === 'big') spring('h', F.ht, 'hv', F.ht > F.h ? 30 : 44, 9.5); else spring('h', F.ht, 'hv', F.ht > F.h ? 90 : 120, 15); if (F.kind !== 'big') spring('s', F.ts, 'vs', 520, 18); }
    const h = Math.max(0, Math.min(1.08, F.h));
    const el = F.el, W = el.offsetWidth, H = el.offsetHeight;
    if (F.kind !== 'big' && F.kind !== 'nav' && F.kind !== 'link') el.style.scale = F.s.toFixed(4);
    if (F.kind === 'big') {
      const bx = F.ox * W, by = F.oy * H; const far = Math.hypot(Math.max(bx, W - bx), Math.max(by, H - by));
      const wob = still ? 1 : 1 + 0.05 * Math.sin(now / 110) * (1 - Math.min(1, h));
      el.style.setProperty('--bx', bx.toFixed(1) + 'px'); el.style.setProperty('--by', by.toFixed(1) + 'px');
      el.style.setProperty('--br', (far * 1.08 * Math.min(1, h) * wob).toFixed(1) + 'px');
    }
    if (F.blob) {
      const bx = F.ox * W, by = F.oy * H; const far = Math.hypot(Math.max(bx, W - bx), Math.max(by, H - by));
      const sc = (far * 2.5 / 10) * Math.min(1, h);
      const wob = still ? 1 : 1 + 0.06 * Math.sin(now / 90) * (1 - Math.min(1, h));
      F.blob.style.transform = 'translate(' + bx.toFixed(1) + 'px,' + by.toFixed(1) + 'px) scale(' + (sc * wob).toFixed(3) + ',' + (sc / wob).toFixed(3) + ')';
      const m = (a, b) => a.split(',').map((v, i) => Math.round(+v + (+b.split(',')[i] - +v) * Math.min(1, h))).join(',');
      el.style.color = 'rgb(' + m(F.P.from, F.P.to) + ')';
    }
    if (F.sheen) {
      const t = F.sheenT ? (now - F.sheenT) / 700 : 2;
      const on = t < 1 && !still; F.sheen.style.opacity = on ? (Math.sin(Math.PI * t) * 0.9).toFixed(3) : '0';
      F.sheen.style.transform = 'translateX(' + (-120 + 420 * Math.min(1, t)).toFixed(1) + '%) skewX(-18deg)';
    }
    if (F.line) F.line.style.transform = 'scaleX(' + Math.min(1, h).toFixed(3) + ')';
    if (F.arrow) { F.arrow.style.display = 'inline-block'; const amp = F.kind === 'big' ? 22 : 5; const ax = amp * h + (still ? 0 : Math.sin(now / 160) * 1.2 * Math.min(1, h)); F.arrow.style.transform = 'translateX(' + ax.toFixed(2) + 'px)'; }
    const moving = (F.kind === 'big' && F.h > 0.002 && F.h < 0.998) || Math.abs(F.ht - F.h) > 0.002 || Math.abs(F.hv) > 0.01 || Math.abs(F.ts - F.s) > 0.001 || Math.abs(F.vs) > 0.01 || (F.sheenT && now - F.sheenT < 720) || (F.arrow && F.h > 0.01);
    if (moving && !still) F.raf = requestAnimationFrame((n) => this.fxStep(F, n));
  }
  bKick() { if (!this.bk.raf) this.bk.raf = requestAnimationFrame(() => this.bTick()); }
  bRender() { const B = this.bk, el = B.book; if (!el) return; const c = B.cur;
    el.style.setProperty('--ry', c.ry.toFixed(2) + 'deg'); el.style.setProperty('--rx', c.rx.toFixed(2) + 'deg'); el.style.setProperty('--lift', c.lift.toFixed(1) + 'px');
    const Lr = -10 * Math.PI / 180, a = c.ry * Math.PI / 180;
    const sh = (off) => (0.34 * (1 - Math.max(-1, Math.min(1, Math.cos(a + off * Math.PI / 180 - Lr))))).toFixed(3);
    el.style.setProperty('--sh-front', sh(0)); el.style.setProperty('--sh-spine', sh(-90)); el.style.setProperty('--sh-fore', sh(90)); el.style.setProperty('--sh-back', sh(180));
    const rel = ((c.ry - 26) % 360 + 540) % 360 - 180;
    el.style.setProperty('--sheen', Math.max(-40, Math.min(110, 30 + rel * 1.4)).toFixed(1) + '%');
    if (B.shadow) { const l = c.lift / 28; B.shadow.style.setProperty('--ss', (1 + l * 0.12).toFixed(3)); B.shadow.style.setProperty('--so', (0.85 - l * 0.3).toFixed(3)); B.shadow.style.setProperty('--sx', (-Math.max(-60, Math.min(60, rel)) * 0.5).toFixed(1) + 'px'); } }
  bReturn() { const B = this.bk; clearTimeout(B.rt);
    B.rt = setTimeout(() => { B.turn = 360 * Math.round((B.cur.ry - 26) / 360); B.tgt.ry = 26 + B.turn; B.tgt.rx = 4; B.tgt.lift = 0; B.mode = 'idle'; this.bKick(); }, 2600); }
  bTick() { const B = this.bk; B.raf = 0;
    if (B.mode === 'inertia') { B.tgt.ry += B.vel; B.vel *= 0.94; if (Math.abs(B.vel) < 0.05) { B.mode = 'rest'; this.bReturn(); } }
    const k = (B.mode === 'drag' || B.mode === 'inertia') ? 0.35 : 0.09; let moving = false;
    for (const key in B.tgt) { B.cur[key] += (B.tgt[key] - B.cur[key]) * k; if (Math.abs(B.tgt[key] - B.cur[key]) > 0.01) moving = true; }
    this.bRender();
    if (moving || B.mode === 'inertia') B.raf = requestAnimationFrame(() => this.bTick()); }
  renderVals() {
    return {
      c1: this.state.c1, c2: this.state.c2, hdelCls: this.state.struck ? 'hdel on' : 'hdel', setPath: this.setPath, setCur: this.setCur, setTop: this.setTop, setBelief: this.setBelief,
      fxRef: this.fxRef,
      setStage: this.setStage, setBook3: this.setBook3, setBShadow: this.setBShadow, bDown: this.bDown, bMove: this.bMove, bUp: this.bUp, bKey: this.bKey
    };
  }

  initPhotoTrail() {
    /* Street Photography side quest: hovering the entry shows a photo beside the cursor. It trails the pointer and
       moves like a flag in a light breeze (WebGL wave shader). Every 2 s a wave rolls across the photo and the next
       picture is revealed behind the wave front, while the frame eases to the new picture's proportions.
       Desktop with a fine pointer only. Without WebGL (or if a texture cannot be read) a plain image follows instead. */
    const el = document.querySelector('.side-photo[data-photos]');
    if (!el || !window.matchMedia || !window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    const srcs = el.getAttribute('data-photos').split(',').map((s) => s.trim()).filter(Boolean);
    if (!srcs.length) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const MAXW = 340, MAXH = 300, PAD = 24, GAP = 30, HOLD = 2000, SWEEP = 1300;
    const CW = MAXW + PAD * 2, CH = MAXH + PAD * 2;
    const shots = srcs.map((s) => ({ s, img: new Image(), ok: false, tex: null, w: 0, h: 0 }));
    let requested = false;
    const ready = (o) => { if (!o.ok && o.img.complete && o.img.naturalWidth) o.ok = true; if (o.ok && !o.w) { const ar = o.img.naturalWidth / o.img.naturalHeight; o.w = Math.round(Math.min(MAXW, MAXH * ar)); o.h = Math.round(o.w / ar); } return o.ok; };
    const preload = () => { if (requested) return; requested = true; shots.forEach((o) => { o.img.decoding = 'async'; o.img.src = o.s; }); };
    if ('IntersectionObserver' in window) { const io = new IntersectionObserver((es) => { if (es[0].isIntersecting) { preload(); io.disconnect(); } }, { rootMargin: '600px 0px' }); io.observe(el); } else preload();

    const cv = document.createElement('canvas'); cv.className = 'photo-trail'; cv.setAttribute('aria-hidden', 'true');
    let gl = null; try { gl = cv.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: true }); } catch (e) { gl = null; }
    let flat = null;
    const useFlat = () => { if (flat) return; gl = null; cv.remove(); flat = document.createElement('img'); flat.className = 'photo-trail'; flat.alt = ''; flat.setAttribute('aria-hidden', 'true'); document.body.appendChild(flat); };

    const loc = {};
    if (gl) {
      document.body.appendChild(cv);
      const dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.round(CW * dpr); cv.height = Math.round(CH * dpr); cv.style.width = CW + 'px'; cv.style.height = CH + 'px';
      const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
      const vs = 'attribute vec2 p; varying vec2 v; void main(){ v = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }';
      const fs = [
        'precision mediump float;',
        'varying vec2 v; uniform sampler2D t0, t1; uniform vec4 rect; uniform vec2 c0, c1, bend; uniform float tm, amp, a, p, sweep;',
        'void main(){',
        '  vec2 uv = (v - rect.xy) / (rect.zw - rect.xy);',
        /* a flag: ripples travel along the width and grow towards the free edge */
        '  float lift = 0.35 + 0.65 * uv.x;',
        '  uv.y += sin(uv.x * 4.2 - tm * 2.0) * 0.02 * amp * lift + bend.y * sin(uv.x * 3.14159);',
        '  uv.x += sin(uv.y * 3.4 + tm * 1.5) * 0.008 * amp + bend.x * sin(uv.y * 3.14159);',
        /* the switch: one broad wave rolls across, the next photo appears behind its crest */
        '  float f = mix(-0.35, 1.35, p); float d = uv.x - f;',
        '  float crest = exp(-d * d / 0.045) * sweep;',
        '  float ph = uv.x * 7.0 - p * 9.0;',
        '  uv.y += sin(ph) * 0.045 * crest; uv.x -= 0.025 * crest;',
        '  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) discard;',
        '  float m = smoothstep(0.16, -0.16, d);',
        '  vec3 A = texture2D(t0, (uv - 0.5) * c0 + 0.5).rgb, B = texture2D(t1, (uv - 0.5) * c1 + 0.5).rgb;',
        '  vec3 col = mix(A, B, m) * (1.0 + 0.09 * crest * cos(ph));',
        '  gl_FragColor = vec4(col * a, a);',
        '}'].join('\n');
      const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) useFlat();
      else {
        gl.useProgram(prog);
        const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
        const ap = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(ap); gl.vertexAttribPointer(ap, 2, gl.FLOAT, false, 0, 0);
        ['t0', 't1', 'rect', 'c0', 'c1', 'bend', 'tm', 'amp', 'a', 'p', 'sweep'].forEach((k) => { loc[k] = gl.getUniformLocation(prog, k); });
        gl.uniform1i(loc.t0, 0); gl.uniform1i(loc.t1, 1);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); gl.clearColor(0, 0, 0, 0); gl.viewport(0, 0, cv.width, cv.height);
      }
    } else useFlat();

    const texOf = (o) => {
      if (o.tex) return o.tex;
      const tx = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tx);
      [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T].forEach((k) => gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, o.img); /* throws if the image cannot be read */
      o.tex = tx; return tx;
    };
    const bindPair = (A, B) => {
      try { gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texOf(A)); gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texOf(B)); return true; }
      catch (e) { useFlat(); return false; }
    };
    const cover = (o, w, h) => { const A = o.w / o.h, B = w / h; return A > B ? [B / A, 1] : [1, A / B]; };
    const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

    let idx = -1, nxt = -1, on = false, x = 0, y = 0, px = 0, py = 0, show = 0, raf = 0, side = 1, holdAt = 0, sweepAt = 0;
    const t0 = performance.now();
    const frame = (now) => {
      raf = 0;
      const cur = idx >= 0 ? shots[idx] : null; if (cur) ready(cur);
      /* schedule the next photo */
      if (on && cur && cur.ok && nxt < 0 && shots.length > 1 && now - holdAt > HOLD) { const n = (idx + 1) % shots.length; if (ready(shots[n])) { nxt = n; sweepAt = now; } }
      let p = 0;
      if (nxt >= 0) { p = Math.min(1, (now - sweepAt) / (reduce ? 500 : SWEEP)); if (p >= 1) { idx = nxt; nxt = -1; p = 0; holdAt = now; } }
      const A = shots[idx], B = nxt >= 0 ? shots[nxt] : A, e = ease(p);
      const k = reduce ? 1 : 0.16, dx = x - px, dy = y - py; px += dx * k; py += dy * k;
      show += ((on && A && A.ok ? 1 : 0) - show) * (reduce ? 1 : (on ? 0.14 : 0.2));
      if (on) side = (px + GAP + MAXW > window.innerWidth - 12) ? -1 : (px - GAP - MAXW < 12 ? 1 : side);
      if (A && A.ok) {
        const w = A.w + (B.w - A.w) * e, h = A.h + (B.h - A.h) * e;
        if (flat) {
          const want = p > 0.5 ? B : A; if (flat.dataset.s !== want.s) { flat.src = want.s; flat.dataset.s = want.s; }
          flat.style.width = w + 'px'; flat.style.height = h + 'px';
          const l = side > 0 ? px + GAP : px - GAP - w;
          flat.style.transform = 'translate3d(' + l.toFixed(1) + 'px,' + (py - h / 2).toFixed(1) + 'px,0) scale(' + (0.92 + 0.08 * show).toFixed(4) + ')'; flat.style.opacity = show.toFixed(3);
        } else if (gl && bindPair(A, B)) {
          const l = side > 0 ? px + GAP - PAD : px - GAP - MAXW - PAD, tp = py - CH / 2;
          cv.style.transform = 'translate3d(' + l.toFixed(1) + 'px,' + tp.toFixed(1) + 'px,0) scale(' + (0.92 + 0.08 * show).toFixed(4) + ')';
          cv.style.transformOrigin = (side > 0 ? PAD : PAD + MAXW) + 'px 50%'; cv.style.opacity = show.toFixed(3);
          const x0 = side > 0 ? PAD : PAD + MAXW - w, y0 = PAD + (MAXH - h) / 2;
          const t = (now - t0) / 1000, speed = Math.min(1, Math.hypot(dx, dy) / 160);
          gl.clear(gl.COLOR_BUFFER_BIT);
          gl.uniform4f(loc.rect, x0 / CW, y0 / CH, (x0 + w) / CW, (y0 + h) / CH);
          const c0 = cover(A, w, h), c1 = cover(B, w, h); gl.uniform2f(loc.c0, c0[0], c0[1]); gl.uniform2f(loc.c1, c1[0], c1[1]);
          gl.uniform1f(loc.tm, reduce ? 0 : t); gl.uniform1f(loc.amp, reduce ? 0 : 0.45 + speed * 1.4 + (1 - show) * 1.2); gl.uniform1f(loc.a, show);
          gl.uniform1f(loc.p, nxt >= 0 ? e : 0); gl.uniform1f(loc.sweep, reduce ? 0 : Math.sin(Math.PI * e));
          gl.uniform2f(loc.bend, reduce ? 0 : Math.max(-0.05, Math.min(0.05, -dx / 2600)), reduce ? 0 : Math.max(-0.05, Math.min(0.05, dy / 2600)));
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
      }
      if (on || show > 0.005) raf = requestAnimationFrame(frame); else { show = 0; (flat || cv).style.opacity = '0'; }
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
    el.addEventListener('pointerenter', (e) => {
      if (e.pointerType && e.pointerType !== 'mouse') return;
      preload(); on = true; x = e.clientX; y = e.clientY;
      if (show < 0.05) { px = x; py = y; if (nxt >= 0) { idx = nxt; nxt = -1; } else idx = (idx + 1) % shots.length; holdAt = performance.now(); }
      kick();
    });
    el.addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; if (on) kick(); });
    el.addEventListener('pointerleave', () => { on = false; kick(); });
    window.addEventListener('scroll', () => { if (on) { const r = el.getBoundingClientRect(); if (y < r.top || y > r.bottom || x < r.left || x > r.right) { on = false; kick(); } } }, { passive: true });
  }

  initBtnFill() {
    /* pill buttons: the fill grows out of the point where the cursor enters and shrinks back into where it leaves,
       like the footer's Let's talk. Diameter covers the farthest corner from that point. */
    const place = (b, e) => {
      const r = b.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      const d = 2 * Math.ceil(Math.hypot(Math.max(x, r.width - x), Math.max(y, r.height - y))) + 4;
      b.style.setProperty('--fx', x.toFixed(1) + 'px'); b.style.setProperty('--fy', y.toFixed(1) + 'px'); b.style.setProperty('--fd', d + 'px');
    };
    document.querySelectorAll('.pbtn').forEach((b) => { b.addEventListener('pointerenter', (e) => place(b, e)); b.addEventListener('pointerleave', (e) => place(b, e)); });
  }
  initPortraitFit() {
    /* desktop and tablet: text on the left, the portrait card on the right, its foot level with the button.
       The card is 400px wherever there is room. On narrower screens the text column gives way first (down to
       MINCOPY), then the portrait shrinks a little (never below MINW). The intro text stays at 16px as its
       column narrows, which keeps the top of the head roughly level with the top of the text. Only when even that
       does not fit does the portrait move below the text (as on phones). */
    const top = this.topEl || document.getElementById('top'), fig = top && top.querySelector('.hp-cutb'), copy = top && top.querySelector('.hero-copy');
    const lead = copy && copy.querySelector('p');
    if (!fig || !copy || !lead || !window.matchMedia) return;
    const W0 = 400, MINW = 300, GAP = 40, MINCOPY = 340, MAXCOPY = 660, FMAX = 16, FMIN = 16;
    const reset = () => { fig.style.width = ''; copy.style.maxWidth = ''; lead.style.removeProperty('font-size'); };
    const fit = () => {
      top.classList.remove('hp-stack');
      if (!window.matchMedia('(min-width:761px)').matches) { reset(); return; }
      const cs = getComputedStyle(top), content = top.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
      let w = W0, c = Math.min(MAXCOPY, content - w - GAP);
      if (c < MINCOPY) { c = MINCOPY; w = content - GAP - c; }
      if (w < MINW) { reset(); top.classList.add('hp-stack'); return; }
      const k = Math.max(0, Math.min(1, (c - MINCOPY) / (MAXCOPY - 60 - MINCOPY)));   /* full size from 600px column */
      fig.style.width = w.toFixed(1) + 'px';
      copy.style.maxWidth = c.toFixed(1) + 'px';
      lead.style.setProperty('font-size', (FMIN + (FMAX - FMIN) * k).toFixed(2) + 'px', 'important');
    };
    fit();
    /* refit when the hero's width changes (window resize, or a resized board in the design canvas) */
    let lastW = top.clientWidth;
    if ('ResizeObserver' in window) new ResizeObserver(() => { if (top.clientWidth !== lastW) { lastW = top.clientWidth; fit(); } }).observe(top);
    window.addEventListener('resize', () => { lastW = top.clientWidth; fit(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  }
  initPortraitReveal() {
    /* the portrait's blur-in is a CSS animation that plays on load (site.css, hp-in). When the portrait starts below the
       screen (phones), that would play unseen: swap it for a reveal when it scrolls into view. Runs before the animation's
       delay ends, while the portrait is still hidden, so nothing that was shown is ever hidden again. */
    const fig = document.querySelector('.hp-cutb');
    if (!fig || !('IntersectionObserver' in window)) return;
    if (fig.getBoundingClientRect().top < window.innerHeight) return;
    fig.classList.add('hp-rv');
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { fig.classList.add('hp-in'); io.disconnect(); } }, { threshold: 0.3 });
    io.observe(fig);
  }
  initHeadFit() {
    /* desktop and tablet: the headline is sized so its last line, PROVING., is exactly as wide as the intro text below it.
       Measured on a hidden copy of the word, because the real line is built letter by letter while the headline animates.
       Refits whenever the intro text changes width (initPortraitFit narrows it on smaller screens). Phones keep the CSS size. */
    const top = document.getElementById('top'), hl = top && top.querySelector('.hl'), h1 = top && top.querySelector('.hl-h1'), lead = top && top.querySelector('.hero-lead');
    if (!hl || !h1 || !lead || !window.matchMedia) return;
    const mq = window.matchMedia('(min-width:761px)');
    const fit = () => {
      if (!mq.matches) { hl.style.removeProperty('font-size'); return; }
      const s = getComputedStyle(h1), m = document.createElement('span');
      m.textContent = 'proving.';
      m.style.cssText = 'position:absolute;left:-9999px;top:0;visibility:hidden;white-space:nowrap;font-size:100px;font-family:' + s.fontFamily
        + ';font-weight:' + s.fontWeight + ';font-stretch:' + s.fontStretch + ';text-transform:' + s.textTransform + ';letter-spacing:' + s.letterSpacing;
      document.body.appendChild(m);
      const k = m.getBoundingClientRect().width / 100;
      m.textContent = 'approving.';
      const ka = m.getBoundingClientRect().width / 100;
      m.remove();
      const w = lead.getBoundingClientRect().width;
      if (!(k > 0 && w > 0)) return;
      const fs = w / k;
      hl.style.fontSize = fs.toFixed(2) + 'px';
      /* the portrait card must not run into APPROVING. on narrower screens: if that line reaches over the card, the card
         shrinks (staying right-aligned, its foot level with the button) until its top sits below the line.
         Measured from the layout, not the animated letters, so it is right from the first frame. */
      const fig = top.querySelector('.hp-cutb'), line = h1.querySelector('span');
      if (!fig || !line || top.classList.contains('hp-stack')) return;
      const H = top.getBoundingClientRect(), cs = getComputedStyle(top), h1r = h1.getBoundingClientRect();
      const lineH = line.offsetHeight || fs * 0.86, appBottom = h1r.top + 2 * lineH, appRight = h1r.left + ka * fs;
      const right = H.right - (parseFloat(cs.paddingRight) || 0), foot = H.bottom - (parseFloat(cs.paddingBottom) || 0);
      const cw = parseFloat(fig.style.width) || fig.offsetWidth;
      if (right - cw < appRight + 24) {
        const ch = foot - appBottom - 28, nw = Math.max(240, Math.min(cw, ch * 0.8));
        fig.style.width = nw.toFixed(1) + 'px';
      }
    };
    fit();
    if ('ResizeObserver' in window) new ResizeObserver(fit).observe(lead);
    window.addEventListener('resize', fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  }
  initMenu() {
  const mb = document.querySelector('.menu-btn'), mn = document.getElementById('mnav');
  if (mb && mn) {
    /* the menu opens as a ball growing out of the menu button and closes by shrinking into the point you tapped,
       the same circular reveal as the footer's Let's talk fill. Origin and radius are set before the class changes so the circle never drifts. */
    const ball = mb.querySelector('.mb-icon') || mb;
    const origin = (x, y) => {
      if (x == null) { const r = ball.getBoundingClientRect(); x = r.left + r.width / 2; y = r.top + r.height / 2; }
      const w = window.innerWidth, h = window.innerHeight, rad = Math.ceil(Math.hypot(Math.max(x, w - x), Math.max(y, h - y))) + 2;
      mn.style.transition = 'none'; mn.style.setProperty('--mx', x + 'px'); mn.style.setProperty('--my', y + 'px'); mn.style.setProperty('--mr', rad + 'px');
      void mn.offsetWidth; mn.style.transition = '';
    };
    const set = (open, x, y) => {
      if (open === document.body.classList.contains('menu-open')) return;
      origin(open ? null : x, open ? null : y);
      document.body.classList.toggle('menu-open', open); mb.setAttribute('aria-expanded', String(open)); mn.setAttribute('aria-hidden', String(!open)); mb.querySelector('.mb-label').textContent = open ? 'Close' : 'Menu'; document.documentElement.classList.toggle('menu-lock', open); if (open) document.querySelector('.site-head').classList.remove('head-up');
    };
    mb.addEventListener('click', () => set(!document.body.classList.contains('menu-open')));
    /* any tap inside the open menu closes it, into the tapped point; links then navigate as usual */
    mn.addEventListener('click', (e) => set(false, e.detail ? e.clientX : null, e.detail ? e.clientY : null));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
  }
  /* the header: on screen through the hero; past it, it leaves while scrolling down and comes back on scroll up, then
     holds for half a screen before it can leave again (the motion itself is in the CSS, see .head-up) */
  const hd = document.querySelector('.site-head');
  if (hd) {
    const BACK = 6;                                                     /* px of scrolling up that bring it back */
    const hold = () => Math.max(320, window.innerHeight * .5);          /* px it stays after coming back */
    let ly = Math.max(0, window.scrollY), lo = ly, hi = -Infinity, busy = false;   /* lo: lowest point while hidden; hi: highest point while shown (-Infinity: no hold) */
    /* the glass blends from its clear top-of-page look into the chosen values over the first 360px of scrolling */
    const glass = () => { const k = Math.min(1, Math.max(0, window.scrollY / 360)); hd.style.setProperty('--hgm', (k * k * (3 - 2 * k)).toFixed(3)); };
    glass();
    const show = (y) => { hd.classList.remove('head-up'); hi = y; };
    const hide = (y) => { hd.classList.add('head-up'); lo = y; };
    window.addEventListener('scroll', () => {
      if (busy) return; busy = true;
      requestAnimationFrame(() => {
        busy = false; const y = Math.max(0, window.scrollY), d = y - ly; ly = y;
        if (document.body.classList.contains('menu-open')) return;
        if (document.documentElement.dataset.scrollFix) { delete document.documentElement.dataset.scrollFix; lo = y; hi = y; return; }   /* a jump the page made itself, not the reader */
        glass(); hd.classList.toggle('head-float', y > 2);           /* .head-float marks it floating over the page */
        /* above the journey (the first section after the hero) it is always there, with no hold pending */
        const path = document.getElementById('path');
        if (y < hd.offsetHeight || (path && path.getBoundingClientRect().top > hd.offsetHeight)) { hd.classList.remove('head-up'); hi = -Infinity; return; }
        /* while the journey's reading bar is out (the chapter text is being read) the header stays up, so the two never
           stack; above the river and everywhere else it comes and goes as usual */
        const jbar = document.querySelector('.jr-bar');
        if (jbar && jbar.classList.contains('on')) { if (!hd.classList.contains('head-up')) hide(y); else lo = Math.max(lo, y); return; }
        if (hd.classList.contains('head-up')) {
          lo = Math.max(lo, y);                                         /* measured from the lowest point, so slow scrolling up still counts */
          if (lo - y >= BACK) show(y);
        } else {
          hi = Math.min(hi, y);                                         /* scrolling up further while it is back resets the hold */
          if (d > 0 && y - hi >= hold()) hide(y);
        }
      });
    }, { passive: true });
  }
  }
  initDots() {
(function () {
  const sec = document.getElementById('contact'), cv = sec && sec.querySelector('.dotfield'); if (!cv) return;
  const ctx = cv.getContext('2d'); const still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W = 0, H = 0, dpr = 1, C = 0, R = 0, gap = 12, raf = 0, vis = false, last = 0, t = 0;
  let hA, hB, xs, ys, ds;
  const P = { x: 0, y: 0, px: 0, py: 0, on: false };
  const LV = 14; const paths = new Array(LV);
  const build = () => {
    const r = sec.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1); W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    gap = W < 760 ? 10 : 12; C = Math.ceil(W / gap) + 2; R = Math.ceil(H / gap) + 2;
    hA = new Float32Array(C * R); hB = new Float32Array(C * R);
    xs = new Float32Array(C); ys = new Float32Array(R); ds = new Float32Array(R);
    for (let i = 0; i < C; i++) xs[i] = (i - 0.5) * gap;
    for (let j = 0; j < R; j++) { const v = j / (R - 1); ys[j] = H * Math.pow(v, 1.18); ds[j] = 0.45 + 0.55 * Math.pow(v, 0.8); }
    frame(performance.now(), true);
  };
  const cell = (x, y) => { const v = Math.pow(Math.max(0, Math.min(1, y / H)), 1 / 1.18); return [Math.round(x / gap + 0.5), Math.round(v * (R - 1))]; };
  const poke = (x, y, amt, rad) => { const [ci, cj] = cell(x, y);
    for (let j = cj - rad; j <= cj + rad; j++) for (let i = ci - rad; i <= ci + rad; i++) {
      if (i < 1 || j < 1 || i >= C - 1 || j >= R - 1) continue; const q = ((i - ci) * (i - ci) + (j - cj) * (j - cj)) / (rad * rad); if (q > 1) continue;
      hA[j * C + i] += amt * (1 - q) * (1 - q); } };
  const step = () => {
    const c2 = 0.16, damp = 0.986;
    for (let j = 1; j < R - 1; j++) { const o = j * C;
      for (let i = 1; i < C - 1; i++) { const k = o + i;
        const lap = hA[k - 1] + hA[k + 1] + hA[k - C] + hA[k + C] - 4 * hA[k];
        hB[k] = (2 * hA[k] - hB[k] + c2 * lap) * damp; } }
    const tmp = hA; hA = hB; hB = tmp;
  };
  const frame = (now, force) => {
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016); last = now; if (!still) t += dt;
    if (!still && !force) { step(); step(); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    for (let l = 0; l < LV; l++) paths[l] = new Path2D();
    for (let j = 0; j < R; j++) { const o = j * C, y0 = ys[j], dep = ds[j];
      for (let i = 0; i < C; i++) { const x = xs[i];
        const sw = 0.62 * Math.sin(x * 0.0085 + y0 * 0.0042 - t * 0.85) + 0.38 * Math.sin(x * 0.0041 - y0 * 0.011 - t * 0.55 + 1.7) + 0.22 * Math.sin((x + y0) * 0.017 - t * 1.3);
        const hh = sw + hA[o + i] * 1.6;
        const n = Math.max(0, Math.min(1, 0.5 + hh * 0.42));
        const y = y0 - hh * 7.5 * dep;
        const rad = (0.5 + n * 1.45) * dep;
        let l = Math.floor(n * dep * (LV - 1) + 0.5); if (l < 0) l = 0; if (l >= LV) l = LV - 1;
        paths[l].moveTo(x + rad, y); paths[l].arc(x, y, rad, 0, 6.2832); } }
    for (let l = 0; l < LV; l++) { const a = 0.04 + 0.52 * (l / (LV - 1)); ctx.fillStyle = 'rgba(' + Component.cssVar('--paper-rgb', '238,235,229') + ',' + a.toFixed(3) + ')'; ctx.fill(paths[l]); }
  };
  const loop = (now) => { raf = 0; frame(now); if (vis && !still) raf = requestAnimationFrame(loop); };
  const kick = () => { if (!raf && vis && !still) { last = 0; raf = requestAnimationFrame(loop); } };
  const local = (e) => { const r = sec.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  sec.addEventListener('pointermove', (e) => { const [x, y] = local(e);
    if (!P.on) { P.px = x; P.py = y; P.on = true; }
    const sp = Math.min(40, Math.hypot(x - P.px, y - P.py)); P.px = x; P.py = y;
    if (sp > 0.5 && hA) poke(x, y, -0.05 * sp / 10 - 0.02, 3); });
  sec.addEventListener('pointerleave', () => { P.on = false; });
  sec.addEventListener('pointerdown', (e) => { const [x, y] = local(e); if (hA) poke(x, y, -0.9, 4); });
  if ('IntersectionObserver' in window) new IntersectionObserver((en) => { vis = en[0].isIntersecting; if (vis) kick(); }, { rootMargin: '100px' }).observe(sec); else { vis = true; kick(); }
  if ('ResizeObserver' in window) new ResizeObserver(() => build()).observe(sec); else window.addEventListener('resize', build);
  build();
})();
  }
}
(function () {
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const comp = new Component({});
  const els = { c1: document.querySelector('[data-hl="c1"]'), c2: document.querySelector('[data-hl="c2"]'), del: document.querySelector('[data-hl="del"]') };
  const chars = (list) => list.map((c) => '<span' + (c.cls ? ' class="' + c.cls + '"' : '') + '>' + esc(c.t) + '</span>').join('');
  comp.__render = () => { const st = comp.state;
    if (els.c1 && st.c1) els.c1.innerHTML = chars(st.c1);
    if (els.c2 && st.c2) els.c2.innerHTML = chars(st.c2);
    if (els.del) els.del.classList.toggle('on', !!st.struck); };
  document.querySelectorAll('[data-ref]').forEach((el) => { const fn = comp[el.getAttribute('data-ref')]; if (typeof fn === 'function') fn(el); });
  ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'keydown', 'click', 'pointerenter'].forEach((ev) => {
    document.querySelectorAll('[data-on-' + ev + ']').forEach((el) => { const fn = comp[el.getAttribute('data-on-' + ev)]; if (typeof fn === 'function') el.addEventListener(ev, fn); });
  });
  comp.__site = true; comp.__mounted = true; comp.__render();
  if (comp.componentDidMount) comp.componentDidMount();
})();
