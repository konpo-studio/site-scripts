// Rebuild: the same dot grid drawn the way calmaria draws its dots sphere (Canvas 2D sized to the
// screen's pixel density), so the dots stay sharp on retina. Lattice, falloff, opacity and trail
// match initTitleGrid exactly by default. What changes is the work: only the patch around the bulge
// is repainted each frame, the resting grid is one batched fill, and the loop sleeps when nothing moves.
// Options (all off by default = today's look): trail timing, dome shape, lens push, grow in/out, touch, reduced motion,
// and a click: the bulge squeezes while the button is down, springs back on release, and a ripple runs out through the grid.
// Link text (case-study next-project hero): moving onto the title text of a live link sends a ripple too.
// Protected text (Home hero, 1.9.0): `protect` lists what the dots must keep clear of. The headline's letters (and boxes)
// go into a quarter-size mask, and a distance field built from it gives every dot its distance to the nearest letter; canvas
// edges keep their own, thinner margin (1.9.2). Inside the clear margin there is never a dot; the bulge, ripple and trace
// shrink to fit outside it. The rest of the hero rules: the resting grid only near the pointer, the bulge fading on the words
// and easing down when the pointer rests, dots on the margin's edge swelling and sliding away as the bulge comes close, and
// an intro that runs out from the words once as a soft pulse of resting-size dots (from the entries marked wave if any; held
// until intro() is called). Without `protect` none of this runs and the title grids draw as before.
(function () {
    const parseRem = (v) => v / 10 * parseFloat(getComputedStyle(document.documentElement).fontSize);
    const TAU = Math.PI * 2;
    const MS = 4; // protect mask cell, px
    const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) };
    // Exact squared Euclidean distance transform (Felzenszwalb & Huttenlocher), one column then one row at a time.
    function edt1d(f, n, d, v, z) {
        let k = 0; v[0] = 0; z[0] = -1e20; z[1] = 1e20;
        for (let q = 1; q < n; q++) {
            let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
            while (s <= z[k]) { k--; s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]) }
            k++; v[k] = q; z[k] = s; z[k + 1] = 1e20;
        }
        k = 0;
        for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; d[q] = (q - v[k]) * (q - v[k]) + f[v[k]] }
    }
    function edt(g, w, h) {
        const n = Math.max(w, h), f = new Float64Array(n), d = new Float64Array(n), v = new Int32Array(n), z = new Float64Array(n + 1);
        for (let x = 0; x < w; x++) {
            for (let y = 0; y < h; y++) f[y] = g[y * w + x];
            edt1d(f, h, d, v, z);
            for (let y = 0; y < h; y++) g[y * w + x] = d[y];
        }
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) f[x] = g[y * w + x];
            edt1d(f, w, d, v, z);
            for (let x = 0; x < w; x++) g[y * w + x] = Math.sqrt(d[x]) * MS;
        }
    }
    const REACH = 24 * 4.8; // px from the bulge centre where today's dot radius reaches 0
    const reduceMq = matchMedia('(prefers-reduced-motion: reduce)');
    // Click ripple: two rings (the second at half strength, 0.11s behind) travelling out at 700px/s, 24px wide,
    // fading with a 0.65s time constant. On the ring a dot grows by up to 60% of the centre dot's radius.
    const RIP = { speed: 700, width: 24, life: .65, gap: .11, end: 2.6, lift: .6, shove: 6 };
    // Protected text's intro: a pulse the shape of the margin running out at 600px/s, 70px wide, that lights resting-size
    // dots at the resting grid's own strength (no growth) and leaves the 'near' grid behind it.
    const INTRO = { speed: .6, width: 70 };
    const PURPLE = [150, 128, 255];
    // The pointer, shared by every grid (same start as konpo-min's: the middle of the screen until the first move).
    const P = window.kpPointer || (window.kpPointer = { x: innerWidth / 2, y: innerHeight / 2, touch: false });
    addEventListener('pointermove', (e) => { P.x = e.clientX; P.y = e.clientY; P.touch = e.pointerType === 'touch'; P.moved = true }, { passive: true, capture: true });

    window.kpDotGrid = function (canvas, opt = {}) {
        const ctx = canvas.getContext('2d');
        const o = Object.assign({ rgb: { x: '46', y: '46', z: '46' }, trail: 'frame', shape: 'cone', lens: 0, enter: 'follow', touch: false, reduce: false, click: 'off', tint: false, textRipple: 'off', text: null, hover: null,
            // protected text (all rem): margin with no dots, band where they grow back; resting grid 'all' or 'near' (within spot),
            // and with 'near' always on from restFrom's top edge down (the Home cards' gaps, where the old static pattern was)
            protect: null, halo: 1.4, fade: 2.4, rest: 'all', spot: 26, restFrom: null, calm: false, relax: false, wrap: 0, repel: 0, hold: false }, opt);
        const stats = opt.stats; // the prototype's cost panel passes an object; on the site nothing is counted
        const size = parseRem(2), step = parseRem(20), pad = parseRem(1), top = size * 4.8;
        let cw, ch, kx, ky, rw, rh, sx, sy, ox, oy;
        // Same test as konpo-min's isTouchDevice(); today a touch screen gets no grid at all above 991px.
        const touchDev = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
        let mouse = null, amp = o.enter === 'grow' || touchDev ? 0 : 1, drawnAt = null, full = true;
        let visible = false, raf = 0, last = 0, touching = false;
        // click state: live ripples, the bulge's spring (1 = at rest), the patch the ripples covered last frame
        let ripples = [], pulse = 1, pulseV = 0, pressed = false, ripBox = null, lastType = 'mouse';
        // protected text: the field (H, built on resize once not held), when the pointer last moved, the intro wave
        let H = null, rem = 0, held = !!(o.protect && o.hold), lastMove = 0, relaxTimer = 0, introAt = 0, introDur = 0;
        const reduced = () => o.reduce && (o.reduce === 'force' || reduceMq.matches);
        const api = { paused: false, stats, set, ripple: (x, y, s) => { if (!reduced() && visible) { ripple({ clientX: x, clientY: y }, s); wake() } }, getMouse: () => mouse, setMouse: (m) => { mouse = m && { x: m.x, y: m.y }; wake() }, invalidate: () => { full = true; wake() },
            resize: () => resize(),
            // lay the grid down: re-measure the words where they ended up, then one wave runs out from them
            intro: () => { if (!o.protect) return; held = false; resize(); if (!H) return; introAt = performance.now(); introDur = (H.maxU + 200) / INTRO.speed; full = true; wake() },
            clearance: (x, y) => H ? clear(x, y)[0] : 1 };

        function set(next) {
            Object.assign(o, next); if (o.enter !== 'grow' && !touchDev) amp = 1;
            if (o.textRipple !== 'repeat' && textTimer) { clearInterval(textTimer); textTimer = 0 }
            full = true; wake();
        }

        function resize() {
            const p = canvas.parentElement.getBoundingClientRect();
            if (!p.width) return;
            // Same lattice space as today (whole px of the parent), drawn at device pixels.
            cw = Math.ceil(p.width); ch = Math.ceil(p.height);
            const cssH = ch * p.width / cw, dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.style.height = cssH + 'px';
            canvas.width = Math.round(p.width * dpr); canvas.height = Math.round(cssH * dpr);
            kx = canvas.width / cw; ky = canvas.height / ch;
            rw = Math.ceil(cw / step) + 1; rh = Math.ceil(ch / step) + 1;
            sx = (cw - size) / (rw + pad); sy = (ch - size) / (rh + pad);
            ox = (cw / rw) * (pad / 2); oy = (ch / rh) * (pad / 2);
            if (stats) stats.backing = canvas.width + '×' + canvas.height;
            if (o.protect && !held) mask();
            full = true; wake();
        }

        // The protected field: letters (each character drawn where the page drew it) and padded boxes into a quarter-size
        // mask, its distance field, then per dot: clearance (0 in the margin, 1 clear of it), room before the margin (canvas
        // edges included), and the way out (for the push away from the words).
        function mask() {
            rem = parseRem(10);
            const gw = Math.ceil(cw / MS), gh = Math.ceil(ch / MS);
            const layer = () => {
                const c = document.createElement('canvas'); c.width = gw; c.height = gh;
                const x = c.getContext('2d', { willReadFrequently: true }); x.setTransform(1 / MS, 0, 0, 1 / MS, 0, 0); return x;
            };
            const toField = (x) => {
                const px = x.getImageData(0, 0, gw, gh).data, f = new Float64Array(gw * gh);
                for (let i = 0; i < gw * gh; i++) f[i] = px[i * 4 + 3] > 60 ? 0 : 1e20;
                edt(f, gw, gh); return f;
            };
            // g: everything protected; w: the letters alone (the bulge calms near them); v: the letters the intro wave runs
            // out from (entries marked wave, else all of them)
            const g = layer(), w = layer(), waves = o.protect.some((q) => q.wave), v = waves && layer();
            const cr = canvas.getBoundingClientRect(), rg = document.createRange(), desc = {};
            for (const q of o.protect) {
                if (q.edge) continue; // canvas edges: clear() below
                const el = typeof q.el === 'string' ? document.querySelector(q.el) : q.el;
                if (!el || !el.getClientRects().length) continue;
                if (q.as === 'box') {
                    const b = el.getBoundingClientRect(), pad = (q.pad || 0) * rem;
                    g.beginPath(); g.roundRect ? g.roundRect(b.left - cr.left - pad, b.top - cr.top - pad, b.width + pad * 2, b.height + pad * 2, pad + 4) : g.rect(b.left - cr.left - pad, b.top - cr.top - pad, b.width + pad * 2, b.height + pad * 2); g.fill();
                    continue;
                }
                const into = [g, w].concat(v && q.wave ? [v] : []);
                const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
                for (let n = tw.nextNode(); n; n = tw.nextNode()) {
                    if (n.parentElement.closest('.kp-sr')) continue; // the screen-reader copy of split words
                    const cs = getComputedStyle(n.parentElement), font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
                    for (const x of into) x.font = font;
                    if (!(font in desc)) desc[font] = g.measureText('Hg').fontBoundingBoxDescent || parseFloat(cs.fontSize) * .22;
                    const t = n.data;
                    for (let i = 0; i < t.length; i++) {
                        if (t[i] === ' ' || t[i] === '\n' || t[i] === '\u00a0') continue;
                        rg.setStart(n, i); rg.setEnd(n, i + 1);
                        const b = rg.getClientRects()[0];
                        if (!b || b.width < 1) continue;
                        for (const x of into) x.fillText(t[i], b.left - cr.left, b.bottom - desc[font] - cr.top);
                    }
                    // a struck word (.txt-disable draws its line as a pseudo-element): the line counts as ink too
                    if (n.parentElement.closest('.txt-disable') || /line-through/.test(cs.textDecorationLine)) {
                        rg.selectNodeContents(n);
                        for (const b of rg.getClientRects()) g.fillRect(b.left - cr.left - 2, b.top - cr.top + b.height * .45, b.width + 4, b.height * .15);
                    }
                }
            }
            const field = toField(g), words = toField(w), wave = v ? toField(v) : words;
            H = { field, words, gw, gh };
            const N = (rw + 1) * (rh + 1), halo = o.halo * rem;
            const C = new Float32Array(N), D = new Float32Array(N), WD = new Float32Array(N), S = new Float32Array(N), GX = new Float32Array(N), GY = new Float32Array(N);
            const from = o.restFrom && o.restFrom.getBoundingClientRect().top - cr.top;
            let maxU = 0;
            for (let j = 0; j <= rh; j++) for (let i = 0; i <= rw; i++) {
                const k = j * (rw + 1) + i, x = sx * i + ox, y = sy * j + oy, [c, room] = clear(x, y);
                D[k] = room; C[k] = c; WD[k] = dist(x, y, wave);
                if (C[k] > 0 && WD[k] - halo > maxU) maxU = WD[k] - halo;
                if (from != null) S[k] = smooth(from - step * 2.5, from + 2, y); // fades in over the two rows above
                const gx = clear(x + MS, y)[1] - clear(x - MS, y)[1], gy = clear(x, y + MS)[1] - clear(x, y - MS)[1], gl = Math.hypot(gx, gy) || 1;
                GX[k] = gx / gl; GY[k] = gy / gl;
            }
            Object.assign(H, { C, D, GX, GY, WD, S, maxU: Math.min(maxU, 4000) });
        }
        // [clearance, room] at a point: room is how far a dot's edge may reach before the margin. Letters and boxes take the
        // halo and fade; a canvas edge its own (rem, default .3 and 1), so the dots can run up close to the nav line.
        function clear(x, y) {
            const halo = o.halo * rem, d = dist(x, y);
            let c = smooth(halo, halo + o.fade * rem, d), room = d - halo;
            for (const q of o.protect) {
                if (!q.edge) continue;
                const e = q.edge === 'top' ? y : ch - y, eh = (q.halo != null ? q.halo : .3) * rem, ef = (q.fade != null ? q.fade : 1) * rem;
                c = Math.min(c, smooth(eh, eh + ef, e)); room = Math.min(room, e - eh);
            }
            return [c, room];
        }
        // distance (px) from a point to the nearest protected ink (or, given the words field, the nearest letter), bilinear between mask cells
        function dist(x, y, field = H.field) {
            const { gw, gh } = H;
            const fx = Math.min(gw - 1.001, Math.max(0, x / MS - .5)), fy = Math.min(gh - 1.001, Math.max(0, y / MS - .5));
            const i = fx | 0, j = fy | 0, u = fx - i, v = fy - j, a = field[j * gw + i], b = field[j * gw + i + 1], c = field[(j + 1) * gw + i], d = field[(j + 1) * gw + i + 1];
            return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
        }

        // 0..1 bulge strength at distance d: today's straight cone, or a rounded dome (calmaria's sphere curve)
        const shape = (d) => {
            if (d >= REACH) return 0;
            const t = d / REACH;
            return o.shape === 'dome' ? Math.pow(Math.sqrt(1 - t * t), 1.15) : 1 - t;
        };

        // The rings alive at time now: [x, y, radius, strength] for each.
        function rings(now) {
            const out = [];
            for (const rp of ripples) {
                const t = (now - rp.t0) / 1000;
                out.push(rp.x, rp.y, RIP.speed * t, rp.s * Math.exp(-t / RIP.life));
                if (t > RIP.gap) out.push(rp.x, rp.y, RIP.speed * (t - RIP.gap), rp.s * .5 * Math.exp(-(t - RIP.gap) / RIP.life));
            }
            return out;
        }
        function ringBox(rg) {
            let b = null;
            for (let q = 0; q < rg.length; q += 4) {
                const e = rg[q + 2] + RIP.width * 3 + top + RIP.shove + 2;
                b = b ? [Math.min(b[0], rg[q] - e), Math.min(b[1], rg[q + 1] - e), Math.max(b[2], rg[q] + e), Math.max(b[3], rg[q + 1] + e)] : [rg[q] - e, rg[q + 1] - e, rg[q] + e, rg[q + 1] + e];
            }
            return b;
        }

        function draw(now) {
            const t0 = stats && performance.now(), m = mouse, near = H && o.rest === 'near';
            let reach = REACH * (1 + o.lens) + top * Math.max(1, pulse) + 2;
            // protected text: the trace and the push reach a little further out, and the resting grid shows round the pointer
            if (H) reach = Math.max(reach, REACH * 1.6 + top + step, near ? o.spot * rem + step : 0);
            const rg = rings(now), box = ringBox(rg), wave = o.click === 'wave';
            let x0 = 0, y0 = 0, x1 = cw, y1 = ch;
            if (!full && drawnAt && !introAt) {
                x0 = Math.min(m.x, drawnAt.x) - reach; x1 = Math.max(m.x, drawnAt.x) + reach;
                y0 = Math.min(m.y, drawnAt.y) - reach; y1 = Math.max(m.y, drawnAt.y) + reach;
                // plus wherever the ripples are now, and were last frame (so a finished ring gets wiped)
                for (const b of [box, ripBox]) if (b) { x0 = Math.min(x0, b[0]); y0 = Math.min(y0, b[1]); x1 = Math.max(x1, b[2]); y1 = Math.max(y1, b[3]) }
            }
            ripBox = box;
            // device-pixel patch to repaint, clipped to the canvas
            const px0 = Math.max(0, Math.floor(x0 * kx)), py0 = Math.max(0, Math.floor(y0 * ky));
            const px1 = Math.min(canvas.width, Math.ceil(x1 * kx)), py1 = Math.min(canvas.height, Math.ceil(y1 * ky));
            drawnAt = { x: m.x, y: m.y }; full = false;
            if (px1 <= px0 || py1 <= py0) return;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(px0, py0, px1 - px0, py1 - py0);
            ctx.save();
            ctx.beginPath(); ctx.rect(px0, py0, px1 - px0, py1 - py0); ctx.clip();
            ctx.setTransform(kx, 0, 0, ky, 0, 0);
            ctx.fillStyle = `rgb(${o.rgb.x}, ${o.rgb.y}, ${o.rgb.z})`;
            const ux0 = px0 / kx - 2, ux1 = px1 / kx + 2, uy0 = py0 / ky - 2, uy1 = py1 / ky + 2;
            let i0 = Math.max(0, Math.ceil((ux0 - ox) / sx)), i1 = Math.min(rw, Math.floor((ux1 - ox) / sx));
            let j0 = Math.max(0, Math.ceil((uy0 - oy) / sy)), j1 = Math.min(rh, Math.floor((uy1 - oy) / sy));
            const big = [];
            let n = 0;
            // protected text: dots near the patch edge can be pushed into it, so look a little wider; resting dots fade with
            // distance from the pointer ('near'), so they're drawn in alpha buckets instead of one batch
            const halo = H ? o.halo * rem : 0, spot = o.spot * rem, front = introAt ? (now - introAt) * INTRO.speed : 0, buckets = H && new Map();
            if (H) { const e = Math.ceil(step / sx); i0 = Math.max(0, i0 - e); i1 = Math.min(rw, i1 + e); j0 = Math.max(0, j0 - e); j1 = Math.min(rh, j1 + e) }
            ctx.beginPath();
            for (let j = j0; j <= j1; j++) {
                const y = sy * j + oy;
                for (let i = i0; i <= i1; i++) {
                    const x = sx * i + ox, dx = x - m.x, dy = y - m.y, d = Math.sqrt(dx * dx + dy * dy);
                    let c = 1, rv = 1, q0 = 0;
                    if (H) {
                        q0 = j * (rw + 1) + i; c = H.C[q0];
                        if (c <= 0) continue; // inside the clear margin: never a dot
                        if (near) rv = Math.max(1 - smooth(spot * .45, spot, d), H.S[q0]);
                        // intro: a soft pulse the shape of the margin runs outward once and lays the resting grid down behind it
                        if (introAt) { const u = H.WD[q0] - halo; rv = Math.max(rv * smooth(front, front - INTRO.width * 2, u), Math.exp(-(((u - front + INTRO.width * .6) / INTRO.width) ** 2))) }
                    }
                    const s = shape(d) * amp; // how far into the bulge this dot sits (0 = resting grid, 1 = centre)
                    let r = size * 4.8 * s * pulse * c; // (c = 1 on the title grids)
                    if (r < 1) r = 1;
                    // ripple: how much ring sits on this dot (0 = none), and the outward shove for the wave version
                    let lift = 0, wx = 0, wy = 0;
                    for (let q = 0; q < rg.length; q += 4) {
                        const ex = x - rg[q], ey = y - rg[q + 1], ed = Math.sqrt(ex * ex + ey * ey) || 1, u = (ed - rg[q + 2]) / RIP.width;
                        if (u <= -3 || u >= 3) continue;
                        const g = Math.exp(-u * u) * rg[q + 3];
                        lift += g;
                        if (wave) { wx += ex / ed * g * RIP.shove; wy += ey / ed * g * RIP.shove }
                    }
                    // the bulge only pops once (its spring below): the rings leave its inner half alone and fade in across the outer half
                    if (s > 0 && lift) { const c = s >= .5 ? 0 : 1 - s * s * (12 - 16 * s); lift *= c; wx *= c; wy *= c }
                    if (lift < .01) lift = wx = wy = 0; // the ring's far tails: leave those dots in the batched fill
                    if (lift > 1.5) lift = 1.5;
                    r += top * RIP.lift * lift * c;
                    let a = (r + 1) / 8;
                    if (a < .56) a = .56;
                    n++;
                    if (H) {
                        // the margin's edge swelling as the bulge comes near (it traces the words)
                        const nb = amp * Math.max(0, 1 - d / (REACH * 1.6));
                        if (o.wrap && nb > 0 && c < 1) r += size * 2.2 * o.wrap * 4 * c * (1 - c) * nb;
                        // a dot's edge never reaches into the margin, however big the bulge, ripple or trace makes it
                        const room = H.D[q0];
                        if (r > room) r = room;
                        if (r < 1) r = 1;
                        a = (r + 1) / 8; if (a < .56) a = .56; if (a > 1) a = 1;
                        // resting dots take the 'near' visibility and fade in across the margin's edge; grown dots go to full colour
                        a = (.56 * rv + (a - .56 * rv) * smooth(1, 2.6, r)) * (c < .55 ? c / .55 : 1);
                        if (r <= 1.01) {
                            if (a < .02) continue;
                            const key = Math.round(a * 20); let p = buckets.get(key);
                            if (!p) buckets.set(key, p = []);
                            p.push(x, y); continue;
                        }
                        // the lens push fades toward the words (no shove into the margin), plus the slide away from them
                        const push = o.lens && d < REACH ? 1 + o.lens * Math.sqrt(1 - (d / REACH) ** 2) * amp * c : 1;
                        const away = o.repel ? o.repel * step * .7 * (1 - c) * nb : 0;
                        big.push(m.x + dx * push + wx + H.GX[q0] * away, m.y + dy * push + wy + H.GY[q0] * away, r, a, 0);
                        continue;
                    }
                    if (r === 1 && a === .56) { ctx.moveTo(x + 1, y); ctx.arc(x, y, 1, 0, TAU); continue }
                    // calmaria's lens: dots inside the bulge are pushed outward along a hemisphere
                    const push = o.lens && d < REACH ? 1 + o.lens * Math.sqrt(1 - (d / REACH) ** 2) * amp : 1;
                    big.push(m.x + dx * push + wx, m.y + dy * push + wy, r, a > 1 ? 1 : a, o.tint ? Math.min(1, lift) : 0);
                }
            }
            ctx.globalAlpha = .56; ctx.fill(); // every resting dot in the patch in one fill
            if (buckets) for (const [key, p] of buckets) {
                ctx.globalAlpha = key / 20; ctx.beginPath();
                for (let q = 0; q < p.length; q += 2) { ctx.moveTo(p[q] + 1, p[q + 1]); ctx.arc(p[q], p[q + 1], 1, 0, TAU) }
                ctx.fill();
            }
            const base = [+o.rgb.x, +o.rgb.y, +o.rgb.z];
            for (let b = 0; b < big.length; b += 5) {
                ctx.globalAlpha = big[b + 3];
                // purple ripple: blend toward --purple in 8 steps, so the colour string only changes a few times
                const tn = Math.round(big[b + 4] * 8) / 8;
                ctx.fillStyle = tn ? `rgb(${base.map((c, z) => Math.round(c + (PURPLE[z] - c) * tn)).join(',')})` : `rgb(${base.join(',')})`;
                ctx.beginPath(); ctx.arc(big[b], big[b + 1], big[b + 2], 0, TAU); ctx.fill();
            }
            ctx.restore();
            if (stats) {
                const ms = performance.now() - t0;
                stats.draws = (stats.draws || 0) + 1; stats.ms = (stats.ms || 0) + ms; stats.dots = n; stats.px = (px1 - px0) * (py1 - py0);
                (stats.samples || (stats.samples = [])).push(ms);
            }
        }

        function frame(now) {
            raf = 0;
            if (wasConnected && !canvas.isConnected) return stop();
            if (!visible || api.paused || !cw) return;
            if (held) { last = 0; return } // protected text, held: blank until intro()
            const t0 = stats && performance.now();
            if (stats) stats.frames = (stats.frames || 0) + 1;
            const r = canvas.getBoundingClientRect(), p = window.kpPointer;
            let tx = p.x - r.left, ty = p.y - r.top;
            // protected text: no pointer until it has really moved (kpPointer starts mid-screen, right over the headline)
            if (H && !p.moved) tx = ty = -1e4;
            if (!mouse || (H && mouse.x === -1e4 && tx !== -1e4)) mouse = { x: tx, y: ty }; // first frame after scrolling back in: start under the pointer
            // today: 6% of the way per frame, so the trail is twice as quick at 120 fps as at 60 fps
            const dt = last ? Math.min(100, now - last) : 16.7;
            last = now;
            const k = o.reduce && (o.reduce === 'force' || reduceMq.matches) ? 1
                : o.trail === 'frame' ? .06 : 1 - Math.pow(.94, dt / (1000 / +o.trail));
            mouse.x += (tx - mouse.x) * k; mouse.y += (ty - mouse.y) * k;
            let goal = 1;
            if (touchDev) goal = o.touch && touching ? 1 : 0; // resting grid on touch screens, a bulge under the finger with Touch on
            else if (o.enter === 'grow') { const h = (o.hover || canvas.parentElement).getBoundingClientRect(); goal = p.x >= h.left && p.x <= h.right && p.y >= h.top && p.y <= h.bottom ? 1 : 0 }
            // protected text: the bulge fades while the pointer is on the words, and eases down (slowly) once it rests
            const still = H && o.relax && now - lastMove > 1400;
            if (H && goal) {
                if (o.calm) goal *= .12 + .88 * smooth(0, (o.halo + o.fade) * rem * 1.4, dist(tx, ty, H.words));
                if (still) goal *= .38;
            }
            const ampWas = amp;
            amp += (goal - amp) * (still && amp > goal ? 1 - Math.pow(.988, dt / 8.333) : k); if (Math.abs(goal - amp) < .002) amp = goal;
            if (introAt && now - introAt > introDur) { introAt = 0; full = true } // the wave is out: one clean redraw
            // the bulge's spring: eases down to 78% while the button is down (critically damped, no wobble), and on release
            // a kick pops it past 1 once (about 10%) before it settles (the swing back is 0.4%, too small to see)
            const pulseWas = pulse;
            if (pressed || pulse !== 1 || pulseV) {
                const h = Math.min(dt, 33) / 1000;
                pulseV += (300 * ((pressed ? .78 : 1) - pulse) - (pressed ? 35 : 24) * pulseV) * h;
                pulse += pulseV * h;
                if (!pressed && Math.abs(pulse - 1) < .001 && Math.abs(pulseV) < .01) { pulse = 1; pulseV = 0 }
            }
            ripples = ripples.filter((rp) => now - rp.t0 < RIP.end * 1000);
            const moved = !drawnAt || Math.abs(mouse.x - drawnAt.x) >= .05 || Math.abs(mouse.y - drawnAt.y) >= .05;
            if (full || moved || amp !== ampWas || pulse !== pulseWas || ripples.length || ripBox || introAt) draw(now);
            if (stats) stats.loopMs = (stats.loopMs || 0) + performance.now() - t0;
            // keep going until the bulge has caught up with the pointer and the click has played out, then sleep
            if (Math.abs(tx - mouse.x) >= .05 || Math.abs(ty - mouse.y) >= .05 || amp !== goal || pressed || pulse !== 1 || ripples.length || ripBox || introAt) schedule();
            else last = 0;
        }
        function schedule() { if (!raf) raf = requestAnimationFrame(frame) }
        function wake() { if (!canvas.isConnected && wasConnected) return stop(); if (visible && !api.paused) schedule() }
        api.wake = wake;

        // Wake on anything that can move the bulge: the pointer, a scroll (the canvas moves under a still pointer), a resize.
        window.addEventListener('pointermove', wake, { passive: true });
        window.addEventListener('scroll', wake, { passive: true });
        window.addEventListener('resize', resize);
        // protected text: note when the pointer (or the page under it) last moved, and wake once it has rested long enough to relax
        const stir = () => { lastMove = performance.now(); if (o.relax) { clearTimeout(relaxTimer); relaxTimer = setTimeout(wake, 1450) } };
        if (o.protect) { window.addEventListener('pointermove', stir, { passive: true }); window.addEventListener('scroll', stir, { passive: true }) }
        // Touch (off today): the bulge follows the finger while it's down, then shrinks away.
        // touchmove keeps firing while the page scrolls, where pointer events stop at pointercancel.
        const t = (on) => (e) => {
            if (!o.touch) return;
            touching = on;
            if (on && e.touches[0]) Object.assign(window.kpPointer, { x: e.touches[0].clientX, y: e.touches[0].clientY, touch: true });
            wake();
        };
        const tOn = t(true), tOff = t(false);
        // Click: a mouse press squeezes the bulge and starts a ripple where it landed; a tap (click event, so a scroll doesn't count) does both at once.
        const inBlock = (x, y) => { const h = (o.hover || canvas.parentElement).getBoundingClientRect(); return x >= h.left && x <= h.right && y >= h.top && y <= h.bottom };
        function ripple(e, s = 1) {
            const r = canvas.getBoundingClientRect();
            ripples.push({ x: e.clientX - r.left, y: e.clientY - r.top, t0: performance.now(), s });
            if (ripples.length > 4) ripples.shift();
        }
        // a click inside a link leaves the page, so it gets no ripple (the hover ripple below covers links)
        const inLink = (e) => e.target && e.target.closest && e.target.closest('a[href]');
        const down = (e) => {
            lastType = e.pointerType;
            if (o.click === 'off' || e.button !== 0 || e.pointerType === 'touch' || reduced() || !visible || !inBlock(e.clientX, e.clientY) || inLink(e)) return;
            ripple(e); pressed = true; wake();
        };
        const up = () => { if (!pressed) return; pressed = false; pulseV += 10; wake() };
        const tap = (e) => {
            if (lastType !== 'touch' || o.click === 'off' || reduced() || !visible || !inBlock(e.clientX, e.clientY) || inLink(e)) return;
            ripple(e); pulse = .78; pulseV = 10; wake();
        };
        // Link text: a ripple from the pointer each time it moves onto the title's text (the glyph lines, not the
        // whole block), at most every 0.45s, and only while the text sits inside a live link. 'repeat' adds a softer
        // one every 1.3s while the pointer stays on the text.
        let onText = false, textAt = 0, textTimer = 0;
        const liveLink = () => { const a = o.text && o.text.closest('a[href]'); return a && a.getAttribute('href') !== '#' && a.getAttribute('href') !== '' };
        function overText(x, y) {
            const b = o.text.getBoundingClientRect();
            if (x < b.left || x > b.right || y < b.top || y > b.bottom) return false;
            const rg = document.createRange(); rg.selectNodeContents(o.text);
            for (const l of rg.getClientRects()) if (x >= l.left - 4 && x <= l.right + 4 && y >= l.top - 4 && y <= l.bottom + 4) return true;
            return false;
        }
        const hoverText = (e) => {
            if (o.textRipple === 'off' || !o.text || e.pointerType === 'touch') return;
            const now = overText(e.clientX, e.clientY) && liveLink();
            if (now && !onText && performance.now() - textAt > 450) { textAt = performance.now(); api.ripple(e.clientX, e.clientY, 1) }
            if (now !== onText) {
                clearInterval(textTimer); textTimer = 0;
                if (now && o.textRipple === 'repeat') textTimer = setInterval(() => api.ripple(window.kpPointer.x, window.kpPointer.y, .6), 1300);
            }
            onText = now;
        };
        window.addEventListener('pointermove', hoverText, { passive: true });
        window.addEventListener('pointerdown', down, { passive: true });
        window.addEventListener('pointerup', up, { passive: true });
        window.addEventListener('pointercancel', up, { passive: true });
        window.addEventListener('click', tap, { passive: true });
        window.addEventListener('touchstart', tOn, { passive: true });
        window.addEventListener('touchmove', tOn, { passive: true });
        window.addEventListener('touchend', tOff, { passive: true });
        window.addEventListener('touchcancel', tOff, { passive: true });
        // Run only within a screen of the viewport; everything else costs nothing.
        const io = new IntersectionObserver((es) => {
            visible = es[es.length - 1].isIntersecting;
            if (visible) { full = true; wake() } else mouse = null;
        }, { rootMargin: '100% 0px' });
        io.observe(canvas);
        canvas.addEventListener('contextrestored', () => { full = true; wake() });
        // Barba swaps the page out: let go of everything once the canvas has left the document.
        const wasConnected = canvas.isConnected;
        function stop() {
            io.disconnect(); cancelAnimationFrame(raf); raf = 0;
            window.removeEventListener('pointermove', wake); window.removeEventListener('scroll', wake); window.removeEventListener('resize', resize);
            ['touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach((n, i) => window.removeEventListener(n, i < 2 ? tOn : tOff));
            window.removeEventListener('pointerdown', down); window.removeEventListener('pointerup', up); window.removeEventListener('pointercancel', up); window.removeEventListener('click', tap);
            window.removeEventListener('pointermove', hoverText); clearInterval(textTimer);
            window.removeEventListener('pointermove', stir); window.removeEventListener('scroll', stir); clearTimeout(relaxTimer);
        }
        resize();
        return api;
    };

    // On the site (konpo-min 1.8.0): initTitleGrid offers each title canvas here first. With the dotgrid switch on "new"
    // (kpOptions: the data-dotgrid attribute or ?dotgrid=, else new on *.webflow.io and old on konpo.studio) this grid takes
    // it, with the settings Jean picked in the prototype on 2026-10-29; otherwise the old grid runs as before.
    const SITE = { trail: '120', shape: 'cone', lens: .2, enter: 'grow', click: 'ripple' };
    window.kpDotGridSite = function (canvas, rgb) {
        if (!canvas || !canvas.getContext || !window.kpOpts || window.kpOpts.dotgrid !== 'new') return false;
        const link = canvas.closest('a[href]');
        window.kpDotGrid(canvas, Object.assign({
            rgb, textRipple: 'enter',
            text: link && link.querySelector('.projdtl-hero-title'),
            hover: canvas.closest('[data-move="wrap"], .projdtl-hero-title-wrap')
        }, SITE));
        return true;
    };

    // Home hero (konpo-min 1.9.0, the herodots switch: data-herodots on the konpo-min tag or ?herodots=on|off, else on on
    // *.webflow.io and off on konpo.studio). The title grids' dots (SITE above) across the hero, from under the nav fill down
    // behind the client cards (it replaces their old static dot pattern, so the cards' gaps are part of the same grid), keeping
    // clear of the headline's letters and the globe + sub copy, with the hero rules Jean picked in the prototype on 2026-10-29:
    // tight margin, resting grid near the pointer (and always in the cards' gaps, as before), bulge fades on the words and
    // relaxes when still, dots trace the words and slide away from them, click pulse + ripple. Desktop pointers only, like the title
    // grids (no touch, wider than 991px). The grid stays blank until the headline's own reveal (konpo-min's kpHero timeline)
    // has finished, then one soft pulse of resting-size dots runs out from the words (Jean, 1.9.2: "way more subtle"), and the
    // dots run up to just under the nav line.
    window.kpHeroDotsSite = function (root) {
        const hero = (root && root.querySelector ? root : document).querySelector('.home-hero');
        const title = hero && hero.querySelector('.home-hero-title');
        if (!title || !window.kpOpts || window.kpOpts.herodots !== 'on' || hero.querySelector('.kp-hero-dots')) return false;
        if (('ontouchstart' in window) || navigator.maxTouchPoints > 0 || innerWidth <= 991) return false;
        const wrap = document.createElement('div'), canvas = document.createElement('canvas');
        wrap.className = 'kp-hero-dots'; wrap.setAttribute('aria-hidden', 'true');
        // behind the hero's content (the hero is its own stacking context), above its background
        wrap.style.cssText = 'position:absolute;left:0;right:0;z-index:-1;pointer-events:none';
        canvas.style.cssText = 'display:block;width:100%';
        wrap.appendChild(canvas); hero.insertBefore(wrap, hero.firstChild);
        // from the nav fill's bottom edge (8rem) down behind the client cards, whose old static dot pattern this field replaces
        const cards = hero.querySelector('.home-hero-client-wrap'), old = hero.querySelector('.bg-dots.home-vid-dots');
        if (old) old.style.display = 'none';
        const fit = () => {
            if (!wrap.isConnected) return removeEventListener('resize', fit); // Barba took the page away
            const hb = hero.getBoundingClientRect(), top = parseRem(80);
            const bottom = cards ? cards.getBoundingClientRect().bottom - hb.top : hb.height;
            wrap.style.top = top + 'px'; wrap.style.height = Math.max(0, Math.round(bottom - top)) + 'px';
        };
        fit();
        addEventListener('resize', fit); // registered before the grid's own resize, so that one measures the new size
        const grid = window.kpDotGrid(canvas, Object.assign({
            rgb: { x: '46', y: '46', z: '46' },
            // the sub copy by its letters (a padded box would cut into the rows above the cards), its globe as a box; the wave
            // runs out from the headline only
            protect: [{ el: title, wave: true }, { el: hero.querySelector('.home-hero-sub') }, { el: hero.querySelector('.home-hero-sub-wrap .ic-embed'), as: 'box', pad: .4 }, { edge: 'top' }], // the top edge is the nav line
            halo: 1.4, fade: 2.4, rest: 'near', spot: 26, restFrom: cards, calm: true, relax: true, wrap: .5, repel: 1, hold: true
        }, SITE));
        // wait for the headline: konpo-min builds kpHero once the loader lets it (up to ~20s on a slow load)
        const t0 = Date.now(), go = () => requestAnimationFrame(() => { fit(); grid.intro() });
        const wait = () => {
            const tl = window.gsap && gsap.getById && gsap.getById('kpHero');
            if (tl) tl.then(go); else if (wrap.isConnected) Date.now() - t0 < 30000 ? setTimeout(wait, 100) : go();
        };
        wait();
        canvas.kpDots = grid; // for checks from the console
        return grid;
    };
})();
