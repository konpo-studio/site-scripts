# konpo-site-scripts

The scripts that run the animations on konpo.studio, owned by Konpo. bear.plus built them, and they used to be served from bear.plus's CDN (`cdnwf-prod.bear.plus/konpo/…`) and their GitHub (`Azolia-Design/konpo`). The site loads them from this repo through jsDelivr instead, pinned to a release tag, so nothing on the site changes unless we cut a new tag and point Webflow at it.

## What's here

- `dist/` holds the files the site loads. In v1.0.0 they're byte-for-byte copies of what was live on 19 Oct 2026, so the switch changes nothing.
  - `konpo-min.js` is the main site script (loader, page transitions, cursor, sliders and so on). Every page loads it.
  - `newyear-min.js` is the confetti easter egg. Every page loads it.
  - `ads.js` is only loaded on /ai-design-system.
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

- **v1.3.0**: GSAP 3.15.0 replaces GSAP 3.11.4 and bear.plus's SplitText and DrawSVG 3.9.1, so the last files on bear.plus's GitHub are gone. SplitText changed a lot between those versions, so konpo-min gets four changes that keep today's look:
  - Split options that match 3.9: no aria labels, nested elements kept whole, and a single `&nbsp;` kept inside its word.
  - The cursor dot moved back out of the Home "View project" text line.
  - Hidden `<br>` tags removed before the case-study brand text is split.
  - The case-study quote split once instead of twice.

  The new GSAP footer tags and this version go out together and roll back together (the old tags with v1.2.0).
- **v1.2.0**: smoother scrolling while things animate. Lenis (the smooth scroll) used to run on its own frame loop, separate from GSAP and ScrollTrigger, so on a busy frame the scroll and the scroll-driven animations could land a frame apart. Lenis is now driven by GSAP's ticker, and ScrollTrigger updates on every Lenis scroll, which is Lenis's documented setup. It also drops a header progress-bar callback that forced a layout on every scroll frame. That callback computed NaN, so it never changed anything on screen. Measured on a 4x-slowed CPU, scroll speed is about 2.5x steadier on Home and About, and reveals are unchanged.
- **v1.1.0**: Home reveal from the loader into the three hero cards is smoother. The last loader image now hands over to the real card while it's still gliding in (under a pixel left to travel), and the cards start moving straight away instead of after a 0.3 to 0.45s pause. Their position, width and height share one ease that starts from rest and lands like the loader does, where before they jumped off at full speed and the width and height stopped dead. Changed in `dist/konpo-min.js` as a minimal patch to the v1.0.0 build, with the same change written into `src/konpo.js`. Nothing else differs.
- **v1.0.0**: bear.plus's scripts as they were live on 19 Oct 2026.
