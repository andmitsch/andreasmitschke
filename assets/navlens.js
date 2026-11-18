/* Liquid glass for the navigation bar (see LIQUID GLASS in site.css): builds the SVG filter that bends what is behind
   the bar and switches it on with html.ng-lens. Only Chromium browsers (Chrome, Edge, Opera, Brave) can use an SVG
   filter inside backdrop-filter, marked by html.ng-cr in the page head; everywhere else this does nothing and the bar
   stays frosted glass. The numbers come from the bar's custom properties (--lq-thick, --lq-refr, --lq-mag, --lq-ca,
   --lq-clar), so they are tuned in one place, the stylesheet. */
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
        '<feGaussianBlur in="rgb" stdDeviation="' + soft + '"/></filter>';
      R.classList.add('ng-lens');
    };
    img.src = m.url;
  }
  function later() { if (!queued) { queued = true; requestAnimationFrame(build); } }
  build();
  window.addEventListener('resize', later);
  window.addEventListener('load', function () { last = ''; later(); });   /* once more when everything has loaded */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { last = ''; later(); });
})();
