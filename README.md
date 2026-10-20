# konpo-site-scripts

The scripts that run the animations on konpo.studio, owned by Konpo. bear.plus built them, and they used to be served from bear.plus's CDN (`cdnwf-prod.bear.plus/konpo/…`) and their GitHub (`Azolia-Design/konpo`). The site loads them from this repo through jsDelivr instead, pinned to a release tag, so nothing on the site changes unless we cut a new tag and point Webflow at it.

## What's here

- `dist/` holds the files the site loads. In v1.0.0 they're byte-for-byte copies of what was live on 19 Oct 2026, so the switch changes nothing.
  - `konpo-min.js` is the main site script (loader, page transitions, cursor, sliders and so on). Every page loads it.
  - `newyear-min.js` is the confetti easter egg. Every page loads it.
  - `ads.js` is only loaded on /ai-design-system.
  - `kbdfix.js` is the keyboard and focus fixes (Escape closes the menu and popups, focus stays inside an open popup and comes back after, closed popups are `inert`). Every page loads it. It used to be a Webflow inline script, and moved here in v1.5.0 because it outgrew Webflow's 2,000-character limit.
- `src/` is the source bear.plus sent over (zip, 19 Oct 2026). `konpo.js` is the readable source of `konpo-min.js`. It's very close to the live build but not identical (the easter-egg loader differs), so check that before shipping a build made from it.

## Loaded from elsewhere

- GSAP 3.15.0 (core, ScrollTrigger, SplitText and DrawSVG) comes from cdnjs with integrity hashes. Since v1.3.0 nothing loads from bear.plus or `Azolia-Design/konpo`. SplitText and DrawSVG have shipped free with GSAP since 3.13, and before that the site used bear.plus's copies of the 3.9.1 Club plugins.
- Lenis, Barba, Swiper, dayjs, matter-js and lordicon come from their public CDNs at pinned versions. The exceptions are `swiper@8`, which floats within v8, and lordicon, which isn't versioned at all.

## Releasing a change

