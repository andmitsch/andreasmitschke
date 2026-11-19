/* Liquid glass for the navigation bar (see LIQUID GLASS in site.css): builds the SVG filter that bends what is behind
   the bar and switches it on with html.ng-lens. Only Chromium browsers (Chrome, Edge, Opera, Brave) can use an SVG
   filter inside backdrop-filter, marked by html.ng-cr in the page head; everywhere else this does nothing and the bar
   stays frosted glass. The numbers come from the bar's custom properties (--lq-thick, --lq-refr, --lq-mag, --lq-ca,
   --lq-clar), so they are tuned in one place, the stylesheet. Hovering a nav link also swells the glass under it a
   little (the bulge, further down). */
(function () {
  var R = document.documentElement;
  if (!R.classList.contains('ng-cr')) return;
  var NS = 'http://www.w3.org/2000/svg', svg = null, last = '', queued = false;
  function num(el, name) { return parseFloat(getComputedStyle(el).getPropertyValue(name)) || 0; }

  /* one displacement value per CSS pixel row of the glass layer (the bar plus the hidden strip below it that the rim
     reaches into): towards the middle for the magnification, and inside the bottom bevel a curved pull from below for
     the refraction. Red stays 128 (no sideways shift); green = 128 + dy / S * 255. */
  function map(H, reach, thick, refr, mag) {
    var rows = Math.max(2, Math.round(H + reach)), barH = Math.round(H), c = (barH - 1) / 2, e = Math.max(1, thick), dy = [], max = 0;
    for (var y = 0; y < rows; y++) {
      var d = 0;
      if (y < barH) {
        d = -(y - c) * (mag / 100);
        var db = barH - 1 - y;
        if (db < e) { var t = 1 - db / e; d += refr * (1 - Math.sqrt(1 - t * t)); }
      }
      dy.push(d); max = Math.max(max, Math.abs(d));
    }
    var S = 2 * max + 2, cv = document.createElement('canvas'); cv.width = 1; cv.height = rows;
    var g = cv.getContext('2d'), img = g.createImageData(1, rows);
    for (var i = 0; i < rows; i++) { img.data[i * 4] = 128; img.data[i * 4 + 1] = Math.round(255 * (.5 + dy[i] / S)); img.data[i * 4 + 2] = 128; img.data[i * 4 + 3] = 255; }
    g.putImageData(img, 0, 0);
    return { url: cv.toDataURL('image/png'), S: S, rows: rows };
  }

  function build() {
    queued = false;
    var bar = document.querySelector('.site-head'); if (!bar) return;
    var W = bar.offsetWidth, H = bar.offsetHeight; if (!W || !H) return;   /* the bar is exactly window-wide: a much wider masked layer is too big for the GPU on Retina screens and Chrome drops the lens */
    var thick = num(bar, '--lq-thick'), refr = num(bar, '--lq-refr'), mag = num(bar, '--lq-mag'), ca = num(bar, '--lq-ca') * .06, soft = num(bar, '--lq-clar');
    var key = [W, H, thick, refr, mag, ca, soft].join(); if (key === last) return; last = key;
    var m = map(H, refr + 2, thick, refr, mag);
    if (!svg) {
      svg = document.createElementNS(NS, 'svg'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('width', '0'); svg.setAttribute('height', '0');
      svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden'; document.body.appendChild(svg);
    }
    /* red, green and blue are displaced by slightly different amounts: the colour fringes (kept small, or they turn into blobs) */
    function disp(scale, res) { return '<feDisplacementMap in="SourceGraphic" in2="map" scale="' + scale.toFixed(2) + '" xChannelSelector="R" yChannelSelector="G" result="' + res + '"/>'; }
    function keep(src, row, res) { return '<feColorMatrix in="' + src + '" type="matrix" values="' + row + '" result="' + res + '"/>'; }
    /* switch the lens on only once the map has decoded: a map still loading bends everything by half its range (ghosted text) */
    var img = new Image(), id = key;
    img.onload = function () {
      if (id !== last) return;   /* a newer build has started */
      /* the map is the same in every column, so it is laid three window widths wide: no column is left without it */
      svg.innerHTML = '<filter id="ng-lens" x="0" y="0" width="1" height="1" filterUnits="objectBoundingBox" primitiveUnits="userSpaceOnUse" color-interpolation-filters="sRGB">' +
        '<feImage href="' + m.url + '" x="' + (-W) + '" y="0" width="' + 3 * W + '" height="' + m.rows + '" preserveAspectRatio="none" result="map"/>' +
        disp(m.S * (1 + ca), 'dr') + keep('dr', '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0', 'r') +
        disp(m.S, 'dg') + keep('dg', '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0', 'g') +
        disp(m.S * (1 - ca), 'db') + keep('db', '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0', 'b') +
        '<feBlend in="r" in2="g" mode="screen" result="rg"/><feBlend in="rg" in2="b" mode="screen" result="rgb"/>' +
        '<feGaussianBlur in="rgb" stdDeviation="' + soft + '" result="lensed"/>' +
        /* the bulge under a hovered nav link: a local magnification, on a neutral ground so nothing else moves */
        '<feFlood flood-color="rgb(128,128,128)" result="flat"/>' +
        '<feImage id="ng-bmap" href="' + BUMP + '" x="' + bx + '" y="0" width="' + bw + '" height="' + m.rows + '" preserveAspectRatio="none" result="bimg"/>' +
        '<feComposite in="bimg" in2="flat" operator="over" result="bm"/>' +
        '<feDisplacementMap id="ng-bdisp" in="lensed" in2="bm" scale="' + bs.toFixed(2) + '" xChannelSelector="R" yChannelSelector="G"/></filter>';
      R.classList.add('ng-lens');
    };
    img.src = m.url;
  }
  function later() { if (!queued) { queued = true; requestAnimationFrame(build); } }

  /* hovering a nav link, the glass under it swells a little: whatever is behind the bar there is magnified and bent,
     then it settles back when the pointer leaves. It comes with the blue line (from 0.18 s, over 0.5 s) and is only
     visible when something passes behind the links, which is fine: otherwise the line alone does the work.
     The bulge map: a displacement towards the centre, strongest inside, fading to nothing at the oval's edge. */
  var BUMP = (function () { var w = 128, h = 64, cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    var g = cv.getContext('2d'), im = g.createImageData(w, h);
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) { var u = (x + .5) / w * 2 - 1, v = (y + .5) / h * 2 - 1, f = Math.max(0, 1 - (u * u + v * v)), i = (y * w + x) * 4;
      im.data[i] = Math.round(128 - 127 * u * f / .4); im.data[i + 1] = Math.round(128 - 127 * v * f / .4); im.data[i + 2] = 128; im.data[i + 3] = 255; }
    g.putImageData(im, 0, 0); return cv.toDataURL('image/png'); })();
  var bx = -999, bw = 1, bs = 0, braf = 0, BMAX = 26;
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function ease(k) { return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function bulge(a) {
    var to = a ? BMAX : 0;
    if (a) { var r = a.getBoundingClientRect(); bx = Math.round(r.left - 60); bw = Math.round(r.width + 120);
      var mp = document.getElementById('ng-bmap'); if (mp) { mp.setAttribute('x', bx); mp.setAttribute('width', bw); } }
    cancelAnimationFrame(braf);
    var from = bs, t0 = performance.now() + (a ? 180 : 0), dur = a ? 500 : 420;
    function step(t) { var k = Math.min(1, Math.max(0, (t - t0) / dur)); bs = from + (to - from) * ease(k);
      var d = document.getElementById('ng-bdisp'); if (d) d.setAttribute('scale', bs.toFixed(2)); if (k < 1) braf = requestAnimationFrame(step); }
    braf = requestAnimationFrame(step); }
  if (!still) {
    var links = document.querySelectorAll('.site-head .nl');
    for (var n = 0; n < links.length; n++) (function (a) {
      a.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') bulge(a); });
      a.addEventListener('pointerleave', function () { bulge(null); });
    })(links[n]);
  }
  build();
  window.addEventListener('resize', later);
  window.addEventListener('load', function () { last = ''; later(); });   /* once more when everything has loaded */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { last = ''; later(); });
})();
