/* LazyVideos 2.0.0 (konpo.studio). Loads muted autoplay videos that carry their file in data-src (on the
   <video> or on its <source>), so a page with dozens of clips doesn't download them all up front.

   - Home project tiles (.prj-img.has-video): the tile image stays until the tile's own video plays, and the
     video waits for that image. Same as 1.2.0.
   - Videos with data-poster (case studies): the still, the video's own first frame, goes in about five
     screens ahead, so a tile is never an empty block. Videos within about a screen and a half load one at
     a time, nearest first, up to their first frame, then wait paused without downloading more (so the
     stills and the next video get the bandwidth), and play in view. When a video can't play (iPhone Low
     Power Mode, Save-Data, reduced motion), the still stays.
   - Other videos stay hidden until they play, then fade in (1.2.0).

   On a direct visit nothing loads ahead of view until the page has loaded and the loader has lifted, so
   videos don't compete with the page scripts. Videos pause off screen. */
(function () {
  if (!('IntersectionObserver' in window)) return;
  var c = navigator.connection,
    noVideo = (c && c.saveData) || matchMedia('(prefers-reduced-motion: reduce)').matches,
    style = document.createElement('style');
  style.textContent =
    '.projlist-main-item-thumb-vid video{display:block;width:100%;height:100%;object-fit:cover}' +
    'video.lzv{opacity:0;transition:opacity .4s}video.lzv.is-playing{opacity:1}';
  document.head.appendChild(style);

  function fileOf(v) {
    if (v.dataset.src) return v.dataset.src;
    var s = v.querySelector('source[data-src]');
    return s ? s.dataset.src : '';
  }
  // the tile image a Home video sits on
  function imageOf(v) {
    for (var e = v.parentElement; e && e !== document.body; e = e.parentElement) {
      var i = e.querySelector('.prj-img');
      if (i) return i;
    }
  }
  function tileImage(v) {
    var i = imageOf(v);
    return i && i.classList.contains('has-video') ? i : null;
  }
  function play(v) {
    v.muted = true;
    var p = v.play();
    p && p.catch(function () {});
  }
  function still(v) {
    var p = v.dataset.poster;
    if (p && !v.getAttribute('poster')) v.setAttribute('poster', p);
  }
  // paused off screen: keep what's buffered but stop downloading more, so stills and the next video get the bandwidth
  function rest(v) {
    v.pause();
    if (v.dataset.poster) v.preload = 'metadata';
  }
  // set the file; off screen it buffers up to the first frame and waits, paused
  function load(v, done) {
    if (v._w) return done && done();
    v._w = 1;
    still(v);
    v.addEventListener('playing', function () {
      v.classList.add('is-playing');
      var i = tileImage(v), g = v.closest('.proj-gall-item');
      if (i) i.style.opacity = '0';
      if (g) g.classList.add('vid-on');
    }, { once: true });
    var ok = 0;
    function first() {
      if (ok) return;
      ok = 1;
      if (!v._in) rest(v);
      done && done();
    }
    v.addEventListener('loadeddata', first, { once: true });
    v.addEventListener('error', first, { once: true });
    setTimeout(first, 8000);
    v.preload = 'auto';
    v.src = fileOf(v);
    play(v);
  }

  var seen = new Set(), ready = false;
  var inView = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var v = e.target;
      v._in = e.isIntersecting;
      if (!e.isIntersecting) {
        if (v.getAttribute('src')) rest(v);
        return;
      }
      if (v.getAttribute('src')) {
        v.preload = 'auto';
        return play(v);
      }
      var i = imageOf(v);
      if (!v.dataset.poster && i && !i.complete) {
        if (v._wi) return;
        v._wi = 1;
        i.loading = 'eager';
        i.addEventListener('load', function () { load(v); }, { once: true });
        i.addEventListener('error', function () { load(v); }, { once: true });
      } else load(v);
    });
  }, { rootMargin: '200px 0px' });
  // videos coming up load one at a time, nearest first
  var queue = [], busy = false;
  function next() {
    if (busy) return;
    queue = queue.filter(function (v) { return v.isConnected && !v._w; });
    if (!queue.length) return;
    queue.sort(function (a, b) {
      return Math.abs(a.getBoundingClientRect().top) - Math.abs(b.getBoundingClientRect().top);
    });
    busy = true;
    load(queue.shift(), function () { busy = false; setTimeout(next, 100); });
  }
  var ahead = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      ahead.unobserve(e.target);
      queue.push(e.target);
    });
    next();
  }, { rootMargin: '150% 0px' });
  var stills = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      stills.unobserve(e.target);
      still(e.target);
    });
  }, { rootMargin: '500% 0px' });

  function lookAhead(v) {
    stills.observe(v);
    if (!noVideo) ahead.observe(v);
  }
  function add(v) {
    if (!v || seen.has(v) || !fileOf(v)) return;
    seen.add(v);
    v.removeAttribute('autoplay');
    var i = tileImage(v);
    if (i) i.style.opacity = '';
    else if (!v.dataset.poster) v.classList.add('lzv');
    if (v.dataset.poster) {
      if (ready) lookAhead(v);
      if (noVideo) return;
    }
    if (!noVideo) inView.observe(v);
  }
  function scan() {
    seen.forEach(function (v) {
      if (v.isConnected) return;
      inView.unobserve(v);
      ahead.unobserve(v);
      stills.unobserve(v);
      seen.delete(v);
      if (v.getAttribute('src')) {
        v.removeAttribute('src');
        v.load();
      }
    });
    document.querySelectorAll('video[data-src]').forEach(add);
    document.querySelectorAll('video>source[data-src]').forEach(function (s) { add(s.parentElement); });
  }
  scan();
  var raf = 0;
  new MutationObserver(function () {
    if (!raf) raf = requestAnimationFrame(function () { raf = 0; scan(); });
  }).observe(document.body, { childList: true, subtree: true });

  // look ahead only once the page has loaded and the loader has lifted
  function start() {
    var n = 0, t = setInterval(function () {
      var g = document.querySelector('.main-grid');
      if ((g && g.classList.contains('loaded')) || !g || ++n > 200) {
        clearInterval(t);
        ready = true;
        seen.forEach(function (v) { if (v.dataset.poster) lookAhead(v); });
      }
    }, 150);
  }
  if (document.readyState === 'complete') start();
  else addEventListener('load', start, { once: true });
})();