1. Edit the file in `dist/` (or rebuild it from `src/`), commit, and tag a new version: `git tag v1.0.1 && git push --tags`.
2. The file is then at `https://cdn.jsdelivr.net/gh/konpo-studio/site-scripts@1.0.1/dist/konpo-min.js`. Tagged URLs never change, so a mistake can't reach the site until Webflow points at it.
3. Get the integrity hash: `curl -s <url> | openssl dgst -sha384 -binary | openssl base64 -A`.
4. In Webflow, update the script tag (Site settings → Custom code → Footer, or the page's own code for `ads.js`) with the new URL and `integrity="sha384-…" crossorigin="anonymous"`. Publish to staging, test, then publish to konpo.studio.

Rolling back is the same in reverse: point the tag back at the previous version and publish.

## Releases

- **v1.6.0** (not released yet): native scrolling and gradient headlines, each behind a switch on the konpo-min footer tag.
  - `data-smooth-scroll="off"` (the default) lets the browser scroll the page itself. Lenis stays loaded for everything else (popups locking the page, the animated jumps to anchors and case-study sections, scroll events), and the About team marquee still speeds up with scroll speed. Set it to `"on"` for the old Lenis smooth wheel.
  - `data-headlines="gradient"` (the default) turns the scroll headlines on Home, About, case studies and services into the grey-to-dark fill, line by line, instead of letter and word reveals. The smaller text that revealed with them (labels, sub copy, names) now just sits there. Hero and page-load reveals, and rich-text headlines with images in them, are unchanged. Set it to `"reveal"` for the old reveals.
  - For a quick look without republishing, add `?smooth-scroll=on` or `?headlines=reveal` to any URL.
  - Measured at normal CPU speed over 8 seconds of scrolling: on About, frames over the 120Hz budget (8.3ms) go from 85 and 298 to 2 in the two sections measured, and typical work per frame from 7.5 to 8.5ms down to about 3.3ms. Case studies go from about 3.4 to 1.7ms a frame, Home and services from about 4.5 to 3.6 to 4.2ms. The code is three prefixed blocks at the top of `dist/konpo-min.js` (`kpOptions`, `kpNativeVelocity`, `kpHeadlineGradient`) plus one edit to the Lenis setup, mirrored in `src/konpo.js`. Roll back to v1.5.1, or flip the switches.
- **v1.5.1**: v1.5.0 and the v1.4.4 Lottie fix together. v1.4.3 and v1.4.4 were released from v1.4.2 on a side branch while v1.5.0 was on staging, so this puts both changes in one build: exactly the v1.5.0 file with the two v1.4.4 Lottie edits applied. Roll back to v1.4.4 (Lottie fix without the smoothness changes) or v1.5.0.
- **v1.5.0**: smoother scrolling on About, with nothing changing on screen. Measured at normal CPU speed, the awards section goes from about 16ms of work per frame to 9.5ms and the testimonials from about 17ms to 11ms, so frames that miss 60fps there drop from roughly 150 to 220 per 6 seconds of scrolling to a handful. Home gains about half a millisecond.
  - Awards table: the copies of each row that are hidden on desktop (about 1,000 letters) get a 0.01px transform when they're split. GSAP measures hidden elements the slow way (show, move to `<html>`, measure, move back), and this lets it skip that. Every letter stays in the reveal, so the timing is the same.
  - The falling shapes keep their physics running every frame but aren't drawn while they're more than 200px off screen.
  - The awards and testimonials thumbnail-follow loops skip their per-frame lookups unless the pointer is over their section (that's the only time they did anything).
  - The title-dot grids read their position once a frame instead of three times, and the header's scroll class uses a cached header height.
  - `kbdfix.js` 1.1.0 (new here) re-checks which parts are `inert` only when one of them changes class or the page swaps content, at most once a frame. Before, every class change anywhere on the page queued a full check.

  The changes are in `dist/konpo-min.js` as exact replacements on the v1.4.2 build (plus the awards wrapper at the top), mirrored in `src/konpo.js`. Roll back to v1.4.2 (only the konpo-min tag changes) and point the kbdfix tag back at Webflow's inline kbdfix 1.0.0.
- **v1.4.4**: v1.4.3 waited for the player to be defined but not for its first render, so after a mid-page reload the Lotties said "playing" and drew nothing. They now also wait for the player's `updateComplete`. Roll back to v1.4.2 (v1.4.3 was never live).
- **v1.4.3**: the Home and services Lotties wait for the Lottie player to be ready. The player script loads after konpo-min, so a reload that lands mid-page (the browser restores the scroll position) started them too early, threw "load is not a function" and left them blank. Built on v1.4.2, so it doesn't include v1.5.0's About changes. Roll back to v1.4.2.
- **v1.4.2**: the summary toggle margin only counts the FAQ when it's showing. Flair has no FAQs, so its section is hidden, but jQuery still measured it (about 420px) and the toggle stopped early there. Roll back to v1.4.1.
- **v1.4.1**: case-study FAQs. The FAQ section on case studies opens and closes like the services one, and it now sits at the very bottom of the page, below the next-project hero. Going to the next project moves and fades the FAQ along with the hero, CTA and testimonial, and the summary toggle in the side rail still stops above the CTA (its bottom margin counts the FAQ, and is measured again after an answer opens or closes). Roll back to v1.4.0 (same footer, only the konpo-min tag changes; the case FAQ answers then won't open).
- **v1.4.0**: split text reads as words again for screen readers and AI agents. Letter-level splits put each letter in its own box, so headings read as "S e r v i c e s". After every split, the letters are hidden from assistive tech and each word gets one visually hidden copy of its text (words that hold a link are left alone, so nothing focusable is hidden). The marquee copies on the services pages, About and the Home client logos are marked `aria-hidden`, so each services page has one H1 instead of four. Nothing changes on screen. Roll back to v1.3.0 (same footer, only the konpo-min tag changes).
- **v1.3.0**: GSAP 3.15.0 replaces GSAP 3.11.4 and bear.plus's SplitText and DrawSVG 3.9.1, so the last files on bear.plus's GitHub are gone. SplitText changed a lot between those versions, so konpo-min gets four changes that keep today's look:
  - Split options that match 3.9: no aria labels, nested elements kept whole, and a single `&nbsp;` kept inside its word.
  - The cursor dot moved back out of the Home "View project" text line.
  - Hidden `<br>` tags removed before the case-study brand text is split.
  - The case-study quote split once instead of twice.

  The new GSAP footer tags and this version go out together and roll back together (the old tags with v1.2.0).
- **v1.2.0**: smoother scrolling while things animate. Lenis (the smooth scroll) used to run on its own frame loop, separate from GSAP and ScrollTrigger, so on a busy frame the scroll and the scroll-driven animations could land a frame apart. Lenis is now driven by GSAP's ticker, and ScrollTrigger updates on every Lenis scroll, which is Lenis's documented setup. It also drops a header progress-bar callback that forced a layout on every scroll frame. That callback computed NaN, so it never changed anything on screen. Measured on a 4x-slowed CPU, scroll speed is about 2.5x steadier on Home and About, and reveals are unchanged.
- **v1.1.0**: Home reveal from the loader into the three hero cards is smoother. The last loader image now hands over to the real card while it's still gliding in (under a pixel left to travel), and the cards start moving straight away instead of after a 0.3 to 0.45s pause. Their position, width and height share one ease that starts from rest and lands like the loader does, where before they jumped off at full speed and the width and height stopped dead. Changed in `dist/konpo-min.js` as a minimal patch to the v1.0.0 build, with the same change written into `src/konpo.js`. Nothing else differs.
- **v1.0.0**: bear.plus's scripts as they were live on 19 Oct 2026.
