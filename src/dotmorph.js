// Dot morph: the About pillar icons and the service-page feature icons drawn as dots on the panel's own dot grid,
// the same way the dot grid rebuild draws (Canvas 2D at the screen's pixel density, the loop sleeps when nothing moves).
// The canvas draws the panel's background dots itself, on the lattice the CSS dot tile lays out today, and every icon
// dot sits on one of those lattice points. Scrolling scrubs the icons into each other: a dot with a partner nearby
// travels to it (growing or shrinking on the way), and every other dot sinks back into the background dot it sits
// on while new ones rise out of theirs. Partners are chosen so the dots travel as little as possible in total.
// At a whole step the canvas shows the icon as the file draws it, snapped to the grid.
// The icons come straight from the files the CMS serves today: the About SVGs and the service-page Lotties. A Lottie
// is drawn at its resting frame (105, the end of its fade-in) and can keep breathing the way its loop does today.
(function () {
    const TAU = Math.PI * 2;
    const reduceMq = matchMedia('(prefers-reduced-motion: reduce)');

    // ---------- reading the icon files ----------

    // An About icon: circles on a 41px lattice in a 1244 box. Some are mirrored with a transform, and a few spots hold
    // two circles, which read as the bigger one.
    function fromSvg(text) {
        const vb = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(text);
        const at = new Map();
        for (const m of text.matchAll(/<circle ([^>]*)\/>/g)) {
            const a = {};
            for (const kv of m[1].matchAll(/([\w-]+)="([^"]*)"/g)) a[kv[1]] = kv[2];
            let x = +a.cx, y = +a.cy;
            if (a.transform) [x, y] = svgTransform(a.transform, x, y);
            const k = Math.round(x * 100) / 100 + ',' + Math.round(y * 100) / 100;
            at.set(k, Math.max(at.get(k) || 0, +a.r));
        }
        const dots = [];
        for (const [k, r] of at) { const [x, y] = k.split(',').map(Number); dots.push(x, y, r) }
        return { w: +vb[1], h: +vb[2], dots };
    }
    function svgTransform(t, x, y) {
        let m = /rotate\(([-\d.]+) ([-\d.]+) ([-\d.]+)\)/.exec(t);
        if (m) {
            const a = m[1] * Math.PI / 180, cx = +m[2], cy = +m[3], dx = x - cx, dy = y - cy;
            return [cx + dx * Math.cos(a) - dy * Math.sin(a), cy + dx * Math.sin(a) + dy * Math.cos(a)];
        }
        m = /matrix\(([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)\)/.exec(t);
        if (m) { const [a, b, c, d, e, f] = m.slice(1).map(Number); return [a * x + c * y + e, b * x + d * y + f] }
        return [x, y];
    }

    // A service icon: three precomps (fade-in 0-105, loop 105-200, fade-out 200-300) holding one shape layer per dot.
    // Dots never move inside a Lottie; only their scale (and, in the loop, opacity) is keyframed. The site plays it
    // from 0 to 200 and then jumps back to 105, so the loop repeats forever.
    function fromLottie(j) {
        const byInd = {}; j.layers.forEach((l) => { byInd[l.ind] = l });
        const assets = {}; j.assets.forEach((a) => { assets[a.id] = a });
        const first = (p) => p && p.a === 1 ? p.k[0].s : p ? p.k : null;
        const mat = (ks) => { const p = first(ks.p), a = first(ks.a) || [0, 0], s = first(ks.s) || [100, 100]; return [s[0] / 100, s[1] / 100, p[0] - a[0] * s[0] / 100, p[1] - a[1] * s[1] / 100] };
        const chain = (l) => { const ms = [mat(l.ks)]; while (l.parent) { l = byInd[l.parent]; ms.push(mat(l.ks)) } return ms };
        const pre = {};
        for (const l of j.layers) {
            if (l.ty !== 0) continue;
            const nm = l.nm.toLowerCase();
            pre[/loop/.test(nm) ? 'loop' : /in$/.test(nm) ? 'in' : 'out'] = l;
        }
        const ms = chain(pre.loop); let sc = 1; ms.forEach((m) => { sc *= m[0] });
        const read = (layer) => assets[layer.refId].layers.filter((x) => x.ty === 4).map((x) => {
            const g = x.shapes[0].it, tr = g.find((i) => i.ty === 'tr'), v = g.find((i) => i.ty === 'sh').ks.k.v;
            const r = Math.max(...v.map((q) => Math.max(Math.abs(q[0]), Math.abs(q[1])))) * tr.s.k[0] / 100;
            const p = x.ks.p.k, a = x.ks.a.k;
            return { nm: x.nm, x: p[0] + tr.p.k[0] - tr.a.k[0] - a[0], y: p[1] + tr.p.k[1] - tr.a.k[1] - a[1], r, ks: x.ks };
        });
        const intro = {}; read(pre.in).forEach((d) => { intro[d.nm] = d });
        const out = { w: j.w, h: j.h, dots: [], loop: [], intro: [], loopStart: pre.loop.ip, loopLen: pre.loop.op - pre.loop.ip, introLen: pre.in.op - pre.in.ip, fr: j.fr };
        for (const d of read(pre.loop)) {
            let X = d.x, Y = d.y;
            for (const m of ms) { X = m[0] * X + m[2]; Y = m[1] * Y + m[3] }
            const R = d.r * sc * first(d.ks.s)[0] / 100;
            if (X + R <= 0 || Y + R <= 0 || X - R >= j.w || Y - R >= j.h) continue; // off the artboard: the player clips it away
            out.dots.push(X, Y, R);
            out.loop.push([keys(d.ks.s), keys(d.ks.o)]);
            out.intro.push(intro[d.nm] ? keys(intro[d.nm].ks.s) : [0, 100, 0, 0, 1, 1]);
        }
        return out;
    }
    // Keyframes as [t, v, ox, oy, ix, iy, ...]: keyframe k eases into k+1 with cubic-bezier(ox, oy, ix, iy).
    function keys(p) {
        if (p.a !== 1) { const v = Array.isArray(p.k) ? p.k[0] : p.k; return [0, v, 0, 0, 1, 1] }
        const out = [], g = (a) => Array.isArray(a) ? a[0] : a;
        for (const kf of p.k) {
            const o = kf.o || { x: 0, y: 0 }, i = kf.i || { x: 1, y: 1 };
            out.push(kf.t, Array.isArray(kf.s) ? kf.s[0] : kf.s, g(o.x), g(o.y), g(i.x), g(i.y));
        }
        return out;
    }
    function bezier(x1, y1, x2, y2, u) {
        if (u <= 0) return 0; if (u >= 1) return 1;
        let t = u;
        for (let n = 0; n < 8; n++) {
            const x = ((1 - 3 * x2 + 3 * x1) * t + (3 * x2 - 6 * x1)) * t * t + 3 * x1 * t - u;
            const dx = (3 * (1 - 3 * x2 + 3 * x1) * t + 2 * (3 * x2 - 6 * x1)) * t + 3 * x1;
            if (Math.abs(x) < 1e-5) break;
            if (Math.abs(dx) < 1e-6) { // flat spot: fall back to halving
                let lo = 0, hi = 1; t = u;
                for (let k = 0; k < 20; k++) { const xx = ((1 - 3 * x2 + 3 * x1) * t + (3 * x2 - 6 * x1)) * t * t + 3 * x1 * t; if (xx < u) lo = t; else hi = t; t = (lo + hi) / 2 }
                break;
            }
            t = Math.min(1, Math.max(0, t - x / dx));
        }
        return ((1 - 3 * y2 + 3 * y1) * t + (3 * y2 - 6 * y1)) * t * t + 3 * y1 * t;
    }
    function evalKeys(k, t) {
        if (t <= k[0] || k.length === 6) return k[1];
        for (let q = 0; q + 6 < k.length; q += 6) {
            const t0 = k[q], t1 = k[q + 6];
            if (t < t1) return k[q + 1] + (k[q + 7] - k[q + 1]) * bezier(k[q + 2], k[q + 3], k[q + 4], k[q + 5], (t - t0) / (t1 - t0));
        }
        return k[k.length - 5];
    }
    // The icon's own lattice pitch, in file units: the commonest gap between neighbouring columns (41 in every file today).
    function pitch(dots) {
        const xs = [...new Set(dots.filter((_, q) => q % 3 === 0).map((x) => Math.round(x * 100) / 100))].sort((a, b) => a - b);
        const count = new Map();
        for (let i = 1; i < xs.length; i++) { const d = Math.round((xs[i] - xs[i - 1]) * 10) / 10; count.set(d, (count.get(d) || 0) + 1) }
        let best = 0, n = 0;
        for (const [d, c] of count) if (c > n || (c === n && d < best)) { best = d; n = c }
        return best || 1;
    }

    // The panel's background dots, read from the dot tile the site CSS repeats behind the icons (a 2×2 block of dots),
    // so the canvas grid uses the tile's own colour and dot size.
    async function readTile(panel) {
        const m = /url\("?([^")]+)"?\)/.exec(getComputedStyle(panel).backgroundImage);
        if (!m) return null;
        const svg = await (await fetch(m[1])).text();
        const w = +/width="([\d.]+)"/.exec(svg)[1], h = +/height="([\d.]+)"/.exec(svg)[1];
        const fill = /fill="#([0-9a-f]{6})"/i.exec(svg)[1];
        const nums = /<path d="([^"]+)"/.exec(svg)[1].match(/-?[\d.]+/g).map(Number);
        const xs = nums.filter((_, i) => i % 2 === 0), ys = nums.filter((_, i) => i % 2 === 1);
        const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
        // the tile's first dot (centre, radius) in the tile's own units, and its colour
        return { w, h, x: (x0 + x1) / 2, y: (y0 + y1) / 2, r: (x1 - x0) / 2, rgb: [0, 2, 4].map((i) => parseInt(fill.slice(i, i + 2), 16)) };
    }

    // ---------- choosing partners (all in lattice steps) ----------

    // Least total cost (Hungarian method, rows <= columns). Returns, for each row, its column.
    function assign(n, m, cost) {
        const INF = 1e18, u = new Float64Array(n + 1), v = new Float64Array(m + 1), p = new Int32Array(m + 1), way = new Int32Array(m + 1);
        const minv = new Float64Array(m + 1), used = new Uint8Array(m + 1);
        for (let i = 1; i <= n; i++) {
            p[0] = i; let j0 = 0; minv.fill(INF); used.fill(0);
            do {
                used[j0] = 1; const i0 = p[j0], row = (i0 - 1) * m; let delta = INF, j1 = 0;
                for (let j = 1; j <= m; j++) {
                    if (used[j]) continue;
                    const cur = cost[row + j - 1] - u[i0] - v[j];
                    if (cur < minv[j]) { minv[j] = cur; way[j] = j0 }
                    if (minv[j] < delta) { delta = minv[j]; j1 = j }
                }
                for (let j = 0; j <= m; j++) { if (used[j]) { u[p[j]] += delta; v[j] -= delta } else minv[j] -= delta }
                j0 = j1;
            } while (p[j0] !== 0);
            do { const j1 = way[j0]; p[j0] = p[j1]; j0 = j1 } while (j0);
        }
        const res = new Int32Array(n).fill(-1);
        for (let j = 1; j <= m; j++) if (p[j]) res[p[j] - 1] = j - 1;
        return res;
    }

    // Particles: [ax, ay, ar, aw, bx, by, br, bw, ia, ib, delay]. x, y in lattice steps, r in steps, w = how much of an
    // icon dot it is (1) versus a background dot (0); ia/ib = the dot's index in icon A/B (-1 = background).
    const STRIDE = 11;
    // From icon A to icon B. Dots further apart than `reach` steps don't travel: one sinks, the other rises.
    function plan(A, B, order, reach, bgR) {
        const nA = A.length / 3, nB = B.length / 3, rowsA = nA <= nB;
        const R = rowsA ? A : B, C = rowsA ? B : A, n = Math.min(nA, nB), m = Math.max(nA, nB), cap = reach * reach;
        const cost = new Float64Array(n * m);
        for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) {
            const dx = R[i * 3] - C[j * 3], dy = R[i * 3 + 1] - C[j * 3 + 1], dr = R[i * 3 + 2] - C[j * 3 + 2];
            cost[i * m + j] = Math.min(cap, dx * dx + dy * dy) + dr * dr;
        }
        const match = assign(n, m, cost), P = [];
        const ia = new Int32Array(nA).fill(-1);
        for (let i = 0; i < n; i++) {
            const a = rowsA ? i : match[i], b = rowsA ? match[i] : i;
            const dx = A[a * 3] - B[b * 3], dy = A[a * 3 + 1] - B[b * 3 + 1];
            if (dx * dx + dy * dy >= cap) continue; // too far: sink and rise instead
            ia[a] = b;
        }
        const taken = new Uint8Array(nB);
        for (let a = 0; a < nA; a++) {
            const b = ia[a];
            if (b >= 0) { taken[b] = 1; P.push(A[a * 3], A[a * 3 + 1], A[a * 3 + 2], 1, B[b * 3], B[b * 3 + 1], B[b * 3 + 2], 1, a, b, 0) }
            else P.push(A[a * 3], A[a * 3 + 1], A[a * 3 + 2], 1, A[a * 3], A[a * 3 + 1], bgR, 0, a, -1, 0); // sinks into its grid dot
        }
        for (let b = 0; b < nB; b++) if (!taken[b]) P.push(B[b * 3], B[b * 3 + 1], bgR, 0, B[b * 3], B[b * 3 + 1], B[b * 3 + 2], 1, -1, b, 0); // rises
        stagger(P, order);
        return new Float32Array(P);
    }
    // From the plain grid to icon B: every dot rises out of its grid dot.
    function grow(B, order, bgR) {
        const P = [];
        for (let b = 0; b < B.length / 3; b++) P.push(B[b * 3], B[b * 3 + 1], bgR, 0, B[b * 3], B[b * 3 + 1], B[b * 3 + 2], 1, -1, b, 0);
        stagger(P, order);
        return new Float32Array(P);
    }
    // Each particle's start, 0..1 of the stagger window: top first (wave), centre first (bloom), or shuffled (scatter).
    function stagger(P, order) {
        let y0 = Infinity, y1 = -Infinity, x0 = Infinity, x1 = -Infinity;
        for (let q = 0; q < P.length; q += STRIDE) {
            const x = (P[q] + P[q + 4]) / 2, y = (P[q + 1] + P[q + 5]) / 2;
            x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
        }
        const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, d1 = Math.hypot(x1 - cx, y1 - cy) || 1;
        let seed = 7;
        const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 };
        for (let q = 0; q < P.length; q += STRIDE) {
            const x = (P[q] + P[q + 4]) / 2, y = (P[q + 1] + P[q + 5]) / 2, jitter = rand();
            let d;
            if (order === 'bloom') d = Math.hypot(x - cx, y - cy) / d1 * .92 + jitter * .08;
            else if (order === 'scatter') d = jitter;
            else d = (y - y0) / ((y1 - y0) || 1) * .92 + jitter * .08;
            P[q + 10] = d;
        }
    }

    const easeInOut = (t) => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    // ---------- the engine ----------

    // canvas: absolutely placed over the whole panel that carried the CSS dot tile (its parent).
    // shapes: from fromSvg / fromLottie. opt.box: the element that frames the icon today (where it sits and how big).
    // opt.tile: from readTile. The panel's CSS background can go once the canvas has drawn.
    window.kpDotMorph = function (canvas, shapes, opt = {}) {
        const ctx = canvas.getContext('2d'), panel = canvas.parentElement;
        const o = Object.assign({ rgb: [46, 46, 46], from: 0, order: 'scatter', stagger: .4, path: 'arc', dip: 0, reach: 3, breathe: false, intro: false, reduce: 'auto' }, opt);
        const stats = opt.stats, tile = o.tile;
        shapes.forEach((s) => { if (!s.pitch) s.pitch = pitch(s.dots) });
        const plans = new Map();
        let W = 0, H = 0, step = 0, stepY = 0, cx = 0, cy = 0, bgR = 0, dpr = 1, grid = [], layout = '', region = null, full = true;
        let shown = o.from, target = o.from, tau = .06, visible = false, raf = 0, last = 0, t0 = 0, fade = null;
        const reduced = () => o.reduce === 'force' || (o.reduce === 'auto' && reduceMq.matches);
        const animated = () => !reduced() && shapes.some((s) => s.loop) && (o.breathe || (o.intro && t0 && frameNow(performance.now()) < 106));
        const bgRGB = tile.rgb;

        // Lattice: where the CSS puts the tile's dots. The tile is centred on the panel (background-position 50%), holds
        // 2 dots a side, and its SVG sits inside each tile the way an image fits a box (scaled to fit, centred).
        // cx, cy = lattice point 0, step/stepY = the spacing (half a tile), bgR = the grid dot's radius in steps.
        function resize() {
            const r = panel.getBoundingClientRect();
            if (!r.width) return;
            W = r.width; H = r.height; dpr = Math.min(window.devicePixelRatio || 1, 2);
            const [bw, bh = 'auto'] = getComputedStyle(panel).backgroundSize.split(' ');
            const len = (v, of) => v.endsWith('%') ? parseFloat(v) / 100 * of : parseFloat(v);
            const tw = len(bw, W), th = bh === 'auto' ? tw * tile.h / tile.w : len(bh, H), k = Math.min(tw / tile.w, th / tile.h);
            step = tw / 2; stepY = th / 2;
            cx = (W - tw) / 2 + (tw - tile.w * k) / 2 + tile.x * k; cy = (H - th) / 2 + (th - tile.h * k) / 2 + tile.y * k;
            bgR = tile.r * k / step;
            canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
            canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
            if (stats) stats.backing = canvas.width + '×' + canvas.height;
            snap();
            full = true; wake();
        }
        // Each icon onto the grid: one icon cell = one grid cell, centred where the icon sits today.
        function snap() {
            const b = typeof o.box === 'function' ? o.box() : (o.box || panel).getBoundingClientRect(), p = panel.getBoundingClientRect();
            const bx = b.left - p.left, by = b.top - p.top, bsz = b.width;
            let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
            grid = shapes.map((s) => {
                const k = Math.min(1 / s.w, 1 / s.h) * bsz, ox = bx + (bsz - s.w * k) / 2, oy = by + (bsz - s.h * k) / 2;
                const d = s.dots, n = d.length / 3;
                let ax = Infinity, ay = Infinity, bx2 = -Infinity, by2 = -Infinity;
                for (let i = 0; i < n; i++) { ax = Math.min(ax, d[i * 3]); bx2 = Math.max(bx2, d[i * 3]); ay = Math.min(ay, d[i * 3 + 1]); by2 = Math.max(by2, d[i * 3 + 1]) }
                const mx = (ax + bx2) / 2, my = (ay + by2) / 2; // the icon's middle, in file units
                // grid index of the icon's left/top column so that its middle lands nearest where it is today
                const gx = Math.round((ox + mx * k - cx) / step - (mx - ax) / s.pitch), gy = Math.round((oy + my * k - cy) / stepY - (my - ay) / s.pitch);
                const g = new Float32Array(n * 3);
                for (let i = 0; i < n; i++) {
                    g[i * 3] = gx + Math.round((d[i * 3] - ax) / s.pitch); g[i * 3 + 1] = gy + Math.round((d[i * 3 + 1] - ay) / s.pitch);
                    g[i * 3 + 2] = d[i * 3 + 2] / s.pitch;
                    x0 = Math.min(x0, g[i * 3]); x1 = Math.max(x1, g[i * 3]); y0 = Math.min(y0, g[i * 3 + 1]); y1 = Math.max(y1, g[i * 3 + 1]);
                }
                return g;
            });
            const sig = grid.map((g) => g[0] + ',' + g[1]).join('|');
            if (sig !== layout) { plans.clear(); layout = sig }
            // the only part of the canvas that ever changes (curved paths bow out by up to half a step)
            region = [x0 - 1.5, y0 - 1.5, x1 + 1.5, y1 + 1.5];
        }
        const px = (g) => cx + g * step, py = (g) => cy + g * stepY;
        const planFor = (k) => { // k -> k+1, with k = -1 meaning the plain grid
            const key = k + o.order + o.reach;
            if (!plans.has(key)) plans.set(key, k < 0 ? grow(grid[0], o.order, bgR) : plan(grid[k], grid[k + 1], o.order, o.reach, bgR));
            return plans.get(key);
        };

        // A dot's look at Lottie frame F: [rise 0..1 (its fade-in: up out of the grid), scale, opacity (the loop)].
        const PLAIN = [1, 1, 1];
        function life(s, i, F) {
            if (!s.loop || reduced() || i < 0) return PLAIN;
            if (o.intro && F < s.introLen) return [Math.max(0, Math.min(1, evalKeys(s.intro[i], F) / 100)), 1, 1];
            if (!o.breathe) return PLAIN;
            const lf = Math.min(s.loopLen, Math.max(0, F - s.loopStart));
            return [1, evalKeys(s.loop[i][0], lf) / 100, evalKeys(s.loop[i][1], lf) / 100];
        }
        function frameNow(now) {
            if (!t0) return o.intro ? 0 : 105;
            const F = (now - t0) / 1000 * 60;
            if (!o.intro) return 105 + (F % 95);
            return F < 200 ? F : 105 + ((F - 200) % 95);
        }

        // Dots batched by colour (w, in 24 steps from the grid colour to the icon colour) and opacity.
        const buckets = new Map();
        function dot(x, y, r, w, a) {
            if (r < .05 || a <= .002) return;
            const key = Math.round(w * 24) * 32 + Math.round(a * 20);
            let b = buckets.get(key); if (!b) buckets.set(key, b = []);
            b.push(x, y, r);
        }
        function flush() {
            for (const [key, b] of buckets) {
                if (!b.length) continue;
                const w = Math.floor(key / 32) / 24, a = (key % 32) / 20;
                ctx.fillStyle = 'rgb(' + bgRGB.map((c, i) => Math.round(c + (o.rgb[i] - c) * w)).join(',') + ')';
                ctx.globalAlpha = a; ctx.beginPath();
                for (let q = 0; q < b.length; q += 3) { ctx.moveTo(b[q] + b[q + 2], b[q + 1]); ctx.arc(b[q], b[q + 1], b[q + 2], 0, TAU) }
                ctx.fill(); b.length = 0;
            }
            ctx.globalAlpha = 1;
        }
        // The plain grid inside lattice box [x0, y0, x1, y1] (all of it when no box).
        function background(box) {
            const gx0 = box ? Math.ceil(box[0]) : Math.floor(-cx / step - 1), gx1 = box ? Math.floor(box[2]) : Math.ceil((W - cx) / step);
            const gy0 = box ? Math.ceil(box[1]) : Math.floor(-cy / stepY - 1), gy1 = box ? Math.floor(box[3]) : Math.ceil((H - cy) / stepY);
            for (let gx = gx0; gx <= gx1; gx++) for (let gy = gy0; gy <= gy1; gy++) dot(px(gx), py(gy), bgR * step, 0, 1);
        }

        // One icon exactly (alpha < 1 only for the reduced-motion swap).
        function still(k, F, alpha = 1) {
            const g = grid[k], s = shapes[k];
            for (let i = 0; i < g.length / 3; i++) {
                const l = life(s, i, F), r = (bgR + (g[i * 3 + 2] - bgR) * l[0]) * l[1];
                dot(px(g[i * 3]), py(g[i * 3 + 1]), r * step, l[0], l[2] * alpha);
            }
        }
        // Part way from icon k to icon k+1.
        function between(k, p, F) {
            const P = planFor(k), S = o.stagger, sA = k >= 0 ? shapes[k] : null, sB = shapes[k + 1], arc = o.path === 'arc';
            for (let q = 0; q < P.length; q += STRIDE) {
                const e = easeInOut(Math.min(1, Math.max(0, (p - P[q + 10] * S) / (1 - S))));
                const ax = P[q], ay = P[q + 1], bx = P[q + 4], by = P[q + 5];
                let x = ax + (bx - ax) * e, y = ay + (by - ay) * e;
                const dist = Math.hypot(bx - ax, by - ay), bump = Math.sin(Math.PI * e);
                if (arc && dist > 1e-4) { const k2 = .18 * dist * bump * ((q / STRIDE) % 2 ? 1 : -1); x += -(by - ay) / dist * k2; y += (bx - ax) / dist * k2 }
                // a travelling dot thins out mid-flight (more the further it goes, so dots that only resize don't blink)
                const thin = 1 - o.dip * bump * Math.min(1, dist / 2);
                const la = sA && P[q + 8] >= 0 ? life(sA, P[q + 8], F) : PLAIN, lb = P[q + 9] >= 0 ? life(sB, P[q + 9], F) : PLAIN;
                // the file's fade-in and breathing ride on top: rise pulls a dot back towards the grid dot
                const ra = bgR + (P[q + 2] - bgR) * la[0], rb = bgR + (P[q + 6] - bgR) * lb[0];
                const r = (ra * la[1] + (rb * lb[1] - ra * la[1]) * e) * thin;
                const w = P[q + 3] * la[0] + (P[q + 7] * lb[0] - P[q + 3] * la[0]) * e;
                if (w < .02 && Math.abs(r - bgR) < .004) continue; // sunk all the way: it is the grid dot already drawn there
                dot(px(x), py(y), r * step, w, la[2] + (lb[2] - la[2]) * e);
            }
        }

        function draw(now) {
            const t = stats && performance.now();
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            let box = null;
            if (full) { ctx.clearRect(0, 0, W, H); background(null); flush(); full = false }
            // then only the icon's patch, snapped out to whole device pixels
            const x0 = Math.floor(px(region[0] - .5) * dpr) / dpr, y0 = Math.floor(py(region[1] - .5) * dpr) / dpr;
            const x1 = Math.ceil(px(region[2] + .5) * dpr) / dpr, y1 = Math.ceil(py(region[3] + .5) * dpr) / dpr;
            ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, x1 - x0, y1 - y0); ctx.clip();
            ctx.clearRect(x0, y0, x1 - x0, y1 - y0);
            box = [(x0 - cx) / step - 1, (y0 - cy) / stepY - 1, (x1 - cx) / step + 1, (y1 - cy) / stepY + 1];
            background(box); flush();
            const F = frameNow(now), n = shapes.length;
            if (fade) {
                const a = Math.min(1, (now - fade.t) / 250);
                if (fade.from >= 0) still(fade.from, F, 1 - a);
                if (fade.to >= 0) still(fade.to, F, a);
                if (a >= 1) fade = null;
            } else if (shown >= 0 && Math.abs(shown - Math.round(shown)) < 1e-4) {
                still(Math.round(shown), F);
            } else if (shown > o.from || o.from >= 0) {
                const k = Math.min(n - 2, Math.floor(shown));
                between(k, shown - k, F);
            }
            flush(); ctx.restore();
            if (o.ready) { const f = o.ready; o.ready = null; f() } // first frame is up: the CSS dot tile can go
            if (stats) { stats.draws = (stats.draws || 0) + 1; stats.ms = (stats.ms || 0) + performance.now() - t; stats.shown = shown }
        }

        function frame(now) {
            raf = 0;
            if (!canvas.isConnected) return destroy(); // the page went (Barba)
            if (!visible || !W) return;
            const dt = last ? Math.min(.1, (now - last) / 1000) : 1 / 60; last = now;
            if (reduced()) {
                const k = Math.round(target);
                if (k !== Math.round(shown) && !fade) fade = { from: Math.round(shown), to: k, t: now };
                shown = k;
            } else if (shown !== target) {
                shown += (target - shown) * (1 - Math.exp(-dt / tau));
                // the last 0.4% of a step moves the dots by well under a pixel (they ease into place), so land
                if (Math.abs(target - shown) < .004) shown = target;
            }
            if (!t0 && shapes.some((s) => s.loop)) t0 = now;
            draw(now);
            if (shown !== (reduced() ? Math.round(target) : target) || fade || animated()) raf = requestAnimationFrame(frame); else last = 0;
        }
        function wake() { if (!raf && visible) raf = requestAnimationFrame(frame) }

        const ro = new ResizeObserver(resize); ro.observe(panel); if (o.box && o.box.nodeType) ro.observe(o.box);
        const io = new IntersectionObserver((es) => { visible = es[es.length - 1].isIntersecting; if (visible) { full = true; wake() } }, { rootMargin: '100px' });
        io.observe(canvas);
        reduceMq.addEventListener('change', wake);
        resize();
        function destroy() { ro.disconnect(); io.disconnect(); reduceMq.removeEventListener('change', wake); if (raf) cancelAnimationFrame(raf); raf = 0 }

        return {
            stats,
            // f: a float index (0 = the first icon, 1 = the second...; -1 = the plain grid, when the icons grow in);
            // follow: seconds to catch up (small while scrolling, longer when settling on an icon)
            setTarget(f, follow = .06) { target = Math.max(o.from, Math.min(shapes.length - 1, f)); tau = follow; wake() },
            jump(f) { target = shown = Math.max(o.from, Math.min(shapes.length - 1, f)); wake() },
            set(next) { Object.assign(o, next); plans.clear(); if ('intro' in next) t0 = 0; full = true; wake() },
            get shown() { return shown },
            get grid() { return { step, stepY, cx, cy, bgR, icons: grid } },
            destroy,
        };
    };

    // Scroll driver: the item whose top has crossed the trigger line owns the icon (same lines as today: 35% down the
    // screen on About, 50% on the service pages). The morph runs while an item's top travels through a zone centred on
    // that line, so each item holds its icon exactly for the rest of its height. With settle on, a scroll that stops
    // inside a zone eases the dots on to whichever icon today's trigger would show.
    kpDotMorph.scroll = function (engine, items, opt = {}) {
        const o = Object.assign({ line: .35, zone: .8, from: 0, settle: false, follow: .16, rest: .2 }, opt);
        let idle = 0;
        function progress() {
            const vh = innerHeight, line = vh * o.line;
            let f = o.from;
            items.forEach((el, i) => {
                if (i === 0 && o.from === 0) return;
                const r = el.getBoundingClientRect(), z = Math.max(1, Math.min(r.height, vh) * o.zone);
                f += Math.min(1, Math.max(0, (line + z / 2 - r.top) / z));
            });
            return f;
        }
        function onScroll() {
            if (o.canvas && !o.canvas.isConnected) return destroy(); // the page went (Barba)
            engine.setTarget(progress(), o.follow);
            clearTimeout(idle);
            if (o.settle) idle = setTimeout(() => { const f = progress(); if (f !== Math.round(f)) engine.setTarget(Math.round(f), o.rest) }, 140);
        }
        addEventListener('scroll', onScroll, { passive: true });
        addEventListener('resize', onScroll);
        engine.jump(progress());
        function destroy() { removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll); clearTimeout(idle); engine.destroy() }
        return { set(next) { Object.assign(o, next); onScroll() }, update: onScroll, destroy };
    };

    // ---------- on the site ----------
    // konpo-min 1.13.0, the dotmorph switch: data-dotmorph on the konpo-min tag or ?dotmorph=on|off, else on on *.webflow.io
    // and off on konpo.studio. konpo-min's About pillars (abtVal) and service features (serFea, serFeaLottie) ask first;
    // when this takes the section, their crossfade (and, on service pages, the sticky Lotties) never start. Screens 768px
    // and up only, where the sticky icon column exists; phones keep one still icon per item. Jean's settings from the
    // prototype (2026-10-29): scattered, curved, dots further than 3 steps sink into the grid and rise, hold size, long morph
    // (0.8 of an item), stay where the scroll stops, service icons still after their fade-in, reduced motion followed.
    const KINDS = {
        about: { sec: '.abt-val', panel: '.abt-val-imgs-stick', icons: '.abt-val-imgs-wrap > .abt-val-imgs-item:not(.abt-val-imgs-item-mobile)',
            items: '.abt-val-item', line: .35, from: -1, src: (el) => { const i = el.querySelector('img'); return i && i.getAttribute('src') } },
        services: { sec: '.ser-fea', panel: '.ser-fea-imgs-wrap', icons: '.ser-fea-imgs-wrap > .ser-fea-imgs-item.force-1-1',
            items: '.ser-fea-main-item', line: .5, from: 0, src: (el) => { const p = el.querySelector('dotlottie-player'); return p && p.getAttribute('data-srcUrl') } },
    };
    const SITE = { order: 'scatter', path: 'arc', reach: 3, dip: 0, breathe: false, reduce: 'auto' };
    function parts(root, kind) {
        const k = KINDS[kind], sec = (root && root.querySelector ? root : document).querySelector(k.sec);
        if (!sec) return null;
        const panel = sec.querySelector(k.panel), icons = [...sec.querySelectorAll(k.icons)], items = [...sec.querySelectorAll(k.items)];
        return { k, sec, panel, icons, items, srcs: icons.map(k.src) };
    }
    function eligible(p) {
        return !!(p && window.kpOpts && window.kpOpts.dotmorph === 'on' && innerWidth >= 768 && p.panel && p.icons.length > 1 &&
            p.icons.length === p.items.length && p.srcs.every(Boolean) && document.createElement('canvas').getContext);
    }
    let css = false;
    window.kpDotMorphSite = function (root, kind) {
        const p = parts(root, kind);
        if (!eligible(p) || p.sec.hasAttribute('data-kp-morph')) return false;
        p.sec.setAttribute('data-kp-morph', '');
        if (!css) {
            css = true;
            const st = document.createElement('style');
            st.textContent = '[data-kp-morph].kp-morph-on .abt-val-imgs-wrap>.abt-val-imgs-item,[data-kp-morph].kp-morph-on .ser-fea-imgs-wrap>.ser-fea-imgs-item.force-1-1{visibility:hidden}' +
                '[data-kp-morph].kp-morph-on .abt-val-imgs-stick,[data-kp-morph].kp-morph-on .ser-fea-imgs-wrap{background-image:none}' +
                '.kp-morph-grid{position:absolute;left:0;top:0;display:block;pointer-events:none}';
            document.head.appendChild(st);
        }
        const about = kind === 'about', canvas = document.createElement('canvas');
        canvas.className = 'kp-morph-grid'; canvas.setAttribute('aria-hidden', 'true');
        if (getComputedStyle(p.panel).position === 'static') p.panel.style.position = 'relative';
        p.panel.appendChild(canvas);
        // where today's icon sits: About's is a square of the item's width centred in the sticky column, a service
        // icon fills its .ser-fea-lottie square
        const box = about ? () => {
            const w = p.panel.querySelector('.abt-val-imgs-wrap').getBoundingClientRect(), iw = p.icons[0].getBoundingClientRect().width;
            return { left: w.left + (w.width - iw) / 2, top: w.top + (w.height - iw) / 2, width: iw };
        } : p.icons[0].querySelector('.ser-fea-lottie') || p.icons[0];
        // fetch the icons (the same files the page shows today) once the section is within a screen and a half
        const io = new IntersectionObserver((es) => {
            if (!es.some((e) => e.isIntersecting)) return;
            io.disconnect();
            Promise.all([Promise.all(p.srcs.map((u) => fetch(u).then((r) => { if (!r.ok) throw new Error(r.status); return about ? r.text().then(fromSvg) : r.json().then(fromLottie) }))), readTile(p.panel)])
                .then(([shapes, tile]) => {
                    if (!canvas.isConnected || !tile) throw new Error('gone');
                    const engine = kpDotMorph(canvas, shapes, Object.assign({ tile, box, from: p.k.from, intro: !about, ready: () => p.sec.classList.add('kp-morph-on') }, SITE));
                    kpDotMorph.scroll(engine, p.items, { line: p.k.line, zone: .8, from: p.k.from, settle: false, canvas });
                })
                .catch(() => fallback(p, canvas));
        }, { rootMargin: '150% 0px' });
        io.observe(p.sec);
        return true;
    };
    // Today's behaviour, if the files can't be read: the item at the trigger line shows its icon, and the service
    // Lotties play (fade-in, then frames 105-200 on a loop).
    function fallback(p, canvas) {
        canvas.remove(); p.sec.classList.remove('kp-morph-on');
        const show = () => {
            if (!p.sec.isConnected) return removeEventListener('scroll', show);
            const line = innerHeight * p.k.line;
            p.items.forEach((el, i) => { const r = el.getBoundingClientRect(); if (r.top <= line && r.bottom > line) p.icons.forEach((ic, j) => ic.classList.toggle('active', i === j)) });
        };
        if (p.k.from === 0) p.icons[0].classList.add('active');
        addEventListener('scroll', show, { passive: true }); show();
        p.icons.forEach((ic) => {
            const pl = ic.querySelector('dotlottie-player');
            if (!pl) return;
            pl.setAttribute('autoplay', 'true');
            customElements.whenDefined('dotlottie-player').then(() => pl.updateComplete).then(() => pl.load(pl.getAttribute('data-srcUrl'))).then(() => pl.play());
            pl.addEventListener('frame', (e) => { if (e.detail.frame > 200) pl.seek('105') });
        });
    }
    // konpo-min's serFeaLottie asks this before it loads the sticky Lotties (the morph draws them instead)
    window.kpDotMorphSite.wants = (root, kind) => { const p = parts(root, kind); return !!p && (p.sec.hasAttribute('data-kp-morph') || eligible(p)) };

    kpDotMorph.fromSvg = fromSvg;
    kpDotMorph.fromLottie = fromLottie;
    kpDotMorph.readTile = readTile;
})();
