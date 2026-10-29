/* Playground wall (dist/playwall.js). Lays the Playground Wall collection list on /playground (.pw) out as a
   curated wall: 4 columns (3 on tablets, 2 on phones), cards dealt in project bands into the shortest column,
   crops picked from a rhythm of heights (never cutting more than about a third of the picture), and the first
   card of some bands opening across two columns. Webflow serves the list 100 items a page; the next page is
   fetched as the end of the wall comes within two screens. The wall runs its own videos (LazyVideos leaves them
   alone: no data-src). Every time a video gets or loses its file, the browser rebuilds the layers of the captions
   painted over it, which is a hitch on a slow phone, so cuts are attached (within a screen of view, nearest first)
   and released (six screens behind or ahead) only while scrolling has paused.
   Loaded by the PlayWallLoad site script, which keeps it to staging until the switch says otherwise, and calls
   kpWall.init(container) / kpWall.destroy() around Barba page switches.

   Each CMS item carries its data as attributes: data-k (slug), data-b (band), data-w / data-h (picture size),
   data-fl (flags: wide, soon, light, lightcap), data-v / data-vw (video cuts), data-l (case-study link) and
   data-ss (the srcset: Webflow makes no smaller copies of API uploads, so the wall brings its own). */
(function () {
  if (window.kpWall) return;

  var RHYTHM = [1.25, 0.8, 1.5, 1, 0.75, 1.33, 1.1, 0.9];
  var FEATURE = 0.6;
  var CSS =
    // the wall starts where the old columns did (10rem, 8rem on phones)
    '.pw.is-on{display:block;padding:10rem 0 6rem}' +
    '.pw .w-pagination-wrapper{display:none}' +
    '.pw-list{position:relative}' +
    // each card its own stacking context, so its caption and link layer over its own picture only
    '.pw-item{position:absolute;isolation:isolate;overflow:hidden;border-radius:1.2rem;background-color:var(--secondary-black-900);' +
      'color:var(--white);opacity:0;transition:opacity .9s ease}' +
    '.pw-item.is-light{background-color:var(--body-bg)}' +
    '.pw-item.is-in{opacity:1}' +
    '.pw-media{display:block;width:100%;height:100%;object-fit:cover;transition:transform .8s cubic-bezier(.165,.84,.44,1)}' +
    'video.pw-media{background:transparent}' +
    '.pw-link{position:absolute;inset:0;z-index:3;border-radius:inherit}' +
    '.pw-link:focus-visible{outline:2px solid var(--purple);outline-offset:-2px}' +
    // caption: project left, section right, on a shade that suits the picture's bottom edge
    '.pw-cap{position:absolute;left:0;right:0;bottom:0;z-index:2;display:flex;align-items:flex-end;' +
      'justify-content:space-between;gap:1rem;padding:4.4rem 1.3rem 1.2rem;font-size:1.3rem;line-height:1.2;pointer-events:none;' +
      'background-image:linear-gradient(to top,var(--black-70),transparent);color:var(--white)}' +
    '.pw-cap-name{min-width:0;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.pw-cap-note{flex:none;white-space:nowrap;color:var(--white-50)}' +
    '.pw-item.is-lightcap .pw-cap{background-image:linear-gradient(to top,var(--white-70),transparent);color:var(--black)}' +
    '.pw-item.is-lightcap .pw-cap-note{color:var(--txt-fade)}' +
    '@media (hover:hover){.pw-item:hover .pw-media{transform:scale(1.03)}}' +
    '@media (max-width:767px){.pw.is-on{padding-top:8rem}.pw-item{border-radius:1rem}.pw-cap{padding:3.2rem .9rem .8rem;font-size:1.15rem}' +
      '.pw-item:not(.is-feat) .pw-cap-note{display:none}}' +
    '@media (prefers-reduced-motion:reduce){.pw-item{opacity:1;transition:none}.pw-media{transition:none}}';

  var cur = null;
  // posters only, as LazyVideos does, for Save-Data and reduced motion
  var still = !!(navigator.connection && navigator.connection.saveData) || matchMedia('(prefers-reduced-motion: reduce)').matches;

  function ncols() { var w = innerWidth; return w >= 992 ? 4 : w >= 768 ? 3 : 2; }
  // a crop keeps at least ~68% of the picture's height, and 68% of its width (80% for wide shots, which carry
  // most of the text)
  function allowed(r) { return [Math.max(0.42, r * 0.68), Math.min(2, r * (r < 0.7 ? 1.25 : 1.47))]; }
  function clamp(x, a) { return Math.min(a[1], Math.max(a[0], x)); }
  // the smallest copy that covers px, else the biggest
  function pick(ss, px) {
    for (var i = 0; i < ss.length; i++) if (ss[i][1] >= px * 0.9) return ss[i][0];
    return ss.length ? ss[ss.length - 1][0] : '';
  }

  // a CMS item becomes a card once: flags, its copies, a link, and a video in place of the still
  function prep(el) {
    var d = el.dataset, fl = ' ' + (d.fl || '') + ' ';
    el._r = (+d.h || 1) / (+d.w || 1);
    el._f = fl.indexOf(' wide ') >= 0;
    el._ss = (d.ss || '').split(',').map(function (s) { return s.trim().split(/\s+/); })
      .filter(function (p) { return p[0]; })
      .map(function (p) { return [p[0], parseInt(p[1], 10) || 0]; })
      .sort(function (a, b) { return a[1] - b[1]; });
    if (fl.indexOf(' light ') >= 0) el.classList.add('is-light');
    if (fl.indexOf(' lightcap ') >= 0) el.classList.add('is-lightcap');
    var img = el.querySelector('img');
    if (d.v) {
      var v = document.createElement('video');
      v.className = 'pw-media';
      v.muted = true;
      ['muted', 'playsinline', 'loop'].forEach(function (a) { v.setAttribute(a, ''); });
      v.preload = 'none';
      v.setAttribute('aria-hidden', 'true');
      if (d.w && d.h) { v.width = +d.w; v.height = +d.h; }
      if (img) img.parentNode.replaceChild(v, img); else el.insertBefore(v, el.firstChild);
      el._v = v;
      el.classList.add('is-vid');
    } else if (img) {
      img.loading = 'lazy';
      img.decoding = 'async';
      if (d.ss) img.srcset = d.ss;
      el._img = img;
    }
    var name = el.querySelector('.pw-cap-name');
    if (d.l) {
      var a = document.createElement('a');
      a.className = 'pw-link';
      a.href = d.l;
      a.setAttribute('data-cursor', 'case');
      a.setAttribute('aria-label', (name ? name.textContent.trim() + ' ' : '') + 'case study');
      el.appendChild(a);
    } else if (fl.indexOf(' soon ') >= 0) {
      el.setAttribute('data-cursor', 'soon');
    }
    return el;
  }

  function layout() {
    var c = cur, n = ncols(), W = c.list.clientWidth;
    c.lastW = innerWidth;
    var rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    var gap = (innerWidth < 768 ? 0.4 : 0.5) * rem, cw = (W - gap * (n - 1)) / n;
    var hs = [], last = [], boxes = [];
    for (var i = 0; i < n; i++) { hs.push(0); last.push(null); }
    function shortest() { var b = 0; for (var i = 1; i < n; i++) if (hs[i] < hs[b] - 0.5) b = i; return b; }
    // even two columns out before a wide card: grow the shorter one's last card, or trim the taller one's
    function level(i) {
      var lo = hs[i] <= hs[i + 1] ? i : i + 1, hi = lo === i ? i + 1 : i, dd = hs[hi] - hs[lo];
      if (dd < 1) return true;
      var a = last[lo], b = last[hi];
      if (a && a.h + dd <= a.w * a.lim[1]) { a.h += dd; hs[lo] += dd; return true; }
      if (b && b.h - dd >= b.w * b.lim[0]) { b.h -= dd; hs[hi] -= dd; return true; }
      return false;
    }
    // bands: runs of cards that share data-b, in list order
    var bands = [], pb = null;
    c.items.forEach(function (el) {
      if (el.dataset.b !== pb) { bands.push([]); pb = el.dataset.b; }
      bands[bands.length - 1].push(el);
    });
    // wide cards: at most one every third band, never under the last one, sides taking turns
    var since = 9, prev = -9, turn = 0, PREF = n === 4 ? [0, 2, 1] : n === 3 ? [0, 1] : [0];
    bands.forEach(function (band, bi) {
      since++;
      band.forEach(function (el, k) {
        var lim = allowed(el._r), box = null, best = -1;
        if (k === 0 && el._f && since >= 3) {
          var score = 1e12, want = PREF[turn % PREF.length];
          for (var i = 0; i < n - 1; i++) {
            if (n > 2 && i === prev) continue;
            var s = Math.max(hs[i], hs[i + 1]) + 2 * Math.abs(hs[i] - hs[i + 1]) + (i === want ? 0 : cw * 0.6) +
              (Math.abs(i - prev) === 1 ? cw * 0.4 : 0);
            if (s < score) { score = s; best = i; }
          }
        }
        if (best >= 0) {
          var saved = [hs[best], hs[best + 1], last[best] && last[best].h, last[best + 1] && last[best + 1].h];
          if (level(best)) {
            var w = 2 * cw + gap, y = Math.max(hs[best], hs[best + 1]);
            box = { el: el, x: best * (cw + gap), y: y, w: w, h: w * clamp(FEATURE, lim), lim: lim, feat: true };
            hs[best] = hs[best + 1] = y + box.h + gap;
            last[best] = last[best + 1] = null;
            since = 0; prev = best; turn++;
          } else {
            hs[best] = saved[0]; hs[best + 1] = saved[1];
            if (last[best]) last[best].h = saved[2];
            if (last[best + 1]) last[best + 1].h = saved[3];
          }
        }
        if (!box) {
          var col = shortest(), dh = clamp(RHYTHM[(k + bi * 3 + col) % RHYTHM.length], lim);
          box = { el: el, x: col * (cw + gap), y: hs[col], w: cw, h: cw * dh, lim: lim, feat: false };
          hs[col] += box.h + gap;
          last[col] = box;
        }
        boxes.push(box);
      });
    });
    var dpr = devicePixelRatio || 1;
    boxes.forEach(function (b) {
      var el = b.el, s = el.style;
      s.left = b.x.toFixed(1) + 'px'; s.top = b.y.toFixed(1) + 'px';
      s.width = b.w.toFixed(1) + 'px'; s.height = b.h.toFixed(1) + 'px';
      el.classList.toggle('is-feat', b.feat);
      if (el._img) el._img.sizes = Math.round(b.w) + 'px';
      var v = el._v;
      if (v && !v.getAttribute('src')) {
        var p = pick(el._ss, b.w * dpr);
        v.dataset.poster = p;
        if (v.getAttribute('poster')) v.setAttribute('poster', p);
        v._src = b.feat && el.dataset.vw ? el.dataset.vw : el.dataset.v;
      }
    });
    c.list.style.height = Math.max(0, Math.max.apply(null, hs) - gap) + 'px';
  }

  function add(els) {
    var c = cur;
    els.forEach(function (el) {
      prep(el);
      if (el.parentNode !== c.list) c.list.appendChild(el);
      c.items.push(el);
      c.fade.observe(el);
      if (el._v) { c.poster.observe(el._v); c.near.observe(el._v); c.far.observe(el._v); c.view.observe(el._v); }
    });
  }

  function play(v) { var p = v.play(); if (p) p.catch(function () {}); }
  function release(c, v) {
    var i = c.queue.indexOf(v);
    if (i >= 0) c.queue.splice(i, 1);
    if (c.loading === v) c.loaded();
    if (v.getAttribute('src')) { v.pause(); v.removeAttribute('src'); v.load(); }
  }
  // while scrolling has paused: let go of the far cuts, then attach the nearest waiting one, and the next once it
  // has a frame (or after 8s)
  function pump(c) {
    if (cur !== c) return;
    var idle = performance.now() - c.scrolled;
    if (idle < 250) { clearTimeout(c.wait); c.wait = setTimeout(function () { pump(c); }, 260 - idle); return; }
    if (c.drop.length) { c.drop.splice(0).forEach(function (v) { release(c, v); }); }
    if (c.loading || !c.queue.length) return;
    c.queue.sort(function (a, b) { return Math.abs(a.getBoundingClientRect().top) - Math.abs(b.getBoundingClientRect().top); });
    var v = c.queue.shift(), t = 0;
    c.loading = v;
    c.loaded = function () {
      if (c.loading !== v) return;
      clearTimeout(t);
      c.loading = null;
      setTimeout(function () { pump(c); }, 100);
    };
    v.addEventListener('loadeddata', c.loaded, { once: true });
    v.addEventListener('error', c.loaded, { once: true });
    t = setTimeout(c.loaded, 8000);
    v.preload = 'auto';
    v.src = v._src;
    if (v._in) play(v);
  }

  // the next 100: fetch the page Webflow's (hidden) pagination points at and take its cards
  function more() {
    var c = cur;
    if (!c || c.busy || !c.next) return;
    c.busy = true;
    fetch(c.next, { credentials: 'same-origin', signal: c.abort && c.abort.signal })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function (html) {
        if (cur !== c) return;
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var list = doc.querySelector('.pw .w-dyn-items'), nx = doc.querySelector('.pw .w-pagination-next');
        c.next = nx ? new URL(nx.getAttribute('href'), c.next).href : null;
        add(list ? Array.prototype.map.call(list.children, function (el) { return document.importNode(el, true); }) : []);
        layout();
        c.busy = false;
        near();
      })
      .catch(function () { if (cur === c) { c.busy = false; c.next = null; } });
  }
  // the end of the wall within two screens: fetch more
  function near() {
    var c = cur;
    if (c && c.next && !c.busy && c.end.getBoundingClientRect().top < innerHeight * 3) more();
  }

  function init(container) {
    var root = container && container.querySelector('.pw');
    if (!root || (cur && cur.root === root)) return;
    destroy();
    if (!document.getElementById('pw-css')) {
      var st = document.createElement('style');
      st.id = 'pw-css';
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    var list = root.querySelector('.w-dyn-items');
    if (!list) return;
    var nx = root.querySelector('.w-pagination-next');
    var c = cur = {
      root: root, list: list, items: [], busy: false, lastW: 0,
      next: nx ? new URL(nx.getAttribute('href'), location.href).href : null,
      abort: window.AbortController ? new AbortController() : null,
      // fade cards in as they come up
      fade: new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('is-in'); c.fade.unobserve(e.target); }
        });
      }, { rootMargin: '0px 0px -4% 0px' }),
      queue: [], drop: [], loading: null, scrolled: 0, wait: 0,
      poster: new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          c.poster.unobserve(e.target);
          if (!e.target.getAttribute('poster')) e.target.setAttribute('poster', e.target.dataset.poster);
        });
      }, { rootMargin: '500% 0px' }),
      near: new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          var v = e.target, i = c.queue.indexOf(v);
          if (!e.isIntersecting) { if (i >= 0) c.queue.splice(i, 1); }
          else if (!still && !v.getAttribute('src') && i < 0) c.queue.push(v);
        });
        pump(c);
      }, { rootMargin: '100% 0px' }),
      far: new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          var v = e.target, i = c.drop.indexOf(v);
          if (e.isIntersecting) { if (i >= 0) c.drop.splice(i, 1); }
          else if (v.getAttribute('src') && i < 0) c.drop.push(v);
        });
        pump(c);
      }, { rootMargin: '600% 0px' }),
      view: new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          var v = e.target;
          v._in = e.isIntersecting;
          if (v.getAttribute('src')) { if (v._in) play(v); else v.pause(); }
        });
      })
    };
    c.end = document.createElement('div');
    c.end.setAttribute('aria-hidden', 'true');
    list.parentNode.insertBefore(c.end, list.nextSibling);
    c.ahead = new IntersectionObserver(function (es) { if (es[0].isIntersecting) more(); }, { rootMargin: '0px 0px 200% 0px' });
    c.ahead.observe(c.end);
    root.classList.add('is-on');
    add(Array.prototype.slice.call(list.children));
    layout();
    c.onscroll = function () { c.scrolled = performance.now(); };
    addEventListener('scroll', c.onscroll, { passive: true });
    var rt = 0;
    c.resize = function () {
      if (innerWidth === c.lastW) return;
      clearTimeout(rt);
      rt = setTimeout(function () { if (cur === c) { layout(); near(); } }, 120);
    };
    addEventListener('resize', c.resize);
    near();
  }

  function destroy() {
    var c = cur;
    if (!c) return;
    cur = null;
    [c.fade, c.ahead, c.poster, c.near, c.far, c.view].forEach(function (o) { o.disconnect(); });
    clearTimeout(c.wait);
    c.items.forEach(function (el) { if (el._v) release(c, el._v); });
    removeEventListener('resize', c.resize);
    removeEventListener('scroll', c.onscroll);
    if (c.abort) c.abort.abort();
  }

  window.kpWall = { init: init, destroy: destroy };
})();
