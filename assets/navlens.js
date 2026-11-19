/* Liquid glass for the navigation bar (see LIQUID GLASS in site.css): builds the SVG filter that bends what is behind
   the bar and switches it on with html.ng-lens. Only Chromium browsers (Chrome, Edge, Opera, Brave) can use an SVG
   filter inside backdrop-filter, marked by html.ng-cr in the page head; everywhere else this does nothing and the bar
   stays frosted glass. The numbers come from the bar's custom properties (--lq-thick, --lq-refr, --lq-mag, --lq-ca,
   --lq-clar), so they are tuned in one place, the stylesheet. Hovering a nav link also swells the glass under it a
   little and frosts it behind the link's letters (the bulge and the frost, further down). */
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
    /* switch the lens on only once every image it uses has decoded (the lens map, the bulge and the frost mask): a map
       still loading bends everything by half its range (ghosted text), and an image still loading inside the filter is
       never picked up at all */
    var id = key, todo = 3;
    function ready() { if (--todo) return;
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
        '<feDisplacementMap id="ng-bdisp" in="lensed" in2="bm" scale="' + bs.toFixed(2) + '" xChannelSelector="R" yChannelSelector="G" result="bulged"/>' +
        /* the frost under a hovered nav link: inside the bulge, what is behind the glass is blurred and brightened, more
           and more towards the top of the bulge (behind the link's letters) and fading out towards the bar's bottom edge,
           so the black link sits on a light, soft patch when something busy passes behind it. Two blur levels, mixed by
           a mask (M, and M squared for the stronger one); M is scaled by the bulge's strength (#ng-fa). The blurred
           copies are made fully opaque again, or at the bar's top edge the blur pulls in the empty space above. */
        '<feFlood flood-color="#000" result="black"/>' +
        '<feImage id="ng-fmap" href="' + FMASK + '" x="' + bx + '" y="0" width="' + bw + '" height="' + m.rows + '" preserveAspectRatio="none" result="fimg"/>' +
        '<feComposite in="fimg" in2="black" operator="over" result="fm0"/>' +
        '<feComponentTransfer id="ng-fa" in="fm0" result="fm">' + slope(famt()) + '</feComponentTransfer>' +
        '<feComponentTransfer in="fm" result="fmi"><feFuncR type="linear" slope="-1" intercept="1"/><feFuncG type="linear" slope="-1" intercept="1"/><feFuncB type="linear" slope="-1" intercept="1"/></feComponentTransfer>' +
        '<feComposite in="fm" in2="fm" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result="fm2"/>' +
        '<feComponentTransfer in="fm2" result="fm2i"><feFuncR type="linear" slope="-1" intercept="1"/><feFuncG type="linear" slope="-1" intercept="1"/><feFuncB type="linear" slope="-1" intercept="1"/></feComponentTransfer>' +
        '<feGaussianBlur in="bulged" stdDeviation="2.5" result="bl"/><feComponentTransfer in="bl" result="blb">' + bright(.16) + '</feComponentTransfer>' +
        '<feGaussianBlur in="bulged" stdDeviation="6" result="bh"/><feComponentTransfer in="bh" result="bhb">' + bright(.32) + '</feComponentTransfer>' +
        '<feComposite in="bulged" in2="fmi" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result="p1"/>' +
        '<feComposite in="blb" in2="fm" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result="p2"/>' +
        '<feComposite in="p1" in2="p2" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="s1"/>' +
        '<feComposite in="s1" in2="fm2i" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result="q1"/>' +
        '<feComposite in="bhb" in2="fm2" operator="arithmetic" k1="1" k2="0" k3="0" k4="0" result="q2"/>' +
        '<feComposite in="q1" in2="q2" operator="arithmetic" k1="0" k2="1" k3="1" k4="0"/></filter>';
      R.classList.add('ng-lens'); put();
    }
    [m.url, BUMP, FMASK].forEach(function (u) { var i = new Image(); i.onload = i.onerror = ready; i.src = u; });
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
  /* the frost mask over the bulge's oval (u, v from -1 to 1; the link's letters sit at about v = -.55 to -.2, the bar's
     bottom edge at .23): full behind the letters and above, fading out to the bar's bottom edge and to the oval's sides */
  var FMASK = (function () { var w = 128, h = 64, cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    var g = cv.getContext('2d'), im = g.createImageData(w, h);
    function sm(e0, e1, x) { var t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); }
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) { var u = (x + .5) / w * 2 - 1, v = (y + .5) / h * 2 - 1, i = (y * w + x) * 4;
      var c = Math.round(255 * Math.pow(Math.max(0, 1 - u * u), 1.3) * (1 - sm(-.3, .22, v))); im.data[i] = im.data[i + 1] = im.data[i + 2] = c; im.data[i + 3] = 255; }
    g.putImageData(im, 0, 0); return cv.toDataURL('image/png'); })();
  function slope(a) { return ['R', 'G', 'B'].map(function (c) { return '<feFunc' + c + ' type="linear" slope="' + a.toFixed(3) + '"/>'; }).join(''); }
  function bright(b) { return ['R', 'G', 'B'].map(function (c) { return '<feFunc' + c + ' type="linear" slope="' + (1 - b).toFixed(3) + '" intercept="' + b.toFixed(3) + '"/>'; }).join('') + '<feFuncA type="linear" slope="0" intercept="1"/>'; }
  var bx = -999, bw = 1, bs = 0, BMAX = 26;
  function famt() { return .85 * Math.max(0, Math.min(1, bs / BMAX)); }   /* the frost's amount follows the bulge ("soft") */
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* one bulge that follows the pointer from link to link: its position, width and strength each glide towards a target
     every frame (exponential easing), so moving from one link to the next it slides across instead of collapsing and
     growing again. Leaving a link, it waits a moment before it settles back, in case the pointer is on its way to the
     next one. Coming from nothing it starts in place under the link, timed with the blue line (0.18 s in). */
  var tx = bx, tw = bw, ts = 0, raf = 0, last = 0, wait = 0, grow = 0;
  /* the images' position is written with a tiny alternating offset every time: Chrome otherwise keeps showing an image
     where it was while the effect was still at zero, until it moves again */
  var flip = 0;
  function put() { var mp = document.getElementById('ng-bmap'), fm = document.getElementById('ng-fmap'), d = document.getElementById('ng-bdisp'), fa = document.getElementById('ng-fa');
    flip ^= 1; var xs = (bx + flip * .01).toFixed(2), ws = bw.toFixed(2);
    if (mp) { mp.setAttribute('x', xs); mp.setAttribute('width', ws); } if (fm) { fm.setAttribute('x', xs); fm.setAttribute('width', ws); }
    if (d) d.setAttribute('scale', bs.toFixed(2));
    if (fa) { var a = famt().toFixed(3), fs = fa.children; for (var k = 0; k < fs.length; k++) fs[k].setAttribute('slope', a); } }
  function tick(t) { var dt = Math.min(64, t - (last || t)); last = t;
    var kp = 1 - Math.exp(-dt / 110), ks = 1 - Math.exp(-dt / (ts > bs ? 150 : 130));
    bx += (tx - bx) * kp; bw += (tw - bw) * kp; bs += (ts - bs) * ks;
    if (Math.abs(ts - bs) < .05) bs = ts; if (Math.abs(tx - bx) < .2) bx = tx; if (Math.abs(tw - bw) < .2) bw = tw;
    put(); raf = (bs === ts && bx === tx && bw === tw) ? 0 : requestAnimationFrame(tick); }
  function run() { if (!raf) { last = 0; raf = requestAnimationFrame(tick); } }
  function enter(a) { clearTimeout(wait); var r = a.getBoundingClientRect(); tx = r.left - 60; tw = r.width + 120;
    if (bs < .5) { clearTimeout(grow); bx = tx; bw = tw; put(); grow = setTimeout(function () { ts = BMAX; run(); }, 180); }   /* from nothing: in place, with the line */
    else { ts = BMAX; run(); } }                                                                                                  /* from another link: glide over */
  function leave() { clearTimeout(grow); clearTimeout(wait); wait = setTimeout(function () { ts = 0; run(); }, 200); }
  if (!still) {
    var links = document.querySelectorAll('.site-head .nl');
    for (var n = 0; n < links.length; n++) (function (a) {
      a.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') enter(a); });
      a.addEventListener('pointerleave', leave);
    })(links[n]);
  }
  build();
  window.addEventListener('resize', later);
  window.addEventListener('load', function () { last = ''; later(); });   /* once more when everything has loaded */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { last = ''; later(); });
})();
