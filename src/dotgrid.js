// Rebuild: the same dot grid drawn the way calmaria draws its dots sphere (Canvas 2D sized to the
// screen's pixel density), so the dots stay sharp on retina. Lattice, falloff, opacity and trail
// match initTitleGrid exactly by default. What changes is the work: only the patch around the bulge
// is repainted each frame, the resting grid is one batched fill, and the loop sleeps when nothing moves.
// Options (all off by default = today's look): trail timing, dome shape, lens push, grow in/out, touch, reduced motion,
// and a click: the bulge squeezes while the button is down, springs back on release, and a ripple runs out through the grid.
// Link text (case-study next-project hero): moving onto the title text of a live link sends a ripple too.
(function () {
    const parseRem = (v) => v / 10 * parseFloat(getComputedStyle(document.documentElement).fontSize);
    const TAU = Math.PI * 2;
    const REACH = 24 * 4.8; // px from the bulge centre where today's dot radius reaches 0
    const reduceMq = matchMedia('(prefers-reduced-motion: reduce)');
    // Click ripple: two rings (the second at half strength, 0.11s behind) travelling out at 700px/s, 24px wide,
    // fading with a 0.65s time constant. On the ring a dot grows by up to 60% of the centre dot's radius.
    const RIP = { speed: 700, width: 24, life: .65, gap: .11, end: 2.6, lift: .6, shove: 6 };
    const PURPLE = [150, 128, 255];
    // The pointer, shared by every grid (same start as konpo-min's: the middle of the screen until the first move).
    const P = window.kpPointer || (window.kpPointer = { x: innerWidth / 2, y: innerHeight / 2, touch: false });
    addEventListener('pointermove', (e) => { P.x = e.clientX; P.y = e.clientY; P.touch = e.pointerType === 'touch' }, { passive: true, capture: true });

    window.kpDotGrid = function (canvas, opt = {}) {
        const ctx = canvas.getContext('2d');
        const o = Object.assign({ rgb: { x: '46', y: '46', z: '46' }, trail: 'frame', shape: 'cone', lens: 0, enter: 'follow', touch: false, reduce: false, click: 'off', tint: false, textRipple: 'off', text: null, hover: null }, opt);
        const stats = opt.stats; // the prototype's cost panel passes an object; on the site nothing is counted
        const size = parseRem(2), step = parseRem(20), pad = parseRem(1), top = size * 4.8;
        let cw, ch, kx, ky, rw, rh, sx, sy, ox, oy;
        // Same test as konpo-min's isTouchDevice(); today a touch screen gets no grid at all above 991px.
        const touchDev = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
        let mouse = null, amp = o.enter === 'grow' || touchDev ? 0 : 1, drawnAt = null, full = true;
        let visible = false, raf = 0, last = 0, touching = false;
        // click state: live ripples, the bulge's spring (1 = at rest), the patch the ripples covered last frame
        let ripples = [], pulse = 1, pulseV = 0, pressed = false, ripBox = null, lastType = 'mouse';
        const reduced = () => o.reduce && (o.reduce === 'force' || reduceMq.matches);
        const api = { paused: false, stats, set, ripple: (x, y, s) => { if (!reduced() && visible) { ripple({ clientX: x, clientY: y }, s); wake() } }, getMouse: () => mouse, setMouse: (m) => { mouse = m && { x: m.x, y: m.y }; wake() }, invalidate: () => { full = true; wake() } };

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
            full = true; wake();
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
            const t0 = stats && performance.now(), m = mouse, reach = REACH * (1 + o.lens) + top * Math.max(1, pulse) + 2;
            const rg = rings(now), box = ringBox(rg), wave = o.click === 'wave';
            let x0 = 0, y0 = 0, x1 = cw, y1 = ch;
            if (!full && drawnAt) {
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
            const i0 = Math.max(0, Math.ceil((ux0 - ox) / sx)), i1 = Math.min(rw, Math.floor((ux1 - ox) / sx));
            const j0 = Math.max(0, Math.ceil((uy0 - oy) / sy)), j1 = Math.min(rh, Math.floor((uy1 - oy) / sy));
            const big = [];
            let n = 0;
            ctx.beginPath();
            for (let j = j0; j <= j1; j++) {
                const y = sy * j + oy;
                for (let i = i0; i <= i1; i++) {
                    const x = sx * i + ox, dx = x - m.x, dy = y - m.y, d = Math.sqrt(dx * dx + dy * dy);
                    let r = size * 4.8 * shape(d) * amp * pulse;
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
                    if (lift < .01) lift = wx = wy = 0; // the ring's far tails: leave those dots in the batched fill
                    if (lift > 1.5) lift = 1.5;
                    r += top * RIP.lift * lift;
                    let a = (r + 1) / 8;
                    if (a < .56) a = .56;
                    n++;
                    if (r === 1 && a === .56) { ctx.moveTo(x + 1, y); ctx.arc(x, y, 1, 0, TAU); continue }
                    // calmaria's lens: dots inside the bulge are pushed outward along a hemisphere
                    const push = o.lens && d < REACH ? 1 + o.lens * Math.sqrt(1 - (d / REACH) ** 2) * amp : 1;
                    big.push(m.x + dx * push + wx, m.y + dy * push + wy, r, a > 1 ? 1 : a, o.tint ? Math.min(1, lift) : 0);
                }
            }
            ctx.globalAlpha = .56; ctx.fill(); // every resting dot in the patch in one fill
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
            const t0 = stats && performance.now();
            if (stats) stats.frames = (stats.frames || 0) + 1;
            const r = canvas.getBoundingClientRect(), p = window.kpPointer;
            const tx = p.x - r.left, ty = p.y - r.top;
            if (!mouse) mouse = { x: tx, y: ty }; // first frame after scrolling back in: start under the pointer
            // today: 6% of the way per frame, so the trail is twice as quick at 120 fps as at 60 fps
            const dt = last ? Math.min(100, now - last) : 16.7;
            last = now;
            const k = o.reduce && (o.reduce === 'force' || reduceMq.matches) ? 1
                : o.trail === 'frame' ? .06 : 1 - Math.pow(.94, dt / (1000 / +o.trail));
            mouse.x += (tx - mouse.x) * k; mouse.y += (ty - mouse.y) * k;
            let goal = 1;
            if (touchDev) goal = o.touch && touching ? 1 : 0; // resting grid on touch screens, a bulge under the finger with Touch on
            else if (o.enter === 'grow') { const h = (o.hover || canvas.parentElement).getBoundingClientRect(); goal = p.x >= h.left && p.x <= h.right && p.y >= h.top && p.y <= h.bottom ? 1 : 0 }
            const ampWas = amp;
            amp += (goal - amp) * k; if (Math.abs(goal - amp) < .002) amp = goal;
            // the bulge's spring: squeezed to 78% while the button is down, a kick on release, bounces back to 1
            const pulseWas = pulse;
            if (pressed || pulse !== 1 || pulseV) {
                const h = Math.min(dt, 33) / 1000;
                pulseV += (300 * ((pressed ? .78 : 1) - pulse) - 14 * pulseV) * h;
                pulse += pulseV * h;
                if (!pressed && Math.abs(pulse - 1) < .001 && Math.abs(pulseV) < .01) { pulse = 1; pulseV = 0 }
            }
            ripples = ripples.filter((rp) => now - rp.t0 < RIP.end * 1000);
            const moved = !drawnAt || Math.abs(mouse.x - drawnAt.x) >= .05 || Math.abs(mouse.y - drawnAt.y) >= .05;
            if (full || moved || amp !== ampWas || pulse !== pulseWas || ripples.length || ripBox) draw(now);
            if (stats) stats.loopMs = (stats.loopMs || 0) + performance.now() - t0;
            // keep going until the bulge has caught up with the pointer and the click has played out, then sleep
            if (Math.abs(tx - mouse.x) >= .05 || Math.abs(ty - mouse.y) >= .05 || amp !== goal || pressed || pulse !== 1 || ripples.length || ripBox) schedule();
            else last = 0;
        }
        function schedule() { if (!raf) raf = requestAnimationFrame(frame) }
        function wake() { if (!canvas.isConnected && wasConnected) return stop(); if (visible && !api.paused) schedule() }
        api.wake = wake;

        // Wake on anything that can move the bulge: the pointer, a scroll (the canvas moves under a still pointer), a resize.
        window.addEventListener('pointermove', wake, { passive: true });
        window.addEventListener('scroll', wake, { passive: true });
        window.addEventListener('resize', resize);
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
        const up = () => { if (!pressed) return; pressed = false; pulseV += 7; wake() };
        const tap = (e) => {
            if (lastType !== 'touch' || o.click === 'off' || reduced() || !visible || !inBlock(e.clientX, e.clientY) || inLink(e)) return;
            ripple(e); pulse = .78; pulseV = 7; wake();
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
        }
        resize();
        return api;
    };

    // On the site (konpo-min 1.8.0): initTitleGrid offers each title canvas here first. With the dotgrid switch on "new"
    // (kpOptions: the data-dotgrid attribute or ?dotgrid=, else new on *.webflow.io and old on konpo.studio) this grid takes
    // it, with the settings Jean picked in the prototype on 2026-10-29; otherwise the old grid runs as before.
    window.kpDotGridSite = function (canvas, rgb) {
        if (!canvas || !canvas.getContext || !window.kpOpts || window.kpOpts.dotgrid !== 'new') return false;
        const link = canvas.closest('a[href]');
        window.kpDotGrid(canvas, {
            rgb, trail: '120', shape: 'cone', lens: .2, enter: 'grow', click: 'ripple', textRipple: 'enter',
            text: link && link.querySelector('.projdtl-hero-title'),
            hover: canvas.closest('[data-move="wrap"], .projdtl-hero-title-wrap')
        });
        return true;
    };
})();
