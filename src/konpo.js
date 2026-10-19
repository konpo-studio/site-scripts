// Letter-level splits put every letter in its own box, so screen readers and AI agents read "S e r v i c e s".
// After each split, hide the letters from them and give each word one visually hidden copy of its text.
// Words that contain a link or other focusable element are left alone, so nothing focusable ends up hidden.
function kpSplitA11y(split) {
    try {
        if (!split || !split.chars || !split.chars.length || !split.words) return;
        split.words.forEach((word) => {
            if (!word || word.querySelector('.kp-sr') || word.querySelector('a,button,input,select,textarea,[tabindex]')) return;
            const text = word.textContent;
            if (!text || !text.trim()) return;
            for (let c = word.firstElementChild; c; c = c.nextElementSibling) c.setAttribute('aria-hidden', 'true');
            const copy = document.createElement('span');
            copy.className = 'kp-sr';
            copy.textContent = text;
            copy.style.cssText = 'position:absolute;width:1px;height:1px;margin:-1px;padding:0;border:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap';
            word.appendChild(copy);
        });
    } catch (e) {}
}
// Every `new SplitText(...)` below goes through this wrapper, which runs kpSplitA11y on the result.
function kpWrapSplit() {
    const Original = window.SplitText;
    if (!Original || Original.__kpWrapped) return;
    function Wrapped(target, opts) { const split = new Original(target, opts); kpSplitA11y(split); return split; }
    Wrapped.prototype = Original.prototype;
    Object.setPrototypeOf(Wrapped, Original);
    Wrapped.__kpWrapped = true;
    window.SplitText = Wrapped;
}

const mainScript = () => {
    function isVideoPlaying(video) {
        return video && !video.paused && !video.ended && video.currentTime > 0 && video.readyState > 2;
    }
    dayjs.extend(window.dayjs_plugin_utc)
    dayjs.extend(window.dayjs_plugin_timezone)

    barba.use(barbaPrefetch);
    gsap.registerPlugin(ScrollTrigger, SplitText);
    kpWrapSplit();
    gsap.config({ nullTargetWarn: false });

    const isStaging = window.location.href.indexOf('webflow') > -1 ? true : false

    const lenis = new Lenis({
        lerp: false,
        duration: 1.6
    })
    // Drive Lenis from GSAP's ticker and update ScrollTrigger on every Lenis scroll, so scrolling and
    // scroll-driven animations land on the same frame (Lenis's documented GSAP setup).
    function raf(time) {
        lenis.raf(time * 1000)
    }
    lenis.on('scroll', ScrollTrigger.update)
    gsap.ticker.add(raf)

    //Utils
    const lerp = (a,b,t = 0.08) => {
        return a + (b - a) * t;
    }
    let pointer = {x: $(window).width()/2, y: $(window).height()/2};
    $(window).on('pointermove', function(e) {
        pointer.x = e.clientX;
        pointer.y = e.clientY;
        if (!$('.cursor-wrap').hasClass('active') && !isTouchDevice()) {
            handleCursor.show()
        }
    })
    const pointerCurr = () => {
        return pointer
    }
    const parseRem = (input) => {
        return input / 10 * parseFloat($('html').css('font-size'))
    }
    const xSetter = (el) => gsap.quickSetter(el, 'x', `px`);
    const ySetter = (el) => gsap.quickSetter(el, 'y', `px`);
    const rotXSetter = (el) => gsap.quickSetter(el, 'rotateY', `deg`);
    const rotYSetter = (el) => gsap.quickSetter(el, 'rotateX', `deg`);
    const rotZSetter = (el) => gsap.quickSetter(el, 'rotateZ', `deg`);

    const xGetter = (el) => gsap.getProperty(el, 'x')
    const yGetter = (el) => gsap.getProperty(el, 'y')
    const rotXGetter = (el) => gsap.getProperty(el, 'rotateY')
    const rotYGetter = (el) => gsap.getProperty(el, 'rotateX')
    const rotZGetter = (el) => gsap.getProperty(el, 'rotateZ')
    function getDistance(obj1, obj2) {
        let dx = obj1.x - obj2.x;
        let dy = obj1.y - obj2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    function debounce(func, delay = 100){
        let timer;
        return function(event) {
            if (timer) clearTimeout(timer);
            timer = setTimeout(func, delay, event);
        };
    }
    function refreshOnBreakpoint() {
        let initialViewportWidth = window.innerWidth || document.documentElement.clientWidth;
        let newViewportWidth;
        // portrait mobile viewport initial, any change refresh
        if (initialViewportWidth < 480) {
            $(window).on('resize', debounce(function() {
                newViewportWidth = window.innerWidth || document.documentElement.clientWidth;
                if (newViewportWidth > 479) {
                    location.reload();
                }
            }))
        }
        // landscape mobile viewport initial, any change refresh
        else if (initialViewportWidth < 768) {
            $(window).on('resize', debounce(function() {
                newViewportWidth = window.innerWidth || document.documentElement.clientWidth;
                if (newViewportWidth > 767) {
                    location.reload();
                }
            }))
        }
        // tablet viewport initial, any change refresh
        else if (initialViewportWidth > 767 && initialViewportWidth < 992)  {
            $(window).on('resize', debounce(function() {
                newViewportWidth = window.innerWidth || document.documentElement.clientWidth;
                if (newViewportWidth < 768 || newViewportWidth > 991) {
                    location.reload();
                }
            }))
        }
        // web viewport initial, any change refresh
        else if (initialViewportWidth > 991) {
            $(window).on('resize', debounce(function() {
                newViewportWidth = window.innerWidth || document.documentElement.clientWidth;
                if (newViewportWidth < 992) {
                    location.reload();
                }
            }))
        }
    }
    refreshOnBreakpoint();
    const isTouchDevice = () => {
        return (('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        (navigator.msMaxTouchPoints > 0));
    }

    const checkSameNamespace = (namespace, current, next) => {
        let result = (current === next) && (current === namespace) && (next === namespace);
        return result;
    }

    const isProjectToProject = (current, next) => checkSameNamespace("projDtl", current, next);

    const documentHeightObserver = (action) => {
        let resizeObserver;
        let debounceTimer;
        let observerEl = document.documentElement;

        let previousHeight = observerEl?.scrollHeight;
        function onRefresh() {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const currentHeight = observerEl.scrollHeight;
				if (currentHeight !== previousHeight) {
                    console.log("Document height changed. Refreshing ScrollTrigger...");
                    if (lenis) {
                        lenis.resize();
                    }
                    ScrollTrigger.getAll().forEach(trigger => {
                        if (trigger.progress === 0) {
                            trigger.refresh();
                        }
                    });
                    previousHeight = currentHeight;
                }
            }, 200);
        }

        if (action === "init") {
            if (!observerEl) return;
            resizeObserver = new ResizeObserver(onRefresh);
            resizeObserver.observe(observerEl);
        } else if (action === "disconnect") {
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
        }
    };

    // Utils vars
    // SplitText 3.13+ defaults differ from the 3.9 build this was written for, so keep the 3.9 behaviour:
    // no aria-label/aria-hidden (they hide links from screen readers), nested elements stay whole instead of
    // being sliced per line, and a single &nbsp; stays inside its word (3.13+ makes every whitespace run breakable)
    const splitBase = {
        linesClass: 'g-lines',
        aria: 'none',
        deepSlice: false,
        reduceWhiteSpace: false,
        prepareText: (text) => text.replace(/\s\s+/g, ' ').replace(/\r|\n|\t\t/g, '')
    };
    let typeOpts = {
        lines: { type: 'lines', ...splitBase},
        words: { type: 'words,lines', ...splitBase},
        chars: { type: 'chars,words,lines', ...splitBase}
    };
    let gOpts = {
        ease: 'power2.easeOut',
    };
    let delayTime = .8;
    //End Utils

    //Global functions
    if ($(window).width() < 767) {
        if ( $(window).width()/ $(window).height() > .5267527675276753) {
            $('.nav-mb-ctc').css('display', 'none')
        }
    }
    function updateTime() {
        const allTimeZones = $('[data-time]')
        allTimeZones.each((index, el) => {
            let zone = $(el).attr('data-time');
            $(el).text(dayjs(Date.now()).tz(zone).format('HH:mma'))
        })
        const yearDate = $('[data-year]')
        yearDate.each((idx, el) => {
            $(el).text(dayjs(Date.now()).format('YYYY'))
        })
    }
    function updateHello() {
        let time = new Date().getHours().toString();
        const greetings = {
            early: ['Rise and shine!', 'Morning sunshine!', 'Hey there, early bird!'],
            morning: ['Good Morning!'],
            afternoon: ["It's a fine afternoon!", "Good afternoon!"],
            evening: ["Good evening!", "Evening vibes!"],
            night: ["Good night!", "Sweet dreams!"],
            late_night: ["You're a night owl, huh?", "Can't sleep?"]
        };

        let greetingCategory;
        if (time >= 5 && time < 7) {
            greetingCategory = 'early';
        } else if (time >= 7 && time < 12) {
            greetingCategory = 'morning';
        } else if (time >= 12 && time < 18) {
            greetingCategory = 'afternoon';
        } else if (time >= 18 && time < 21) {
            greetingCategory = 'evening';
        } else if (time >= 21 && time < 24) {
            greetingCategory = 'night';
        } else {
            greetingCategory = 'late_night';
        }
        console.log(greetingCategory)
        const randomGreeting = greetings[greetingCategory][Math.floor(Math.random() * greetings[greetingCategory].length)];
        $('[data-greet]').text(randomGreeting);
    }
    function updateHeaderMobile() {
        console.log('updateHeaderMobile')
        if ($(window).width() < 767) {
            let clone = $('.header-logo-status-inner').eq(0).clone();
            $('.header-logo-status').append(clone);
            $('.header-logo-status-inner').addClass('anim')
            setInterval(() => {
                $('.header-top').toggleClass('on-scroll-mb')
            }, 8000);
            requestAnimationFrame(updateHeaderStatusWidth)
        }
    }
    function updateHeaderStatusWidth() {
        $('.header-logo').width($('.header-reg').width())
        requestAnimationFrame(updateHeaderStatusWidth)
    }
    updateTime();
    updateHello()
    updateHeaderMobile()


    const handleNav = {
        init: () => {
            const mainLink = new SplitText('.main-menu .menu-link-item', {...typeOpts.chars, charsClass: 'g-chars'});
            const smTxt = new SplitText('.sm-menu .menu-link-item', {...typeOpts.chars, charsClass: 'g-chars'});
            const mainCtcLabel = new SplitText('.menu-bot-label', {...typeOpts.chars, charsClass: 'g-chars'});
            const mainCtcLink = new SplitText('.menu-bot-link', {...typeOpts.chars, charsClass: 'g-chars'});
        },
        open: () => {
            $('.header-toggle').addClass('active')
            if ($('.nav').hasClass('hidden')) {
                $('.nav').removeClass('hidden')
            }
            requestAnimationFrame(() => {
                $('.nav').addClass('active')
            })

            $('.header-prog').addClass('hidden')
            let openMainMenu = gsap.timeline({
                overwrite: true,
            });
            openMainMenu
            .set('.menu', {transformOrigin: '10% 10%', scale: 0})
            .to('.menu', {scale: 1, duration: .6, transformOrigin: '0% 0%', ease: 'power2.inOut'})
            // if ($(window).width() < 767) {
            //     gsap.set('.menu .menu-bg', {scale: 0, borderRadius: '3rem', transformOrigin: 'top left', overwrite: true})
            // } else {
            //     gsap.set('.menu .menu-bg', {scale: 0, borderRadius: '5rem', transformOrigin: 'top left', overwrite: true})
            // }
            // gsap.set('.menu circle', {autoAlpha: 0, overwrite: true})
            // gsap.set('.menu .g-chars', {yPercent: 60, autoAlpha: 0, overwrite: true})
            // gsap.set('.menu.main-menu, .menu.sm-menu', {clipPath: 'polygon(0% 0%, 0% 0%, 0% 0%, 0% 0%)', overwrite: true})
            // gsap.set('.line-menu-item', {scaleX: 0, transformOrigin: 'left', overwrite: true})
            // $('.header-toggle').addClass('active')
            // $('.nav').addClass('active')
            // $('.header-prog').addClass('hidden')

            // let openMainMenu = gsap.timeline({
            //     overwrite: true,
            //     onComplete: () => {
            //         gsap.set('.menu circle', {autoAlpha: 1, overwrite: true})
            //     }
            // });

            // if ($(window).width() < 767) {
            //     openMainMenu
            //     .to('.menu.main-menu .menu-bg', {scale: 1, borderRadius: '1rem', duration: .8, ease: 'power2.out'}, "0")
            // } else {
            //     openMainMenu
            //     .to('.menu.main-menu .menu-bg', {scale: 1, borderRadius: '2rem', duration: .8, ease: 'power2.out'}, "0")
            // }
            // openMainMenu
            // .to('.menu.main-menu', {clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', duration: .8, ease: 'power2.out'}, '<=0')
            // .to('.menu.main-menu .menu-ic-item.active circle',{autoAlpha: 1, stagger: {each: 0.006, from: 'random'}, duration: .3, ease: gOpts.ease, overwrite: true}, '<=.2')

            // .to('.line-menu-item', {scaleX: 1, duration: .6, stagger: .1, ease: gOpts.ease}, '.2')
            // $('.menu.main-menu .menu-link-item').each((idx, el) => {
            //     openMainMenu
            //     .to($(el).find('.g-chars'), {yPercent: 0, autoAlpha: 1, duration: .5, stagger: .01, ease: gOpts.ease, clearProps: 'transform'}, `${.4 + idx * .01}`)
            //     .to('.menu.main-menu .menu-item .menu-item-ic circle', {autoAlpha: 1, duration: .3, ease: gOpts.ease}, '<=.2')
            // })
            // openMainMenu
            // .to('.menu-bot-label .g-chars', {yPercent: 0, autoAlpha: 1, duration: .4, stagger: .005, ease: gOpts.ease, clearProps: 'transform'}, ".2")
            // .to('.menu-bot-link .g-chars', {yPercent: 0, autoAlpha: 1, duration: .4, stagger: .005, ease: gOpts.ease, clearProps: 'transform'}, "<=.2")

            // let allSmMenuItems = $('.menu.sm-menu');
            // if ($(window).width() < 767) {
            //     allSmMenuItems.each((idx, el) => {
            //         openMainMenu
            //         .to($(el).find('.menu-bg'), {scale: 1, borderRadius: '1rem', duration: .6, ease: 'power2.out', clearProps: 'all', delay: .2}, `0`)
            //         .to($(el), {clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', duration: .6, ease: 'power2.out'}, '<=0')
            //         .to($(el).find('.sm-menu-ic circle'), {autoAlpha: 1, stagger: {each: .005, from: 'random'}, duration: .3, ease: gOpts.ease, overwrite: true,}, "<=.2")
            //         .to($(el).find('.menu-link-item .g-chars'), {yPercent: 0, autoAlpha: 1, duration: .4, stagger: .006, ease: gOpts.ease, clearProps: 'transform'}, "<=.1")
            //     })
            // } else {
            //     allSmMenuItems.each((idx, el) => {
            //         openMainMenu
            //         .to($(el).find('.menu-bg'), {scale: 1, borderRadius: '2rem', duration: .6, ease: 'power2.out', clearProps: 'all', delay: .2}, `0`)
            //         .to($(el), {clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', duration: .6, ease: 'power2.out'}, '<=0')
            //         .to($(el).find('.sm-menu-ic circle'), {autoAlpha: 1, stagger: {each: .005, from: 'random'}, duration: .3, ease: gOpts.ease}, "<=.2")
            //         .to($(el).find('.menu-link-item .g-chars'), {yPercent: 0, autoAlpha: 1, duration: .4, stagger: .006, ease: gOpts.ease, clearProps: 'transform'}, "<=.1")
            //     })
            // }
        },
        close: () => {
            $('.header-toggle').removeClass('active');
            $('.nav').removeClass('active')
            $('.header-prog').removeClass('hidden')
            let closeMainMenu = gsap.timeline({});
            closeMainMenu
            .fromTo('.menu', {transformOrigin: '90% 90%'}, {scale: 0, duration: .6, transformOrigin: '100% 100%', ease: 'power2.inOut'})
            //gsap.to('.menu .menu-ic-item, .menu .sm-menu-ic', {clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)"})
            // let closeMainMenu = gsap.timeline({});
            // closeMainMenu
            // .to('.menu.main-menu .menu-bg', {scale: 0, borderRadius: '2rem', transformOrigin: 'bottom right', duration: .8, ease: 'power2.out', clearProps: 'all'}, '0')
            // .to('.menu.main-menu', {clipPath: 'polygon(100% 100%, 100% 100%, 100% 100%, 100% 100%)', duration: .8, ease: 'power2.out', clearProps: 'all'}, '<=0')
            // .to('.menu.sm-menu .menu-bg', {scale: 0,borderRadius: '2rem', transformOrigin: 'bottom right', duration: .6, ease: 'power2.out', clearProps: 'all'}, '0')
            // .to('.menu.sm-menu', {clipPath: 'polygon(100% 100%, 100% 100%, 100% 100%, 100% 100%)', duration: .6, ease: 'power2.out', clearProps: 'all'}, '<=0')
            // .to('.menu .menu-ic-item, .menu .sm-menu-ic', {clipPath: "polygon(100% 100%, 100% 100%, 100% 100%, 100% 100%)", duration: .6, ease: 'power1.out', clearProps: 'all'}, '<=0')
        },
        isOpen: () => {
            return $('.nav').hasClass('active')
        },
        isProjDtl: (data) => {
            if (data.next.namespace == 'projDtl') {
                $('.header .header-logo').removeClass('active')
                $('.header .header-projdtl').addClass('active')
            } else {
                $('.header .header-logo').addClass('active')
                $('.header .header-projdtl').removeClass('active')
            }
        }
    }
    function headerOnOpen() {
        $('.header-top').addClass('on-open')
        $('.side-bg-ph').addClass('on-open')
        gsap.set('.header', {'mix-blend-mode': 'normal', 'filter': 'invert(0)'})
        $('.header').addClass('on-open')
    }
    function headerOnClose() {
        $('.header-top').removeClass('on-open')
        $('.header').removeClass('on-open')
        $('.side-bg-ph').removeClass('on-open')
        setTimeout(() => {
            gsap.set('.header', {'mix-blend-mode': 'difference', 'filter': 'invert(1)'})
        }, 300);
    }
    handleNav.init()
    $('.header-toggle').on('click', function(e) {
        e.preventDefault()
        if ($('.nav').hasClass('active')) {
            headerOnClose();
            handleNav.close();
            lenis.start();
        } else {
            headerOnOpen()
            if (handleContactForm.isOpen()) {
                handleContactForm.close();
            }
            if ($('.projdtl-sum-wrap').length && $('.projdtl-sum-wrap').hasClass('active')) {
                $('.projdtl-sum-wrap').removeClass('active')
                $('.projdtl-intro-toggle').removeClass('active')
            }
            handleNav.open();
            lenis.stop();
        }
    })
    if ($('.ic-playg-wrap.on-top').length) {
        if ($(window).width() <= 991) {
            $('.header-reg').on('click', function(e) {
                e.preventDefault();
                $('.ic-playg-wrap.on-top').toggleClass('on-hide')
            })
        }
    }

    function hoverNav() {
        $('.menu-item-wrap .menu-item').each((idx, el) => {
            let data = $(el).data('link')

            $(el).on('pointerenter', function(e) {
                e.preventDefault
                $('.menu-ic-wrap .menu-ic-item').removeClass('active')
                $(`.menu-ic-wrap .menu-ic-item[data-menu-ic="${data}"]`).addClass('active')
            })
            $(el).on('pointerleave', function(e) {
                e.preventDefault()
                $('.menu-ic-wrap .menu-ic-item').removeClass('active')
                let currTab = $('.menu-item-wrap .menu-item.active')

                if (currTab.length === 0) {
                    $('.menu-ic-wrap .menu-ic-item').eq(0).addClass('active')
                } else {
                    $(`.menu-ic-wrap .menu-ic-item[data-menu-ic="${$('.menu-item-wrap .menu-item.active').data('link')}"]`).addClass('active')
                }
            })
        })
    }
    hoverNav()
    function inputInteractionInit(formEl) {
        //Normal input
        $(`${formEl} .input-grp .input-field`).on('focus', function(e) {
            $(this).parent().addClass('active')
            updateProg(allowedSteps)
        })
        $(`${formEl} .input-grp .input-field`).on('blur', function(e) {
            $('.input-grp').removeClass('active')
            updateProg(allowedSteps)
        })
        $(`${formEl} .input-grp .input-field`).on('keyup', function(e) {
            if ($(this).val() != '') {
                $(this).parent().addClass('filled')
            } else {
                $(this).parent().removeClass('filled')
            }
            updateProg(allowedSteps)
        })
        $(`${formEl} .input-grp .input-field`).on('change', function(e) {
            if ($(this).val() != '') {
                $(this).parent().addClass('filled')
            } else {
                $(this).parent().removeClass('filled')
            }
            updateProg(allowedSteps)
        })
    }

    let allowedSteps, popupSubmitTxt, submitTxtanimated = false;
    function updateProg(steps) {
        let lastStep = $(`.pop-ctc-main .pop-ctc-step.step-last`).find('.input-grp.filled .input-field[required]').length >= 2 ? 1 : 0;
        let percent = (steps + lastStep) / $('.pop-ctc-form-inner .pop-ctc-step').length;
        if (percent == 0) {
            $('.pop-ctc-main .pop-ctc-act-wrap').addClass('hidden')
        } else {
            $('.pop-ctc-main .pop-ctc-act-wrap').removeClass('hidden')
        }
        if (steps + lastStep == 5) {
            gsap.to('.pop-ctc-prog-inner', {'--currProg': `${percent * 361}deg`, duration: .4, ease: 'power2.in', overwrite: true, onComplete: () => {
                $('.pop-ctc-main .pop-ctc-act-wrap').addClass('active')
                if (!submitTxtanimated) {
                    gsap.set(popupSubmitTxt.chars, {yPercent: 60, opacity: 0})
                    gsap.to(popupSubmitTxt.chars, {yPercent: 0, opacity: 1, duration: .3, stagger: 0.02})
                    submitTxtanimated = true;
                }
                $('.pop-ctc-main .pop-ctc-submit-btn').addClass('active')
            }})
        } else {
            gsap.to('.pop-ctc-prog-inner', {'--currProg': `${percent * 361}deg`, duration: .6, ease: gOpts.ease, overwrite: true, onStart: () => {
                $('.pop-ctc-main .pop-ctc-act-wrap').removeClass('active')
                if (submitTxtanimated) {
                    gsap.to(popupSubmitTxt.chars, {yPercent: -60, opacity: 0, duration: .3, stagger: 0.02})
                    submitTxtanimated = false;
                }
                $('.pop-ctc-main .pop-ctc-submit-btn').removeClass('active')
            }})
        }
    }
    function scrollToStep(currStep) {
        if (currStep != 0) {
            document.querySelector('.pop-ctc-form').scrollTo({
                top: $('.pop-ctc-step').eq(currStep + 1).get(0).offsetTop,
                left: 0,
                behavior: 'smooth'
            })
        }
    }
    const handleContactForm = {
        init: () => {
            //Set layout
            let offSet = $('.pop-ctc-form').height() - $('.pop-ctc-step.step-last').outerHeight()
            if ($(window).width() >= 768) {
                gsap.set('.pop-ctc-form-inner', {paddingBottom: offSet})
            }
            popupSubmitTxt = new SplitText('.pop-ctc-main .pop-ctc-act-txt', typeOpts.chars)
            gsap.set(popupSubmitTxt.chars, {yPercent: 60, opacity: 0})

            allowedSteps = 0;
            $('.pop-ctc-step-item').on('click', function(e) {
                e.preventDefault()
                let selectType = $(this).closest('.pop-ctc-step-items').attr('data-select-type')
                if (selectType == 'single') {
                    if ($(this).hasClass('active')) {
                        $(this).closest('.pop-ctc-step-items').find('.pop-ctc-step-item').removeClass('active')
                    } else {
                        $(this).closest('.pop-ctc-step-items').find('.pop-ctc-step-item').removeClass('active')
                        $(this).addClass('active')
                        $(this).closest('.pop-ctc-step-items').find('.input-hidden').val($(this).find('.pop-ctc-step-val').text())
                        scrollToStep($(this).closest('.pop-ctc-step').index())
                    }
                } else if (selectType == 'multi') {
                    if ($(this).hasClass('active')) {
                        $(this).removeClass('active')
                    } else {
                        $(this).addClass('active')
                        scrollToStep($(this).closest('.pop-ctc-step').index())
                    }
                    $(this).closest('.pop-ctc-step-items').find('.input-hidden').val('')
                    let arr = [];
                    $('[data-popup-select].active').each((idx, el) => {arr.push($(el).text())})
                    $(this).closest('.pop-ctc-step-items').find('.input-hidden').val(arr.join(', '))
                }
                if ($(this).closest('.pop-ctc-step').find('.pop-ctc-step-item.active').length >= 1) {
                    $(this).closest('.pop-ctc-step').addClass('allow')
                }  else {
                    $(this).closest('.pop-ctc-step').removeClass('allow')
                }
                allowedSteps = $('.pop-ctc-form-inner .pop-ctc-step.allow').length;
                updateProg(allowedSteps)
            })
            $('[data-popup-select]').on('click', function(e) {
                e.preventDefault();
                if ($(this).hasClass('active')) {
                    let currentSer = $(this).attr('data-popup-select');
                    let matchProj = [];
                    if (currentSer != 'Other') {
                        let allItems = $('.proj-global-ser-list')
                        allItems.each((idx, el) => {
                            if ($(el).text().includes(currentSer)) {
                                matchProj.push($(el).closest('.proj-global-item'))
                            }
                        })
                    } else {

                    }
                    let proj = matchProj[Math.floor(Math.random() * matchProj.length)]
                    $('[data-popup-succ="project-name"]').text($(proj).find('.proj-global-item-link').text())
                    $('[data-popup-succ="project-thumb"]').attr('href',$(proj).find('.proj-global-item-link').attr('href'))
                    $('[data-popup-succ="project-thumb"]').find('.pop-ctc-succ-proj-img').attr('src',$(proj).find('.proj-global-item-img').attr('src'))
                }
            })
            inputInteractionInit('.pop-ctc-main')
            $('[data-popup="contact"]').on('click', function(e) {
                e.preventDefault();
                if ($('.pop-ctc').hasClass('active')) {
                    handleContactForm.close()
                    headerOnClose();
                    lenis.start();
                } else {
                    if (handleNav.isOpen()) {
                        handleNav.close()
                    }
                    if ($('.projdtl-sum-wrap').length && $('.projdtl-sum-wrap').hasClass('active')) {
                        $('.projdtl-sum-wrap').removeClass('active')
                        $('.projdtl-intro-toggle').removeClass('active')
                        $('.cursor-inner').removeClass('on-hover-md')
                        $('.cursor-ic.cursor-expand.to-close').removeClass('active')
                    }
                    handleContactForm.open()
                    headerOnOpen()
                    lenis.stop();
                }
            })
        },
        open: () => {
            $('.header-btn-ctc').addClass('active')
            $('.popup-ctc-bg').addClass('active')
            $('.header-toggle').addClass('on-handle-pop')
            if ($('.pop-ctc').hasClass('hidden')) {
                $('.pop-ctc').removeClass('hidden')
            }
            requestAnimationFrame(() => {
                $('.pop-ctc').addClass('active')
            })
            $('.header-prog').addClass('hidden')

            // gsap.set('.pop-ctc-main-bg, .pop-ctc-sub-bg', {scale: 0, transformOrigin: 'top left', overwrite: true})
            // gsap.set('.pop-ctc-main, .pop-ctc-sub', {clipPath: 'polygon(0% 0%, 0% 0%, 0% 0%, 0% 0%)', overwrite: true})
            let tlOpenPop = gsap.timeline({

            })
            tlOpenPop
            .set('.pop-ctc-main, .pop-ctc-sub', {transformOrigin: '10% 10%', scale: 0})
            .to('.pop-ctc-main, .pop-ctc-sub', {scale: 1, duration: .6, transformOrigin: '0% 0%', ease: 'power2.inOut'})
            // .to('.pop-ctc-main-bg', {scale: 1, duration: .8, ease: 'power2.out'}, "0")
            // .to('.pop-ctc-main', {clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', duration: .8, ease: 'power2.out'}, "<=0")
            // .to('.pop-ctc-sub-bg', {scale: 1, duration: .6, ease: 'power2.out'}, ".2")
            // .to('.pop-ctc-sub', {clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', duration: .6, ease: 'power2.out'}, "<=0")
        },
        close: () => {
            $('.header-btn-ctc').removeClass('active')
            $('.popup-ctc-bg').removeClass('active')
            $('.header-toggle').removeClass('on-handle-pop')
            $('.pop-ctc').removeClass('active')
            $('.header-prog').removeClass('hidden')

            let tlClosePop = gsap.timeline({

            })
            tlClosePop
            .fromTo('.pop-ctc-main, .pop-ctc-sub', {transformOrigin: '90% 90%'}, {scale: 0, duration: .6, transformOrigin: '100% 100%', ease: 'power2.inOut'})
            // .to('.pop-ctc-main-bg', {scale: 0, transformOrigin: 'bottom right', duration: .8, ease: 'power2.out'}, "0")
            // .to('.pop-ctc-main', {clipPath: 'polygon(100% 100%, 100% 100%, 100% 100%, 100% 100%)', duration: .8, ease: 'power2.out', clearProps: 'all'}, "<=0")
            // .to('.pop-ctc-sub-bg', {scale: 0, transformOrigin: 'bottom right', duration: .6, ease: 'power2.out'}, "0")
            // .to('.pop-ctc-sub', {clipPath: 'polygon(100% 100%, 100% 100%, 100% 100%, 100% 100%)', duration: .6, ease: 'power2.out', clearProps: 'all'}, "<=0")
            handleContactForm.reset()
        },
        reset: () => {
            if ($('.pop-ctc-succ.w-form-done').css('display') == 'block') {
                $('.pop-ctc-succ').css('display', 'none');
                $('.pop-ctc-main-wrap').css('display', 'block');
                $('.pop-ctc-main-wrap').trigger('reset');
                $('.pop-ctc-main-wrap .pop-ctc-step').removeClass('allow');
                $('.pop-ctc-main-wrap .pop-ctc-step-item').removeClass('active');
                $('.pop-ctc-main-wrap .input-grp').removeClass('filled');
                $('.pop-ctc-main-wrap .pop-ctc-act-wrap').removeClass('active')

                document.querySelector('.pop-ctc-form').scrollTo({
                    top: 0,
                    left: 0,
                    behavior: 'smooth'
                })
                allowedSteps = 0
                updateProg(allowedSteps)
            }
        },
        isOpen: () => {
            return $('.pop-ctc').hasClass('active')
        },
        update: (data) => {
            $(data.next.container).find('[data-popup="contact"]').on('click', function(e) {
                e.preventDefault();
                if ($('.pop-ctc').hasClass('active')) {
                    handleContactForm.close()
                    headerOnClose();
                    lenis.start();
                } else {
                    if (handleNav.isOpen()) {
                        handleNav.close()
                    }
                    if ($('.projdtl-sum-wrap').length >= 1 && $('.projdtl-sum-wrap').hasClass('active')) {
                        $('.projdtl-sum-wrap').removeClass('active')
                        $('.projdtl-intro-toggle').removeClass('active')
                        $('.cursor-inner').removeClass('on-hover-md')
                        $('.cursor-ic.cursor-expand.to-close').removeClass('active')
                    }
                    handleContactForm.open()
                    headerOnOpen()
                    lenis.stop();
                }
            })
        },
        updateProj: () => {

        }
    }
    handleContactForm.init()

    if ($(window).width() > 991) {
        const loadParticles = async (_confetti) => {
            const { confetti } = (await import('https://cdn.jsdelivr.net/npm/@tsparticles/confetti@3.0.3/+esm'));
            // const play  = (await import(`https://bitbucket.org/bear-plus/webflowjs/raw/master/Konpo/easter/${_confetti}.js`, { with: { type: "javascript" } })).play;
            if (playConfetti) {
                playConfetti("easterCanvas", confetti);
            }
        };
        $('[data-easter]').on("click", function() {
            loadParticles($(this).attr('data-easter'));

            gsap.to('[data-easter]', { autoAlpha: .5, pointerEvents: "none", duration: .5 });
            setTimeout(() => {
                gsap.to('[data-easter]', { autoAlpha: 1, pointerEvents: "auto" });
            }, 500);
        })
    }

    lenis.on('scroll', function(inst) {
        if (inst.scroll > $('.header-top').height() ) {
            $('.header-top').addClass('on-scroll')
        } else {
            $('.header-top').removeClass('on-scroll')
        }
    })
    const activeIndex = (el, currIdx) => {
        el.removeClass('active')
        el.eq(currIdx).addClass('active')
    }
    const handleEaterEgg = () => {
        const loadParticles = async (_confetti) => {
            const { confetti } = (await import('https://cdn.jsdelivr.net/npm/@tsparticles/confetti@3.0.3/+esm'));
            const play  = (await import(`./easter-egg/${_confetti}.js`, { with: { type: "javascript" } })).play;
            if (play) {
                await play("easterCanvas", confetti);
            }
        };

        $('[data-easter]').on("click", function() {
            loadParticles($(this).attr('data-easter'));
            gsap.to('[data-easter]', { autoAlpha: .5, pointerEvents: "none", duration: .5 });
            setTimeout(() => {
                gsap.to('[data-easter]', { autoAlpha: 1, pointerEvents: "auto" });
            }, 500);
        })
    }
    // handleEaterEgg();
    let idleTime = 0;
    const handleCursor = {
        updateHtml: () => {
            $('[data-cursor="btn"]').each((idx, el) => {
                $(el).find('.txt').css({
                    'position': 'relative',
                    'z-index': '2'
                })
                $(el).find('.ic-embed:not(.ic-arr-main):not(.ic-arr-clone)').css({
                    'position': 'relative',
                    'z-index': '2'
                })
                let btnDot = $(document.createElement('div')).addClass('btn-dot');
                let btnDotInner = $(document.createElement('div')).addClass('btn-dot-inner');
                btnDot.append(btnDotInner)
                $(el).append(btnDot)
            })
        },
        reUpdateHtml: (data) => {
            $(data.next.container).find('[data-cursor="btn"]').each((idx, el) => {
                $(el).find('.txt').css({
                    'position': 'relative',
                    'z-index': '2'
                })
                $(el).find('.ic-embed:not(.ic-arr-main):not(.ic-arr-clone)').css({
                    'position': 'relative',
                    'z-index': '2'
                })
                let btnDot = $(document.createElement('div')).addClass('btn-dot');
                let btnDotInner = $(document.createElement('div')).addClass('btn-dot-inner');
                btnDot.append(btnDotInner)
                $(el).append(btnDot)
            })
        },
        init: () => {
            let targetX = pointerCurr().x;
            let targetY = pointerCurr().y;
            let gotBtnSize = false;
            function updateIdle(cursorX) {
                let idleX = pointerCurr().x;
                if (Math.floor(cursorX) == Math.floor(idleX)) {
                    idleTime = idleTime + 1;
                } else {
                    idleTime = 0;
                }
                if (idleTime > 2 * 60) {
                    $('.cursor-inner').addClass('on-idle')
                } else {
                    $('.cursor-inner').removeClass('on-idle')
                }
            }
            function moveCursor() {
                let cursorX = xGetter('.cursor')
                let cursorY = yGetter('.cursor')
                updateIdle(cursorX)
                handleCursor.reset()
                if ($('[data-cursor]:hover').length) {
                    let type = $('[data-cursor]:hover').attr('data-cursor')
                        switch (type) {
                            case 'social':
                                $('.cursor-inner').addClass('on-hover')
                                let socialType = $('[data-cursor]:hover').attr('data-cursor-social')
                                $('.cursor-inner .cursor-ic').removeClass('active')
                                $(`.cursor-inner .cursor-ic[data-cursor-view=${socialType}]`).addClass('active')
                                break;
                            case 'ext':
                                $('.cursor-inner').addClass('on-hover')
                                $('.cursor-inner .cursor-ic.cursor-arrow').addClass('active')
                                break;
                            case 'expand':
                                $('.cursor-inner').addClass('on-hover')
                                $('.cursor-inner .cursor-ic.cursor-expand').addClass('active')
                                if ($('[data-cursor]:hover').hasClass('active')) {
                                    $('.cursor-inner .cursor-ic.cursor-expand').addClass('to-close')
                                } else {
                                    $('.cursor-inner .cursor-ic.cursor-expand').removeClass('to-close')
                                }
                                break;
                            case 'expand-md':
                                if (!$('.cursor-inner').hasClass('on-hover-md')) {
                                    $('.cursor-inner').addClass('on-hover-md')
                                    $('.cursor-inner .cursor-ic.cursor-expand').addClass('active')
                                }
                                if ($('[data-cursor="expand-md"]').hasClass('active')) {
                                    $('.cursor-inner .cursor-ic.cursor-expand').addClass('to-close')
                                } else {
                                    $('.cursor-inner .cursor-ic.cursor-expand').removeClass('to-close')
                                }
                                break;
                            case 'expand-md-sm':
                                if (!$('.cursor-inner').hasClass('on-hover-md-sm')) {
                                    $('.cursor-inner').addClass('on-hover-md-sm')
                                    $('.cursor-inner .cursor-ic.cursor-expand').addClass('active').addClass('mod-20')
                                    $('.cursor-inner .cursor-video').find('.cursor-txt-close').removeClass('active')
                                }
                                break;
                            case 'txtLink':
                                $('.cursor-inner').addClass('on-hover-sm');
                                let targetEl;
                                if ($('[data-cursor]:hover').attr('data-cursor-txtLink') == 'parent') {
                                    targetEl = $('[data-cursor]:hover').parent()
                                } else if ($('[data-cursor]:hover').attr('data-cursor-txtLink') == 'child') {
                                    targetEl = $('[data-cursor]:hover').find('[data-cursor-txtLink-child]')
                                } else {
                                    targetEl = $('[data-cursor]:hover')
                                }

                                let targetGap = 8;
                                if ($('[data-cursor]:hover').attr('data-cursor-txtLink-gap')) {
                                    targetGap = $('[data-cursor]:hover').attr('data-cursor-txtLink-gap')
                                }
                                targetX = targetEl.get(0).getBoundingClientRect().left - parseRem(targetGap) - $('.cursor-inner.on-hover-sm').width() / 2;
                                targetY = targetEl.get(0).getBoundingClientRect().top + targetEl.get(0).getBoundingClientRect().height / 2;
                                break;
                            case 'btn':
                                $('.cursor-inner').addClass('on-hidden');
                                let targetBtn;
                                targetBtn = $('[data-cursor="btn"]:hover')
                                targetX = targetBtn.get(0).getBoundingClientRect().left + targetBtn.get(0).getBoundingClientRect().width / 2;
                                targetY = targetBtn.get(0).getBoundingClientRect().top + targetBtn.get(0).getBoundingClientRect().height / 2;
                                let btnDotX, btnDotY;
                                if (!gotBtnSize) {
                                    if ($('[data-cursor]:hover').hasClass('home-ser-item-btn')) {
                                        gsap.set('html', {'--cursor-width': targetBtn.get(0).getBoundingClientRect().width + parseRem(130), '--cursor-height': targetBtn.get(0).getBoundingClientRect().height + parseRem(130)})
                                    } else if ($('[data-cursor]:hover').hasClass('sm-menu')) {
                                        gsap.set('html', {'--cursor-width': targetBtn.get(0).getBoundingClientRect().width * 1.3, '--cursor-height': targetBtn.get(0).getBoundingClientRect().height * 1.3})
                                    } else {
                                        gsap.set('html', {'--cursor-width': targetBtn.get(0).getBoundingClientRect().width, '--cursor-height': targetBtn.get(0).getBoundingClientRect().height})
                                    }

                                    btnDotX = (pointerCurr().x - targetBtn.get(0).getBoundingClientRect().left)
                                    btnDotY = (pointerCurr().y - targetBtn.get(0).getBoundingClientRect().top)
                                    xSetter('[data-cursor]:hover .btn-dot')(lerp(btnDotX, (pointerCurr().x - targetBtn.get(0).getBoundingClientRect().left)), .09)
                                    ySetter('[data-cursor]:hover .btn-dot')(lerp(btnDotY, (pointerCurr().y - targetBtn.get(0).getBoundingClientRect().top)), .09)
                                    gotBtnSize = true
                                } else {
                                    btnDotX = xGetter('[data-cursor]:hover .btn-dot')
                                    btnDotY = yGetter('[data-cursor]:hover .btn-dot')
                                    xSetter('[data-cursor]:hover .btn-dot')(lerp(btnDotX, (pointerCurr().x - targetBtn.get(0).getBoundingClientRect().left)), .09)
                                    ySetter('[data-cursor]:hover .btn-dot')(lerp(btnDotY, (pointerCurr().y - targetBtn.get(0).getBoundingClientRect().top)), .09)
                                }

                                break;
                            case 'btn-inner':
                                $('.cursor-inner').addClass('on-hover-btn');
                                let targetBtnInner;
                                targetBtnInner = $('[data-cursor="btn-inner"]:hover').find('[data-cursor-btn-inner]')
                                targetX = targetBtnInner.get(0).getBoundingClientRect().left + targetBtnInner.get(0).getBoundingClientRect().width / 2;
                                targetY = targetBtnInner.get(0).getBoundingClientRect().top + targetBtnInner.get(0).getBoundingClientRect().height / 2;
                                if (!gotBtnSize) {
                                    gsap.set('html', {'--cursor-width': targetBtnInner.get(0).getBoundingClientRect().width * .8, '--cursor-height': targetBtnInner.get(0).getBoundingClientRect().height * .8})
                                    gotBtnSize = true
                                }
                                break;
                            case 'video':
                                if ($('[data-cursor]:hover').length > 1) {
                                    return
                                }
                                $('.cursor-inner').addClass('on-hover-video');
                                if ($('[data-video]').attr('data-video') == 'to-play') {
                                    $('.cursor-inner .cursor-video').find('.cursor-video-pause').removeClass('active')
                                    $('.cursor-inner .cursor-video').find('.cursor-video-play').addClass('active')
                                } else {
                                    $('.cursor-inner .cursor-video').find('.cursor-video-pause').addClass('active')
                                    $('.cursor-inner .cursor-video').find('.cursor-video-play').removeClass('active')
                                }

                                break;
                            case 'soon':
                                $('.cursor-inner').removeClass('on-hover');

                                $('.cursor-inner').addClass('on-hover-soon');
                                $('.cursor-inner .cursor-video').find('.cursor-txt-soon').addClass('active')
                                $('.cursor-inner .cursor-video').find('.cursor-txt-case').removeClass('active')
                                $('.cursor-inner .cursor-video').find('.cursor-txt-close').removeClass('active')
                                break;
                            case 'drag':
                                $('.cursor-inner').addClass('on-hover');
                                $('.cursor-inner .cursor-video').find('.cursor-txt-drag').addClass('active')
                                break;
                            case 'case':
                                $('.cursor-inner').removeClass('on-hover-soon');

                                $('.cursor-inner').addClass('on-hover');
                                $('.cursor-inner .cursor-video').find('.cursor-txt-case').addClass('active')
                                $('.cursor-inner .cursor-video').find('.cursor-txt-soon').removeClass('active')
                                $('.cursor-inner .cursor-video').find('.cursor-txt-close').removeClass('active')
                                break;
                            case 'close':
                                $('.cursor-inner').removeClass('on-hover-soon');
                                $('.cursor-inner').removeClass('on-hidden')
                                $('.cursor-ic.cursor-expand').removeClass('active')
                                $('.cursor-inner').addClass('on-hover');
                                $('.cursor-inner .cursor-video').find('.cursor-txt-case').removeClass('active')
                                $('.cursor-inner .cursor-video').find('.cursor-txt-soon').removeClass('active')
                                $('.cursor-inner .cursor-video').find('.cursor-txt-close').addClass('active')
                                break;
                            case 'hidden':
                                $('.cursor-inner').removeClass('on-hover-soon');
                                $('.cursor-inner').removeClass('on-hover');
                                $('.cursor-inner .cursor-video').find('.cursor-txt-case').removeClass('active')
                                $('.cursor-inner .cursor-video').find('.cursor-txt-soon').removeClass('active')
                                $('.cursor-inner .cursor-video').find('.cursor-txt-close').removeClass('active')
                                $('.cursor-inner').addClass('on-hidden')
                                break;
                            case 'img':
                                let imgEl = $('[data-cursor]:hover')
                                let imgSrc = imgEl.attr('data-cursor-img')
                                let imgRatio = imgEl.attr('data-cursor-img-ratio')
                                &
                                $('.cursor-img img').attr('src', imgSrc)
                                $('.cursor-img-inner, .cursor-img-inner-img').css('aspect-ratio', imgRatio)
                                $('.cursor-inner').addClass('on-hover-img');
                                $('.cursor-inner').addClass('on-hidden');
                                $('.cursor-img').addClass('active')
                                break;
                            default:
                            break;
                        }
                } else {
                    gotBtnSize = false;
                }

                if ($('.cursor-inner').hasClass('on-hover-sm')) {
                    xSetter('.cursor')(lerp(cursorX, targetX, 0.09))
                    ySetter('.cursor')(lerp(cursorY, targetY, 0.09))
                } else if ($('.cursor-inner').hasClass('on-hover-md')) {
                    if ( $('.projdtl-intro-toggle').hasClass('active')) {
                        if ($('.projdtl-sum:hover').length || $('.header > *:hover').length) {
                            xSetter('.cursor')(lerp(cursorX, $('.projdtl-intro-toggle-wrap').get(0).getBoundingClientRect().left + $('.projdtl-intro-toggle').outerWidth() / 2, 0.09))
                            ySetter('.cursor')(lerp(cursorY, $('.projdtl-intro-toggle-wrap').get(0).getBoundingClientRect().top + $('.projdtl-intro-toggle').outerHeight() / 2, 0.09))
                        } else {
                            xSetter('.cursor')(lerp(cursorX, pointerCurr().x, 0.09))
                            ySetter('.cursor')(lerp(cursorY, pointerCurr().y, 0.09))
                        }
                    } else {
                        xSetter('.cursor')(lerp(cursorX, pointerCurr().x, 0.09))
                        ySetter('.cursor')(lerp(cursorY, pointerCurr().y, 0.09))
                    }
                } else if ($('.cursor-inner').hasClass('on-hover-btn')) {
                    xSetter('.cursor')(lerp(cursorX, targetX, 0.09))
                    ySetter('.cursor')(lerp(cursorY, targetY, 0.09))
                } else {
                    xSetter('.cursor')(lerp(cursorX, pointerCurr().x, 0.09))
                    ySetter('.cursor')(lerp(cursorY, pointerCurr().y, 0.09))
                }
                if ($('.loader24-video [data-video]').length) {
                    if ($('.loader24-video [data-video]:hover').length && $('.cursor-vid-prog').length) {
                        $('.cursor-vid-prog').addClass('active')
                    } else {
                        $('.cursor-vid-prog').removeClass('active')
                    }
                } else if ($('.popup-reel').length) {
                    if ($('.popup-reel [data-video]:hover').length && $('.cursor-vid-prog').length) {
                        $('.cursor-vid-prog').addClass('active')
                    } else {
                        $('.cursor-vid-prog').removeClass('active')
                    }
                }
                requestAnimationFrame(moveCursor)
            }
            requestAnimationFrame(moveCursor)
        },
        show: () => {
            $('.cursor-wrap').removeClass('hidden')
        },
        hide: () => {
            $('.cursor-wrap').addClass('hidden')
        },
        reset: () => {
            $('.cursor-inner').removeClass('on-hover on-hover-sm on-hover-md on-hover-md-sm on-hidden on-hover-btn on-hover-video on-hover-soon on-hover-img')
            $('.cursor-inner .cursor-ic').removeClass('active mod-20')
            $('.cursor-inner .cursor-video').find('.cursor-txt-case, .cursor-txt-close, .cursor-txt-drag, .cursor-video-play, .cursor-video-pause, .cursor-txt-soon').removeClass('active')
            $('.cursor-img').removeClass('active')
        }
    }
    if ($(window).width() > 767 && !isTouchDevice()) {
        handleCursor.updateHtml()
        handleCursor.init()
    }
    // const textReplace = (data) => {
    //     let ftText = $(data.next.container).attr('footer-txt')
    //     if (ftText) {
    //         $(data.next.container).find('.ft-title').text(ftText)
    //     } else {
    //         ftText = "Let's Jam."
    //         $(data.next.container).find('.ft-title').text(ftText)
    //     }
    // }
    function magnetMove() {
        $('[data-magnetic]').on('pointerleave', function(e) {
            gsap.to(this, {
                x: 0,
                y: 0,
                duration: 1,
                ease: "elastic.out(1,0.3)",
                overwrite: true,
            })
        })

        function move() {
            if ($('[data-magnetic]:hover').length) {
                $('[data-magnetic]:hover').css('zIndex', '1');
                let strength = $('[data-magnetic]:hover').attr('data-magnetic');
                let targetX = xGetter('[data-magnetic]:hover');
                let targetY = yGetter('[data-magnetic]:hover');
                $('[data-magnetic]:hover').css('zIndex', '2');
                let x = (pointerCurr().x - $('[data-magnetic]:hover').get(0).getBoundingClientRect().left - $('[data-magnetic]:hover').outerWidth() / 2) / ($('[data-magnetic]:hover').outerWidth() / 2);
                let y = (pointerCurr().y - $('[data-magnetic]:hover').get(0).getBoundingClientRect().top - $('[data-magnetic]:hover').outerHeight() / 2) / ($('[data-magnetic]:hover').outerHeight() / 2);
                xSetter('[data-magnetic]:hover')(lerp(targetX, strength*x, 0.04))
                ySetter('[data-magnetic]:hover')(lerp(targetY, strength*y, 0.04))
            }
            requestAnimationFrame(move)
        }
        requestAnimationFrame(move)
    }
    function initTitleMouseMove(data) {
        if ($(data.next.container).find('[data-move="wrap"]').length >= 1) {
            $(data.next.container).find('[data-move="wrap"]').each((idx, el) => {
                let defaultX;
                if ($(el).find('[data-move="inner"]').attr('data-move-sc') == 'home-projects'){
                    if ($(window).width() > 991) {
                        defaultX = ($('.container').width() - (parseFloat($('.container').css('column-gap')) * 15)) / 16 * 3 + (parseFloat($('.container').css('column-gap')) * 3)
                    } else if ($(window).width() > 767) {
                        defaultX = ($('.container').width() - (parseFloat($('.container').css('column-gap')) * 11)) / 12 * 2 + (parseFloat($('.container').css('column-gap')) * 2)
                    } else {
                        defaultX = 0
                    }

                } else if ($(el).find('[data-move="inner"]').attr('data-move-sc') == 'home-service') {
                    defaultX = parseFloat($(el).find('.home-title').css('margin-left'));
                    $(el).find('.home-title').css('margin-left','0')
                } else {
                    defaultX = 0
                }
                if ($('[data-move="wrap"]').find('[data-move="inner"]')) {
                    function mousMove() {
                        let iconsX = xGetter(el.querySelector('[data-move="inner"]'));
                        let targetX;
                        if ($(el).is(':hover')) {
                            if ($(el).find('[data-move="inner"]').hasClass('ft-title')) {
                                targetX = ((pointerCurr().x - el.getBoundingClientRect().left) / $(el).outerWidth()) * ($(el).outerWidth() - $(el).find('[data-move="inner"]').outerWidth() - $(el).find('.btn-inner').outerWidth())
                            } else if ($(el).find('[data-move="inner"]').hasClass('notfound-title')) {
                                targetX = ((pointerCurr().x - el.getBoundingClientRect().left) / $(el).outerWidth()) * ($(el).outerWidth() - $(el).find('[data-move="inner"]').outerWidth() - $(el).find('.btn-inner').outerWidth())
                            } else {
                                targetX = ((pointerCurr().x - el.getBoundingClientRect().left) / $(el).outerWidth()) * ($(el).outerWidth() - $(el).find('[data-move="inner"]').outerWidth())
                            }
                        } else {
                            targetX = defaultX;
                        }
                        xSetter(el.querySelector('[data-move="inner"]'))(lerp(iconsX, targetX, 0.03));
                        requestAnimationFrame(mousMove)
                    }
                    requestAnimationFrame(mousMove)
                }
            })
        }
    }

    function isInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= -rect.height &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + rect.height &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
    function initFooter() {
        let ftBox = $('.ft-social-box')
        const handlerFtSocial = {
            hoverIn: (wrap, txt, num) => {
                gsap.set(num.chars, {yPercent: 60, autoAlpha: 0, overwrite: true})
                gsap.set(txt.chars, {yPercent: 60, autoAlpha: 0, overwrite: true})
                let tlIn = gsap.timeline({})
                tlIn
                .to(num.chars, {yPercent: 0, autoAlpha: 1, stagger: .02, duration: .6, ease: gOpts.ease,}, 0)
                .to(txt.chars, {yPercent: 0, autoAlpha: 1, stagger: .01, duration: .4, ease: gOpts.ease,}, '<=.2')
            },
            hoverOut: (wrap, txt, num) => {
                let tlOut = gsap.timeline({
                    overwrite: true
                })
                tlOut
                .to(num.chars, {yPercent: 60, autoAlpha: 0, stagger: .02, duration: .4, ease: gOpts.ease,}, 0)
                .to(txt.chars, {yPercent: 60, autoAlpha: 0, stagger: .01, duration: .4, ease: gOpts.ease,}, 0)
            }
        }
        ftBox.each((idx, el) => {
            let wrap = $(el).find('.ft-social-subs-wrap')
            let txt = new SplitText($(el).find('.ft-social-subs-txt'), typeOpts.chars)
            let num = new SplitText($(el).find('.ft-social-subs-num'), typeOpts.chars)

            $(el).on('pointerenter', function(e) {
                e.preventDefault()
                activeIndex(ftBox, idx)
                handlerFtSocial.hoverIn(wrap, txt, num)
            })
            $(el).on('pointerleave', function(e) {
                ftBox.removeClass('active')
                handlerFtSocial.hoverOut(wrap, txt, num)
            })
        })
    }
    if (!isTouchDevice()) {
        if ($(window).width() > 991) {
            magnetMove()
            initFooter()
            if ($('[data-move="wrap"]').length) {
                if ($('[data-move="wrap"]').find('.title-dot-canvas').length) {
                    $('[data-move="wrap"]').each((idx, el) => {
                        if (idx == 2 || idx == 1 || idx == 0) {
                            requestAnimationFrame(() => {
                                initTitleGrid($(el).find('.title-dot-canvas'))
                            })
                        }
                    })
                }
            }
        }
    }
    let headerProgTl, myInterval;
    function scrollProg(container) {
        if (myInterval) {
            clearInterval(myInterval);
        }
        // let sections = $(container).find('[data-section]:not(.w-conditional-invisible)');
        // let progItem = $('.header-prog-item-wrap').eq(0).clone();
        // $('.header-prog-inner').html('')
        // sections.each((idx, el) => {
        //     progItem.clone().appendTo('.header-prog-inner')
        // })
        // $('.header-prog-item-wrap').removeClass('active');
        // $('.header-prog-item-wrap').eq(0).addClass('active');
        // gsap.set('.header-prog-seek', {y: $('.header-prog-item-wrap.active').get(0).getBoundingClientRect().top + $('.header-prog-item-wrap.active').get(0).getBoundingClientRect().height / 2 - parseRem(2) - $('.header-prog-inner').get(0).getBoundingClientRect().top, overwrite: true})
        let des = ($('.header-prog').height() - $('.header-prog-inner').height()) / $('.header-prog').height() * 100;
        headerProgTl = gsap.timeline({
            scrollTrigger: {
                trigger: container,
                start:' top top',
                end: 'bottom bottom',
                scrub: true
                // An onUpdate here used to set a clip-path from css('top') minus a number, which is NaN, so it
                // never applied but forced a layout on every scroll frame. Removed in v1.2.0.
            }
        })
        headerProgTl
        .fromTo('.header-prog-inner', {top: '0%'}, {top: `${$('.header-prog').height() - $('.header-prog-inner').height()}`, ease: 'none'})
        // .fromTo('.header-prog-bg.start', {clipPath: `polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)`}, {clipPath: `polygon(0% 0%, 100% 0%, 100% ${des}%, 0% ${des}%)`, ease: 'none'}, 0)
        // .fromTo('.header-prog-bg.end', {clipPath: `polygon(0% ${100 - des}%, 100% ${100 - des}%, 100% 100%, 0% 100%)`}, {clipPath: `polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)`, ease: 'none'}, 0)
        .fromTo('.header-prog-bg.start', {height: `0%`}, {height: `${des}%`, ease: 'none'}, 0)
        .fromTo('.header-prog-bg.end', {height: `${des}%`}, {height: `0%`, ease: 'none'}, 0)

        if ($(container).attr('data-barba-namespace') == 'notfound') {
            console.log('notfoundddddd')
            $('.header-prog').addClass('hidden')
        }
        if ($(container).attr('data-barba-namespace') == 'projDtl') {
            if ($(window).width() > 991) {
                function myTimer() {
                    headerProgTl.scrollTrigger.refresh()
                }
                myInterval = setInterval(myTimer, 2000);
            }
        }
    }
    class physical {
        constructor(target) {
            this.canvas = $(target);
            this.preSetup()

            this.canvasSize = {
                width: this.canvas.width(),
                height: this.canvas.height()
            };
            this.pixelRatio = window.devicePixelRatio
            this.render = this.Render.create({
                element: this.canvas.get(0),
                engine: this.engine,
                options: {
                    width: this.canvasSize.width,
                    height: this.canvasSize.height,
                    pixelRatio: this.pixelRatio,
                    background: 'transparent',
                    contain: 'transparent',
                    wireframes: false,
                }
            });
            this.setupGround();
            this.setupRandomCircle();
            this.setupPillShape()
            this.initMouseMove();
        }
        preSetup() {
            this.Engine = Matter.Engine;
            this.Render = Matter.Render;
            this.Runner = Matter.Runner;
            this.Events = Matter.Events;
            this.Composite = Matter.Composite;
            this.MouseConstraint = Matter.MouseConstraint;
            this.Mouse = Matter.Mouse;
            this.World = Matter.World;
            this.Bodies = Matter.Bodies;
            this.Body = Matter.Body;

            this.engine = this.Engine.create();
            this.world = this.engine.world;

            this.thickness = 3000000;
            this.hideGr = this.thickness / 2 - 5;
            this.pillSvg = [
                {
                    name: 'wireframe',
                    shape: 'https://uploads-ssl.webflow.com/65544f28fc8e963bc080b6f4/657d6ca642a3aaa0355be68b_wireframe.svg',
                },
                {
                    name: 'moodboard',
                    shape: 'https://uploads-ssl.webflow.com/65544f28fc8e963bc080b6f4/657d6ca6eac136d96d139c3f_MoodB.svg',
                },
                {
                    name: 'uxui',
                    shape: 'https://uploads-ssl.webflow.com/65544f28fc8e963bc080b6f4/657d6ca654838aafd21fe7e7_uxui.svg',
                },
                {
                    name: 'interaction',
                    shape: 'https://uploads-ssl.webflow.com/65544f28fc8e963bc080b6f4/657d6ca63e44cc3168e0f1af_interaction.svg',
                },
                {
                    name: 'remote',
                    shape: 'https://uploads-ssl.webflow.com/65544f28fc8e963bc080b6f4/657d6ca6fb8709505411c3db_remote.svg',
                },
                {
                    name: 'designsystem',
                    shape: 'https://uploads-ssl.webflow.com/65544f28fc8e963bc080b6f4/657d6ca6e7ea1b094647d724_designsystem.svg',
                },
                {
                    name: 'webflow',
                    shape: 'https://uploads-ssl.webflow.com/65544f28fc8e963bc080b6f4/657d83a7fe6a1b80f0f40e18_Webflow.svg',
                },
                {
                    name: 'component',
                    shape: 'https://uploads-ssl.webflow.com/65544f28fc8e963bc080b6f4/657d6ca662d48bffd4a136d4_component.svg',
                },
                {
                    name: 'landingpagedesign',
                    shape: 'https://uploads-ssl.webflow.com/65544f28fc8e963bc080b6f4/657d6ca6b8e1715fecbc041f_LandPDesign.svg',
                },
                {
                    name: 'minimalist',
                    shape: 'https://uploads-ssl.webflow.com/65544f28fc8e963bc080b6f4/657d6ca65bf5a83f4faafae2_minimalist.svg',
                },
                {
                    name: 'interface',
                    shape: 'https://uploads-ssl.webflow.com/65544f28fc8e963bc080b6f4/657d6ca5ffd0b1429fcf6637_interface.svg',
                },
                {
                    name: 'aboutus',
                    shape: 'https://uploads-ssl.webflow.com/65544f28fc8e963bc080b6f4/657d6ca5dd1607d815ddd796_abt-us.svg',
                },
                {
                    name: 'konpo',
                    shape: 'https://uploads-ssl.webflow.com/65544f28fc8e963bc080b6f4/657fc09f30cef4d166cd24e8_Konpo.svg',
                },
                {
                    name: 'figma',
                    shape: 'https://uploads-ssl.webflow.com/65544f28fc8e963bc080b6f4/657fc05b465ed5c6e7e2fc27_figma.svg',
                },
                {
                    name: 'imgthumb',
                    shape: 'https://uploads-ssl.webflow.com/65544f28fc8e963bc080b6f4/657d83b6a0fbf5e81c832a91_imgthumb.svg',
                },
            ]
        }

        boundry(x, y, w, h) {
            let body = this.Bodies.rectangle(x, y, w, h, {
                friction: 0.3,
                restitution: 0.9,
                isStatic: true,
                render: {
                    fillStyle: 'transparent',
                }
            });
            this.World.add(this.world, body);
            return body;
        }

        circleObject() {
            let sizes = [];
            if ($(window).width() > 991) {
                sizes = [parseRem(14), parseRem(11), parseRem(10), parseRem(7.5), parseRem(4.2), parseRem(3.1), parseRem(2)];
            } else {
                sizes = [parseRem(7), parseRem(5.35), parseRem(5), parseRem(3.75), parseRem(2.1), parseRem(1.55)];
            }
            let colors = ['#EFEFEF', '#CBF5AF', '#D8C8FF'];

            const randomIndex = Math.floor(Math.random() * colors.length);
            const r = sizes[Math.floor(Math.random() * sizes.length)] * 10;

            const objecOpts = {
                friction: 0.4,
                frictionAir: 0.015,
                restitution: 0.7,
                angle: 0,
                render: {
                    fillStyle: colors[randomIndex],
                    lineWidth: 1,
                    strokeStyle: "#9B9B9B",
                }
            };

            const body = this.Bodies.circle(
                r / 2 + Math.random() * (this.canvasSize.width - r),
                r / 2 + Math.random() * (this.canvasSize.height - r),
                r / 2,
                objecOpts
            );
            this.World.add(this.world, body);
        }

        pillShape(targetUrl, x, y) {
            let svgLoader = async function(target) {
                try {
                    const response = await fetch(target);
                    const raw = await response.text();
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(raw, 'image/svg+xml');
                    const svgElement = doc.querySelector('svg');
                    const svgWidth = svgElement.getAttribute('width');
                    const svgHeight = svgElement.getAttribute('height');
                    return {
                        width: svgWidth,
                        height: svgHeight
                    };
                } catch (error) {
                    console.error('Error loading SVG:', error);
                }
            };

            const createPillShape = async () => {
                const {
                    width,
                    height
                } = await svgLoader(targetUrl.shape);
                let svgSize;
                if ($(window).width() > 991) {
                    svgSize = {
                        width: parseRem(width),
                        height: parseRem(height)
                    };
                } else if ($(window).width() > 767) {
                    svgSize = {
                        width: parseRem(width / 1.5),
                        height: parseRem(height / 1.5)
                    };
                } else {
                    svgSize = {
                        width: parseRem(width / 2),
                        height: parseRem(height / 2)
                    };
                }
                let svgScale = svgSize.width / width;

                const objectOpts = {
                    friction: 0.4,
                    restitution: 0.4,
                    angle: 0,
                    chamfer: {
                        radius: svgSize.height / 2
                    },
                    render: {
                        sprite: {
                            texture: targetUrl.shape,
                            xScale: svgScale,
                            yScale: svgScale
                        }
                    },
                };
                let randomPos = {};
                if (!x && !y) {
                    randomPos = {
                        x: svgSize.width / 2 + Math.random() * (this.canvasSize.width - svgSize.width),
                        y: svgSize.height / 2 + Math.random() * (this.canvasSize.height - svgSize.height)
                    };
                } else {
                    randomPos = {
                        x,
                        y
                    };
                }
                this.body = this.Bodies.rectangle(randomPos.x, randomPos.y, svgSize.width, svgSize.height, objectOpts);
                this.World.add(this.world, this.body);
            };

            createPillShape();
        }

        setupGround() {
            let ground = this.boundry(this.canvasSize.width / 2, this.canvasSize.height + this.hideGr, this.canvasSize.width, this.thickness);
            let wallL = this.boundry(-this.hideGr, this.canvasSize.height / 2, this.thickness, this.canvasSize.height);
            let wallR = this.boundry(this.canvasSize.width + this.hideGr, this.canvasSize.height / 2, this.thickness, this.canvasSize.height);
            let roof = this.boundry(this.canvasSize.width / 2, -this.hideGr, this.canvasSize.width, this.thickness);
        }
        setupRandomCircle() {
            let circles = [];
            if ($(window).width() > 991) {
                for (let i = 1; i <= 30; i++) {
                    circles.push(this.circleObject());
                }
            } else if ($(window).width() > 767) {
                for (let i = 1; i <= 20; i++) {
                    circles.push(this.circleObject());
                }
            } else {
                for (let i = 1; i <= 8; i++) {
                    circles.push(this.circleObject());
                }
            }
        }
        setupPillShape() {
            this.wireframe = this.pillShape(this.pillSvg[0]);
            this.uxui = this.pillShape(this.pillSvg[2]);
            this.interaction = this.pillShape(this.pillSvg[3]);
            this.remote = this.pillShape(this.pillSvg[4]);
            this.designsystem = this.pillShape(this.pillSvg[5]);
            this.webflow = this.pillShape(this.pillSvg[6]);
            this.component = this.pillShape(this.pillSvg[7]);
            this.landingpagedesign = this.pillShape(this.pillSvg[8]);
            this.minimalist = this.pillShape(this.pillSvg[9]);
            this.interface = this.pillShape(this.pillSvg[10]);
            // this.aboutus = this.pillShape(this.pillSvg[11]);
            this.konpo = this.pillShape(this.pillSvg[12], this.canvasSize.width/2, this.canvasSize.height/2);
            this.figma = this.pillShape(this.pillSvg[13]);
            this.imgthumb = this.pillShape(this.pillSvg[14]);
        }
        initMouseMove() {
            let mouse = this.Mouse.create(this.render.canvas);
            let mouseConstraint = this.MouseConstraint.create(this.engine, {
                mouse: mouse,
                constraint: {
                    stiffness: 0.2,
                    render: {
                        visible: false
                    }
                }
            });
            this.World.add(this.world, mouseConstraint);
            this.render.mouse = mouse;
        }
        startAnim() {
            if ($('.abt-decor-canvas').length) {
                this.Engine.update(this.engine, 1000 / 60)
                this.Render.world(this.render);
                requestAnimationFrame(this.startAnim.bind(this));
            } else {
            }
        }
        destroy() {
            this.Render.stop(this.render)
            this.World.clear(this.engine.world)
            this.Engine.clear(this.engine)
            this.render.canvas.remove();
            this.render.canvas = null;
            this.render.context = null;
            this.render.textures = {};
        }
    }
    function updateComingSoon(data, itemClass) {
        let allProjItems = $(data.next.container).find(itemClass)
        allProjItems.each((idx, el) => {
            if (!$(el).find('[data-soon]').hasClass('w-condition-invisible')) {
                $(el).find('[data-cursor]').each((idx, el) => {
                    if ($(el).attr('data-cursor') == 'case') {
                        $(el).attr('data-cursor', 'soon')
                    } else if ($(el).attr('data-cursor') == 'expand-md-sm') {} else {
                        if ($(el).hasClass('projdtl-sum-label-hide')) {

                        } else if ($(el).hasClass('projdtl-sum-overlay')) {

                        } else {
                            $(el).addClass('pe-none')
                        }
                    }
                    $(el).attr('href', '#')
                })
            }
        })
        $(data.next.container).find('.projdtl-sum-overlay').on('click', function(e) {
            e.preventDefault();
            if (!$('.projdtl-sum:hover').length) {
                $('.projdtl-sum-wrap.active').removeClass('active');
                lenis.start()
            }
        })
    }
    function updateProjVideo(data, itemClass) {
        if ($(window).width() >= 768) {
            let allProjItems = $(data.next.container).find(itemClass)
            allProjItems.each((idx, el) => {
                if (!$(el).find('[data-thumb-video]').hasClass('w-condition-invisible')) {
                    $(el).find('.prj-img').eq(0).addClass('has-video');
                    let vidEl = $(document.createElement('div')).addClass('img-basic img-fill prj-vid');
                    let vidInner = $(`<video muted loop playsinline autoplay class="video-wrap"><source src=${$(el).find('[data-thumb-video]').text()} type="video/mp4"></video>`)
                    vidInner.appendTo(vidEl)
                    $(el).find('.prj-img').eq(0).css('opacity', '0')
                    vidEl.appendTo($(el).find('.proj-gall-item-inner').eq(0))
                }
            })
        }
    }
    //Thumbnail
    let sumPopupThumbSwiper;
    let sumPopupMainSwiper;

    $('.gal-popup .gal-popup-close-btn').on('click', function(e) {
        e.preventDefault();
        $('.gal-popup').removeClass('active')
    })
    $(window).on('keyup', function(e) {
        e.preventDefault();
        if (e.keyCode === 27) {
            $('.gal-popup').removeClass('active')
        }
    })

    function projSumPopupOpen(targetIdx, targetProj, imgArray) {
        // Init Gallery
        if (!sumPopupThumbSwiper && !sumPopupMainSwiper) {
            sumPopupThumbSwiper = new Swiper('.gal-popup-thumb-cms', {
                slidesPerView: 'auto',
                watchSlidesProgress: true,
                allowTouchMove: true,
                breakpoints: {
                    767: {
                        allowTouchMove: false,
                        spaceBetween: parseRem(10),
                    }
                }
            })
            sumPopupMainSwiper = new Swiper('.gal-popup-main-cms', {
                slidesPerView: 1,
                centeredSlides: true,
                effect: 'fade',
                fadeEffect: {
                    crossFade: true,
                },
                // thumbs: {
                //     swiper: sumPopupThumbSwiper,
                // },
            });
            sumPopupMainSwiper.on('activeIndexChange', (swiper) => {
                sumPopupThumbActive(swiper.realIndex)
                sumPopupThumbSwiper.slideTo(swiper.realIndex)
            })
        }

        // Update Gallery
        if ($('.gal-popup').attr('data-current-proj') != targetProj) {
            $('.gal-popup').attr('data-current-proj', targetProj);
            let mainImgTemplate = $('.gal-popup').find('.gal-popup-main-item').eq(0).clone();
            let thumbImgTemplate = $('.gal-popup').find('.gal-popup-thumb-item').eq(0).clone();
            $('.gal-popup').find('.gal-popup-main-list').html('')
            $('.gal-popup').find('.gal-popup-thumb-list').html('')
            // for (let x = 0; x < 6; x++) {
                imgArray.each((idx, img) => {
                    let mainImgHtml = mainImgTemplate.clone()
                    let thumbImgHtml = thumbImgTemplate.clone()
                    mainImgHtml.find('img').attr('src', $(img).attr('src'))
                    thumbImgHtml.find('img').attr('src', $(img).attr('src'))
                    $('.gal-popup').find('.gal-popup-main-list').append(mainImgHtml)
                    $('.gal-popup').find('.gal-popup-thumb-list').append(thumbImgHtml)
                })
            // }
            sumPopupThumbSwiper.update()
            sumPopupMainSwiper.update()
            $('.gal-popup-thumb-item').on('click', function(e) {
                e.preventDefault();
                let index = $(this).index()
                sumPopupMainSwiper.slideTo(index)
            })
        }
        sumPopupMainSwiper.slideTo(targetIdx)
        sumPopupThumbActive(targetIdx)

        function sumPopupThumbActive(index) {
            let leftTarget;
            if ($(window).width() > 767) {
                leftTarget = `translateX(calc(${index * 10}rem + ${index * 1}rem))`
            } else {
                leftTarget = `translateX(calc(${index * 8}rem + ${index * 1}rem))`
            }
            gsap.set('.swiper.gal-popup-thumb-cms', {'--left-target': leftTarget})
            $(sumPopupThumbSwiper.el).find('.swiper-slide').removeClass('swiper-slide-thumb-active')
            $(sumPopupThumbSwiper.el).find('.swiper-slide').eq(index).addClass('swiper-slide-thumb-active')
        }
        //Open
        $('.gal-popup').addClass('active')
    }
    function updateProjSumPopup(data) {
        $(data.next.container).find('.projdtl-sum-wrap').each((idx, el) => {
            let allThumb = $(el).find('.proj-sum-gal-item-link');
            allThumb.each((idx, el) => {
                $(el).attr('data-sum-gal', idx)
            })
        })

        $(data.next.container).find('[data-sum-gal]').on('click', function(e) {
            e.preventDefault();
            let targetIdx = $(this).attr('data-sum-gal');
            let targetProj = $(this).closest('.projdtl-sum-inner').find('.projdtl-sum-label-txt').text();
            let targetImgArr = $(this).closest('.proj-sum-gal-list').find('.proj-sum-gal-item-link').find('img');
            projSumPopupOpen(targetIdx, targetProj, targetImgArr)
        })
    }
    //End Global functions

    //Transitions
    let allowAnim = false;
    let comingToHome = false;
    class transitionGrid {
        constructor() {
            let svgns = "http://www.w3.org/2000/svg";
            let container = document.getElementById('Trans');
            $(container).attr('viewBox', `0 0 ${$(window).width()} ${$(window).height()}`)

            if ($(window).width > 991) {
                this.twiceRad = 80;
            } else if ($(window).width() > 767) {
                this.twiceRad = 60;
            } else if ($(window).width() > 476) {
                this.twiceRad = 40;
            } else {
                this.twiceRad = 30;
            }
            this.xAmount = Math.ceil($(window).width()/this.twiceRad) + 1;
            this.yAmount = Math.ceil($(window).height()/this.twiceRad) + 1;
            for (let x = 0; x < this.xAmount; x++) {
                for (let y = 0; y < this.yAmount; y++) {
                    let circle = document.createElementNS(svgns, 'circle');
                    circle.setAttributeNS(null, 'cx', x * this.twiceRad);
                    circle.setAttributeNS(null, 'cy', y * this.twiceRad);
                    circle.setAttributeNS(null, 'style', 'fill: #1d1d1d' );
                    container.appendChild(circle);
                }
            }
            this.dots = container.querySelectorAll('circle')
        }
        getDots() {
            return this.dots
        }
        getRadius() {
            return this.twiceRad
        }
        getAmount() {
            return {x: this.xAmount, y: this.yAmount}
        }
    }
    function loaderDefault(data, animationSettings) {
        console.log('loader default')
        let counter3 = $('.loader-counter-3');
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 10; j++) {
                const div = $(document.createElement('div'))
                div.addClass('heading h-200 loader-num');
                div.text(j);
                div.appendTo(counter3)
            }
        }
        const finalDiv = $(document.createElement('div'))
        finalDiv.addClass('heading h-200 loader-num');
        finalDiv.text('0');
        finalDiv.appendTo(counter3)
        $('.loader-num').addClass('active')

        function animCounter(counter, duration, delay = 0) {
            const numHeight = $(counter).outerHeight();
            const totalDistance = ($(counter).find('.loader-num').length - 1) * numHeight;
            gsap.to(counter, {
                y: -totalDistance,
                duration: duration,
                delay: delay,
                ease: 'power2.inOut',
            })
        }
        let videoRefEl;
        let allClientCard;
        let startElement = $('.loader-imgs-wrap')
        let targetElement = $('.home-hero-client-item-inner').eq(1);
        if ($(window).width() < 767) {
            targetElement = $('.home-hero-client-item-inner').eq(0)
        }
        if ($('.home-hero-thumb').length > 0) {
            videoRefEl = $('.home-hero-thumb')
        } else {
            $('.home-hero-client-inner').css('pointer-events', 'none')
            allClientCard = $('.home-hero-client-item-inner')
            videoRefEl = $('.home-hero-client-item-inner').eq(allClientCard.length - 1)
            let lastImages;
            allClientCard.each((idx, card) => {
                if ($(window).width() >= 767) {
                    // Pre-arrage cards positions
                    lastImages = targetElement.find('img').attr('src')
                    if (idx == 1) {
                        gsap.set(card.closest('.home-hero-client-item'), {zIndex: 10})
                    }
                    let startPosition = targetElement.get(0).getBoundingClientRect().left - card.getBoundingClientRect().left
                    gsap.set(card, {x: startPosition })
                } else {
                    lastImages = $('.home-hero-client-item-inner').eq(allClientCard.length - 1).find('img').attr('src')
                    if (idx == allClientCard.length - 1) {
                        gsap.set(card.closest('.home-hero-client-item'), {zIndex: 10})
                    }
                    let startPosition = targetElement.get(0).getBoundingClientRect().left - card.getBoundingClientRect().left
                    gsap.set(card, {x: startPosition })
                }
            })
            $('.loader-img-inner').eq($('.loader-img-inner').length - 1).find('img').attr('src', lastImages).attr('srcset', lastImages)
        }

        gsap.set('.loader-imgs-wrap', {width: videoRefEl.get(0).getBoundingClientRect().width, height: videoRefEl.get(0).getBoundingClientRect().height})
        let count = {val: 0};

        let tl = gsap.timeline({
            onStart: () => {
                resetScroll(data)
                gsap.set('.header', {autoAlpha: 0})
            },
            delay: .8
        })

        animCounter('.loader-counter-3', 3.3)
        animCounter('.loader-counter-2', 3.2)
        animCounter('.loader-counter-1', 2, 1)

        tl
        .to('.loader-cover-bg', {scaleY: 0, duration: 2})
        .to(count, {val: 100, roundProps: "val", duration: 2, onUpdate: () => {
            $('.loader-prog-txt').text(count.val < 10 ? `00${count.val}` : count.val < 100 ? `0${count.val}` : `${count.val}`)
        }}, '0')
        .fromTo('.loader-img-inner', {
            scale: 0,
            opacity: 0
        }, {
            duration: .4,
            scale: 1,
            opacity: 1,
            stagger: 1.4 / $('.loader-img-inner').length,
            ease: 'power4',
            onComplete: () => {
                gsap.to('.loader-counter', {autoAlpha: 0, duration: .4, delay: .6})
                let scaleFactor, distanceX, distanceY;
                if ($(window).width() > 991) {
                    scaleFactor = $(window).height() / $('.loader-img-inner').height();
                } else if ($(window).width() > 767) {
                    scaleFactor = ($(window).width() / $('.loader-img-inner').width()) * 1.5;
                } else {
                    scaleFactor = ($(window).width() / $('.loader-img-inner').width()) * 2;
                }

                distanceX = targetElement.get(0).getBoundingClientRect().left - startElement.get(0).getBoundingClientRect().left
                distanceY = targetElement.get(0).getBoundingClientRect().top - startElement.get(0).getBoundingClientRect().top
                $('.loader-img-inner').each((idx, el) => {
                    let childTl = gsap.timeline({
                        onComplete: () => {
                            $('.main-grid').addClass('loaded')
                            // 2: landed, so homeHero() builds its timeline now (paused) and the handoff below plays it
                            if (!allowAnim) allowAnim = 2;
                            gsap.to('.header', {autoAlpha: 1, duration: .8, onComplete: () => {
                                lenis.start()

                                // $('.home-hero-vid-thumbnail').find('video').get(0).play()
                                $('.home-hero-thumb-mobile-dot').addClass('active')
                                if ($('.loader-24').length) {
                                    $('.loader-24').remove()
                                }
                                $('.loader').remove()
                            }})
                        },
                    })
                    childTl
                    .to($(el), {scale: scaleFactor * .5, duration: animationSettings.duration/2, ease: 'power4.in',
                        x: distanceX * .5,
                        y: distanceY * .5
                    }, animationSettings.itemDelay * idx)
                    .to($(el), {scale: 1, duration: animationSettings.duration/2 , ease: 'power4',
                        x: distanceX,
                        y: distanceY
                    }, '>=0')
                    // Hand over to the real cards while the last image is still gliding in (under 1px to go),
                    // so the cards carry the motion on instead of starting after a pause
                    if (idx == $('.loader-img-inner').length - 1) {
                        childTl.call(() => {
                            $('.loader').remove()
                            allowAnim = 3;
                            gsap.getById('kpHero') && gsap.getById('kpHero').play()
                        }, null, '>-.2')
                    }
                })
            }
        }, '0');
    }
    function loader24ControlVideo () {
        $('.loader24-video [data-video]').on('click', function(e) {
            e.preventDefault();
            idleTime = 0;
            if ($(this).attr('data-video') == 'to-play') {
                $(this).attr('data-video', 'to-pause')
                $('.loader24-video-main-intro').addClass('hidden')
                $('.loader24-video-main-full').removeClass('hidden')
                $('.loader24-video-main-intro').find('video').get(0).pause()
                $('.loader24-video-main-full').find('video').get(0).play()

                $('.loader24-info').removeClass('active')
                $('.loader24-video-main').addClass('on-play')
                $('.loader24-inner').addClass('on-play')
                $('.loader24-intro-skip').removeClass('active')
                if (!$('.loader24-skip').hasClass('active')) {
                    $('.loader24-skip').addClass('active')
                }
            } else {
                $(this).attr('data-video', 'to-play')
                $('.loader24-video-main-full').find('video').get(0).pause()
                $('.loader24-info').addClass('active')
                $('.loader24-video-main').removeClass('on-play')
                $('.loader24-inner').removeClass('on-play')
                $('.loader24-intro-skip').removeClass('active')
            }
        })
        let video = $('.loader24-video-main-full').find('video').get(0);
        function updateVideo() {
            let progress = (video.currentTime / video.duration) * 360;
            gsap.set('.cursor-vid-prog', {'--vid-prog': `${progress}deg`});
            requestAnimationFrame(updateVideo);
        }
        requestAnimationFrame(updateVideo);
        // $('.loader24-video-main-full').find('video').on('timeupdate', function() {
        //     let progress = Math.ceil((this.currentTime / this.duration) * 360);
        //     console.log(progress)
        //     gsap.to('.cursor-vid-prog', {'--vid-prog': `${progress}deg`, duration: 0.1, ease: 'none'});
        // });
    }
    function loader24Enter(data, animationSettings) {
        // $('.loader24').remove()
        console.log('click')
        $('.loader24').addClass('done')
        $('.loader24-enter').removeClass('active')
        $('.loader24-cover-bg').addClass('done')
        $('.loader24-video-main').removeClass('on-play')
        $('.loader24-inner').removeClass('on-play')
        $('.loader24-info').removeClass('active')
        $('.loader24-skip').removeClass('active')
        $('.loader24-intro-skip').removeClass('active')
        $('.loader24-video-main-intro').addClass('hidden')
        $('.loader24-video-main-full').addClass('hidden')
        $('.loader24-video-main-full').find('video').get(0).pause()
        $('.loader24-video-main-thumb').removeClass('hidden');
        let tl = gsap.timeline({
        })
        tl.to($('.loader24-video-main'), {duration: animationSettings.duration * .66, ease: 'power2.inOut',
            width: $('.home-hero-thumb').get(0).getBoundingClientRect().width,
            height: $('.home-hero-thumb').get(0).getBoundingClientRect().height,
            y: window.innerWidth < 768 ? $('.home-hero-thumb').get(0).getBoundingClientRect().top - parseRem(10): 0,
        })
        setTimeout(() => {
            $('.main-grid').addClass('loaded')
                allowAnim = true;
                gsap.to('.header', {autoAlpha: 1, duration: .8, onComplete: () => {
                    lenis.start()
                    $('.loader24').remove()
                    $('.home-hero-vid-thumbnail').find('video').get(0).play()
                    $('.home-hero-thumb-mobile-dot').addClass('active')
                }})
        }, animationSettings.duration * 1000 * .5);
    }
    function loader24Replay(data, animationSettings) {
        $('.loader24-enter').removeClass('active')
        requestAnimationFrame(() => {
            $('.loader24-skip').addClass('active')
            $('.loader24-intro-skip').removeClass('active')
            $('.loader24-video-main').addClass('on-play')
            $('.loader24-inner').addClass('on-play')
            $('.loader24-video-main-full').removeClass('hidden')
            $('.loader24-video-main-full').find('video').get(0).play()
        })
        setTimeout(() => {
            $('.loader24-video').removeClass('disable')
        }, 200);

    }
    function loader24Ended(data, animationSettings) {
        $('.loader24-video').addClass('disable')
        $('.loader24-enter').addClass('active')
        $('.loader24-skip').removeClass('active')
        $('.loader24-video-main').removeClass('on-play')
        $('.loader24-inner').removeClass('on-play')
        $('.loader24-video-main-intro').addClass('hidden')
        $('.loader24-video-main-full').addClass('hidden')
        $('.loader24-video-main-intro').find('video').get(0).pause()
        $('.loader24-video-main-full').find('video').get(0).pause()
    }
    function loader24(data, animationSettings) {
        resetScroll(data)
        lenis.stop()
        gsap.set('.header', {autoAlpha: 0})
        console.log('new loader')
        $('.loader').remove()
        //setup
        loader24ControlVideo()
        $('.cursor-wrap').addClass('on-loader24')

        $('.loader24-info').addClass('active')
        $('.loader24-intro-skip').addClass('active')
        //anim

        //interact
        $('.loader24-video-main-full').find('video').on('ended', function() {
            loader24Ended(data, animationSettings)
        });
        $('[data-loader24="skip"]').on('click', function(e) {
            e.preventDefault();
            loader24Enter(data, animationSettings)
        })
        $('[data-loader24="rep"]').on('click', function(e) {
            e.preventDefault();
            loader24Replay()
        })
        //entersite

    }
    class Reel {
        constructor(el) {
            this.el = el
            this.video = this.el.find('video').get(0)
            this.videoToggle = this.el.find('[data-video]')
            this.videoToggle.on('click', this.toggleReel.bind(this))
            this.el.find('.popup-reel-close-btn, .popup-reel-close-btn-mb').on('click', this.closeReel.bind(this))
        }
        resetReel() {
            this.closeReel()
            this.video.currentTime = 0
        }
        toggleReel(e) {
            e.preventDefault();
            if (this.videoToggle.attr('data-video') == 'to-play') {
                this.playReel()
            } else {
                this.pauseReel()
            }
        }
        playReel() {
            if ($(window).width() < 768) {
                this.el.find('.popup-reel-mb-info').removeClass('active')
            }
            $(this.videoToggle).attr('data-video', 'to-pause')
            this.el.find('.popup-reel-inner').addClass('on-play')
            this.el.find('.popup-reel-video-main').addClass('on-play')
            this.video.play()
            this.el.find('.cursor-vid-prog').addClass('active')
            requestAnimationFrame(this.updateReel.bind(this))
            this.status = 'to-pause'
        }
        pauseReel() {
            if ($(window).width() < 768) {
                this.el.find('.popup-reel-mb-info').addClass('active')
            }
            $(this.videoToggle).attr('data-video', 'to-play')
            this.el.find('.popup-reel-inner').removeClass('on-play')
            this.el.find('.popup-reel-video-main').removeClass('on-play')
            this.el.find('.popup-reel-video-main').find('video').get(0).pause()
            gsap.set('.cursor-vid-prog', {'--vid-prog': '0deg', clearProps: 'all'})
            cancelAnimationFrame(this.updateReel.bind(this))
            this.status = 'to-play'
        }
        openReel() {
            this.el.addClass('active')
            this.el.find('.popup-reel-close-inner').addClass('active')
            // video.currentTime = 0
            this.playReel()
        }
        closeReel() {
            this.el.removeClass('active')
            this.el.find('.popup-reel-close-inner').removeClass('active')
            this.pauseReel()
        }
        updateReel() {
            let progress = (this.video.currentTime / this.video.duration) * 360;
            gsap.set('.cursor-vid-prog', {'--vid-prog': `${progress}deg`});
            requestAnimationFrame(this.updateReel.bind(this));
        }
    }
    //Reel
    let reel = null;
    if ($('.popup-reel').length) {
        reel = new Reel($('.popup-reel'))
    }

    if ($('.loader24-idle').length) {
        $('.loader24-idle').addClass('done')
    }
    let transGrid;
    function transitionOnce(data) {
        // Active Client news popup
        $('.client-news-popup-wrap').removeClass('loading')

        const animationSettings = {
            duration: 1.6,
            itemDelay: 0.08
        };
        $('.trans').addClass('loaded')
        $('.loader-idle').addClass('done')
        if (data.next.namespace == 'home') {
            console.log("run")
            if (window.location.search == '?contact') {
                $('.main-grid').addClass('loaded')
                allowAnim = true;
                gsap.to('.header', {autoAlpha: 1, duration: .8, onComplete: () => {
                    lenis.start()
                    $('.home-hero-vid-thumbnail').find('video').get(0).play()
                    $('.home-hero-thumb-mobile-dot').addClass('active')
                    if ($('.loader-24').length) {
                        $('.loader-24').remove()
                    }
                    $('.loader').remove()
                    if (handleNav.isOpen()) {
                        handleNav.close()
                    }
                    if ($('.projdtl-sum-wrap').length && $('.projdtl-sum-wrap').hasClass('active')) {
                        $('.projdtl-sum-wrap').removeClass('active')
                        $('.projdtl-intro-toggle').removeClass('active')
                        $('.cursor-inner').removeClass('on-hover-md')
                        $('.cursor-ic.cursor-expand.to-close').removeClass('active')
                    }
                    handleContactForm.open()
                    headerOnOpen()
                    lenis.stop();
                }})
            } else if (window.location.hash == '#services') {
                $('.main-grid').addClass('loaded')
                allowAnim = true;
                gsap.to('.header', {autoAlpha: 1, duration: .8, onComplete: () => {
                    lenis.start()
                    $('.home-hero-vid-thumbnail').find('video').get(0).play()
                    $('.home-hero-thumb-mobile-dot').addClass('active')
                    if ($('.loader-24').length) {
                        $('.loader-24').remove()
                    }
                    $('.loader').remove()
                    resetScroll(data)
                }})
            } else if (window.location.search.includes('?news')) {
                $('.main-grid').addClass('loaded')
                allowAnim = true;
                gsap.to('.header', {autoAlpha: 1, duration: .8, onComplete: () => {
                    lenis.start()
                    if ($('.loader-24').length) {
                        $('.loader-24').remove()
                    }
                    $('.loader').remove()
                    // Convert the URLSearchParams of window.location.search to a plain object
                    let paramsObj = {};
                    let searchParams = new URLSearchParams(window.location.search);
                    for (let [key, value] of searchParams.entries()) {
                        paramsObj[key] = value;
                    }
                    console.log(paramsObj)
                    let newsId = paramsObj.news
                    if (newsId) {
                        let newsEl = $(`[data-news-id="${newsId}"]`)
                        if (newsEl.length > 0) {
                            newsEl.trigger('click')
                        }
                    } else {
                        // history.replaceState({},'', window.location.pathname)
                    }
                }})
            } else {
                if ($('.loader24').length) {
                    loader24(data, animationSettings)
                } else {
                    loaderDefault(data, animationSettings)
                }
            }
        } else if (data.next.namespace == 'contact') {

        } else {
            if ($('.trans').length >= 1) {
                if (!transGrid) {
                    transGrid = new transitionGrid()
                }
                $('.trans-title').text($(data.next.container).attr('data-barba-title'))
                let title = new SplitText('.trans-title', {...typeOpts.chars, charsClass: 'g-chars'})
                gsap.set(title.chars, {yPercent: 60, autoAlpha: 0})
                gsap.set('.trans-title-wrap', {autoAlpha: 1})
                gsap.set(transGrid.getDots(), {'--radius': `${transGrid.getRadius() * .75}px`, opacity: 1})
                let tl = gsap.timeline({
                    delay: 0,
                    onStart: () => {
                        resetScroll(data)
                        $('.main-grid').addClass('loaded')
                    },
                    onComplete: () => {
                    }
                })
                tl
                .to(title.chars, {yPercent: 0, autoAlpha: 1, duration: .4, stagger: 0.04, ease: gOpts.ease}, 0)
                .to(title.chars, {delay: 1, autoAlpha: 0, yPercent: -60, duration: .4, stagger: 0.04, ease: gOpts.ease},'>=-.4')
                .to(transGrid.getDots(), {'--radius': '0px', duration: .8, stagger:{from: 'center',  grid: [transGrid.getAmount().x, transGrid.getAmount().y], each: 0.02}, ease: 'expo.out'}, '<=.4')
                return tl
            } else {
                $('.main-grid').addClass('loaded')
            }
        }
    }
    function transitionLeave(data) {
        if (!transGrid) {
            transGrid = new transitionGrid()
        }
        lenis.stop()
        if (data.next.namespace == 'home') {
            allowAnim = true;
            comingToHome = true;
        }
        if (isProjectToProject(data.current.namespace, data.next.namespace)) {
            let offsetVal;
            if ($(window).width() > 767) {
                offsetVal = parseRem(20)
            } else {
                offsetVal = parseRem(48)
            }
            //let newColor = $(data.next.container).find('.projdtl-hero-title.mod-top').css('color')
            let distance = $(data.current.container).find('.projdtl-hero.mod-bottom').get(0).getBoundingClientRect().top - offsetVal;

            gsap.set(data.next.container, {display: 'none'})
            let tl = gsap.timeline({
                delay: .2,
                onStart: () => {
                    gsap.to('.header-projdtl', {autoAlpha: 0, duration: .6});
                    $(data.current.container).find('.projdtl-hero-title-label').addClass('hidden')
                },
                onComplete: () => {
                    gsap.to('.header-projdtl', {autoAlpha: 1, duration: .4, clearProps: 'all'})
                    gsap.set(data.next.container, { clearProps: 'display' })
                }
            })
            tl
            .to($(data.current.container).find('.projdtl-hero.mod-bottom'), {y: -distance, duration: 1, ease: 'power2.inOut'})
            .to($(data.current.container).find('.projdtl-cta'), {y: -distance, duration: 1, autoAlpha: 0, ease: 'power2.inOut'}, 0)
            .to($(data.current.container).find('.projdtl-testi'), {y: -distance, duration: 1, autoAlpha: 0, ease: 'power2.inOut'}, 0)
            .to($(data.current.container).find('.projdtl-sum-stick-inner'), {autoAlpha: 0, duration: .4, ease: 'none'}, 0)
            // The FAQ sits below the next-project hero, so it moves and fades with it like the CTA and testimonial
            if ($(data.current.container).find('.ser-faq').length) {
                tl.to($(data.current.container).find('.ser-faq'), {y: -distance, duration: 1, autoAlpha: 0, ease: 'power2.inOut'}, 0)
            }
            return tl
        } else {
            gsap.set(data.next.container, {display: 'none'})
            $('.trans-title').text($(data.next.container).attr('data-barba-title'))
            let title = new SplitText('.trans-title', {...typeOpts.chars, charsClass: 'g-chars'})
            gsap.set(title.chars, {yPercent: 60, autoAlpha: 0})
            gsap.set('.trans-title-wrap', {autoAlpha: 1})
            let tl = gsap.timeline({
                delay: .2,
                onComplete: () => {
                    gsap.set(data.next.container, { clearProps: 'display' })
                }
            })
            tl
            .to(transGrid.getDots(), {'--radius': `${transGrid.getRadius() * .75}px`, duration: .8, opacity: 1, stagger:{from: 'center', grid: [transGrid.getAmount().x, transGrid.getAmount().y], each: -0.02}, ease: 'expo.in' })
            .to(title.chars, {yPercent: 0, autoAlpha: 1, duration: .4, stagger: 0.04, ease: gOpts.ease}, '>=-.4')
            return tl
        }
    }
    function transitionEnter(data) {
        resetScroll(data)
        lenis.stop()

        if (isProjectToProject(data.current.namespace, data.next.namespace)) {
            lenis.start()
        } else {
            gsap.set(data.current.container, {opacity: 0, display: 'none'})
            let tl = gsap.timeline({
                delay: .6,
                onComplete: () => {
                    lenis.start()
                }
            })
            tl
            .to('.trans-title .g-chars', {autoAlpha: 0, yPercent: -60, duration: .4, stagger: 0.04, ease: gOpts.ease})
            .to(transGrid.getDots(), {'--radius': '0px', duration: .8, stagger:{from: 'center',  grid: [transGrid.getAmount().x, transGrid.getAmount().y], each: 0.02}, ease: 'expo.out'}, '<=.4')
            return tl
        }
    }
    function addNavActiveLink(data) {
        $('[data-link]').removeClass('active');
        $(`[data-link="${data.next.namespace}"]`).addClass('active');
    }
    function removeAllScrollTrigger() {
        let triggers = ScrollTrigger.getAll();
        triggers.forEach(trigger => {
            trigger.kill();
        });
    }
    function resetBeforeLeave(data) {
        headerOnClose()
        handleNav.close()
        handleContactForm.close()
        $('.gal-popup').removeClass('active')
        lenis.start()
        addNavActiveLink(data)
        addStickyFooter(data)
        documentHeightObserver('disconnect')
        const yearDates = $(data.next.container).find('[data-year]')
        yearDates.each((idx, el) => {
            $(el).text(dayjs(Date.now()).format('YYYY'))
        })
        if (reel) {
            // Pause Reel
            reel.resetReel()
        }
    }
    function addStickyFooter(data) {
        if (data.next.namespace == 'home') {
            if ($(window).width() > 991) {
                //$('.footer').addClass('on-sticky')
            }
        }
    }
    function scrollToTop() {
        lenis.scrollTo(0, {
            force: true,
            immediate:  true
        })
        requestAnimationFrame(() => {
            window.scrollTo({
                top: 0,
                left: 0,
                behavior: "instant",
            });
        })
    }
    function scrollToHash(hash) {
        lenis.scrollTo(hash, {
            force: true,
            immediate: true,
        })
        requestAnimationFrame(() => {
            window.scrollTo({
                top: $(hash).offset().top - parseRem(200),
                left: 0,
                behavior: "instant",
            });
        })
    }
    function resetScroll(data) {
        console.log('reset SCROLL ' + data.next.namespace)
        if (data.next.namespace == 'home') {
            lenis.stop();
            if (window.location.hash == '#services') {
                console.log('to-services')
                scrollToHash('#ScServices')
                lenis.start()
            } else {
                scrollToTop();
            }
        } else if (data.next.namespace == 'projDtl') {
            let locationHash = window.location.hash
            console.log(locationHash)
            lenis.stop();
            if ($(locationHash).length && $(data.next.container).find('[data-proj-section]').length >= 2) {
                setTimeout(() => {
                    scrollToHash(locationHash)
                }, 300);
            } else {
                scrollToTop()
            }
            lenis.start()
        } else {
            let locationHash = window.location.hash;
            lenis.stop();
            if ($(locationHash).length) {
                scrollToHash(locationHash)
            } else {
                scrollToTop()
            }
            lenis.start()
        }
    }
    function handleScrollTo() {
        $('[data-scrollto]').on('click', function(e) {
            let target = $(this).attr('href')
            lenis.scrollTo(target)
        })
    }
    function initTitleGrid(el, rgb = { x: '46', y: '46', z: '46' }) {
        let canvas = el.get(0),
            ctx = canvas.getContext('2d'),
            points = [],
            mouse = {
                x: pointerCurr().x - canvas.getBoundingClientRect().left,
                y: pointerCurr().y - canvas.getBoundingClientRect().top
            },
            size = parseRem(2),
            h = parseRem(20),
            w = parseRem(20),
            opacity = .56,
            color = `rgba(${rgb.x}, ${rgb.y}, ${rgb.z}, ${opacity}`;
        window.addEventListener('resize', function() {
            canvas.width = Math.ceil($(el).parent().outerWidth());
            canvas.height = Math.ceil($(el).parent().outerHeight());
            setup()
        })

        window.dispatchEvent(new Event('resize'))

        function setup() {
            points = []
            let cw = canvas.width
            let ch = canvas.height

            let rw = Math.ceil(cw / w) + 1
            let rh = Math.ceil(ch / h) + 1
            for (let y = 0; y <= rh; y++) {
                for (let x = 0; x <= rw; x++) {
                    let pad = parseRem(1)
                    let point = {
                        x: ((cw - size) / (rw + pad)) * x + (cw / rw) * (pad / 2),
                        y: ((ch - size) / (rh + pad)) * y + (ch / rh) * (pad / 2),
                        size: size,
                        fillStyle: color,
                    }
                    points.push(point)
                }
            }
        }

        function render() {
            let oldPos = mouse;
            mouse = {
                x: lerp(oldPos.x, pointerCurr().x - canvas.getBoundingClientRect().left, 0.06),
                y: lerp(oldPos.y, pointerCurr().y - canvas.getBoundingClientRect().top, 0.06)
            }
            if (isInViewport(el.get(0))) {
                ctx.clearRect(0, 0, canvas.width, canvas.height)
                for (let i = 0; i < points.length; i++) {
                    let point = points[i]

                    let scale = getDistance(point, mouse) / 24

                    scale = 4.8 - scale
                    scale /= 4.8
                    let newScale = point.size * scale * 4.8
                    if ( newScale < 1) newScale = 1

                    let newOpacity = (newScale + 1) / 8
                    if (newOpacity < .56) newOpacity = .56

                    ctx.beginPath()
                    ctx.arc(point.x, point.y, newScale, 0, 2*Math.PI, false)
                    ctx.fillStyle = `rgba(${rgb.x}, ${rgb.y}, ${rgb.z}, ${newOpacity}`;
                    ctx.fill()
                }
            } else {
                ctx.clearRect(0, 0, canvas.width, canvas.height)
            }
        }

        function animloop() {
            render()
            requestAnimationFrame(animloop)
        }
        requestAnimationFrame(animloop)
    }
    function updateImgGrid(data, richtextEl, desEl = null) {
        desEl = desEl;
        let wrapEl;
        if (data == document) {
            wrapEl = $(document)
        } else {
            wrapEl = $(data.next.container)
        }
        let gridWrap = wrapEl.find(richtextEl);
        if (gridWrap.length >= 1) {
            gridWrap.each((idx, el) => {
                let imgWraps = $(el).find('figure');
                if (imgWraps.length >= 1) {
                    imgWraps.each((idx, el) => {
                        let altText = $(el).find('img').attr('alt')
                        if (altText != '') {
                            let cols = altText.split('}')[0].replace('{', '')
                            if ($(window).width() > 991) {
                                $(el).css('grid-column', `span ${cols}`)
                            } else {
                                $(el).css('grid-column', `1 / -1`)
                            }
                            $(el).css('max-width', `100%`)
                        } else {
                            $(el).css('grid-column', `1 / -1`)
                            $(el).css('max-width', `100%`)
                        }
                        if (desEl) {
                            if ($(el).find('figcaption').length) {
                                let captionEl = desEl.clone();
                                captionEl.find('.txt.txt-16').text($(el).find('figcaption').text())
                                captionEl.appendTo($(el))
                                $(el).find('figcaption').remove()
                            }
                        }
                    })
                }
                let videoWraps = $(el).find('.w-embed')
                if (videoWraps.length >= 1) {
                    videoWraps.each((idx, el) => {
                        let cols = $(el).find('video').attr('data-grid-span');
                        if (cols) {
                            if ($(window).width() > 991) {
                                $(el).css('grid-column', `span ${cols}`)
                            } else {
                                $(el).css('grid-column', `1 / -1`)
                            }
                        } else {
                            $(el).css('grid-column', `1 / -1`)
                        }
                        if (desEl) {
                            if ($(el).find('video').attr('data-des') != '') {
                                let captionEl = desEl.clone();
                                captionEl.find('.txt.txt-16').text($(el).find('video').attr('data-des'))
                                captionEl.appendTo($(el))
                            }
                        }
                    })
                }
            })
        }
        if (data !== document) {
            setTimeout(() => {
                resetScroll(data)
            }, 300);
        }
    }

    const SCRIPT = {};
    SCRIPT.homeScript = {
        namespace: 'home',
        afterEnter(data) {
            function homeHero() {
                const homeHeroTitle = new SplitText('.home-hero-title', typeOpts.words)
                const homeHeroSub = new SplitText('.home-hero-sub', typeOpts.words)
                const homeHeroCap = new SplitText('.home-hero-cap', typeOpts.words)
                gsap.set(homeHeroTitle.words, {yPercent: 100})
                gsap.set(homeHeroSub.words, {yPercent: 100})

                gsap.set('.home-hero-client-item-label, .home-hero-client-item-title', {autoAlpha: 0})
                // Card glide: starts from rest and lands with the same quintic tail as the loader's power4.out
                const glide = q => 1 - Math.pow(1 - q, 5) * (1 + 5 * q)
                function checkToStart() {
                    if (allowAnim) {
                        let tl = gsap.timeline({
                            // After the loader (allowAnim 2 or 3) the loader handoff starts it, not ScrollTrigger (which ran ~250ms late)
                            id: 'kpHero',
                            paused: allowAnim === 2,
                            scrollTrigger: allowAnim > 1 ? undefined : {
                                trigger: '.home-hero',
                                start: 'top top+=50%',
                            },
                            defaults: {
                                ease: gOpts.ease
                            },
                            onStart: () => {
                                if (comingToHome) {
                                    $('.home-hero-vid-thumbnail').find('video').get(0).play()
                                    $('.home-hero-thumb-mobile-dot').addClass('active')
                                }
                            },
                            onComplete: () => {
                                if (comingToHome) {
                                    comingToHome = false;
                                }
                                homeHeroTitle.revert()
                                new SplitText('.home-hero-title', typeOpts.lines)
                                homeHeroSub.revert()
                                homeHeroCap.revert()
                            },
                            delay: comingToHome ? delayTime : $('.home-hero-thumb').length > 0 || allowAnim > 1 ? 0 : .8
                        })

                        if ($(window).width() > 767) {
                            tl.set('.home-hero-client-item-logo', {autoAlpha: 0})
                        }
                        tl
                        .set('.home-hero-title, .home-hero-sub', {opacity: 1})
                        .to(homeHeroTitle.words, {yPercent: 0, duration: .6, stagger: .03})
                        .fromTo('.home-hero-title .txt-disable', {'--line-scaleX': 0 }, {'--line-scaleX': 1, duration: 1 }, "<=.3")

                        .to('.home-hero-client-item-inner', {'transition-property': 'none', clearProps: 'transition-property', x: 0, duration: 1.3, ease: glide}, 0)
                        .to('.home-hero-client-item-label', {autoAlpha: 1, duration: .6, stagger: .03}, '<=0.2')
                        .to('.home-hero-client-item-title', {autoAlpha: 1, duration: .6, stagger: .03, onComplete: () => {
                            gsap.set('.home-hero-client-inner', {clearProps: 'all'})
                        }}, '<=0.2')

                        .to(homeHeroSub.words, {yPercent: 0, duration: .6, stagger: .03}, '<=.2')
                        .from('.home-hero-sub-wrap svg path', {autoAlpha: 0, drawSVG: '50% 50%', duration: .6, stagger: .1}, '<=0')
                        .from('.home-hero-sub .hover-un', {'--line-width': '0%', duration: 1 }, "<=.5")

                        if ($(window).width() > 767) {
                            // Expand Clien News card
                            tl
                            .to('.home-hero-client-item', { width: 100/3+'%', ease: glide, duration: 1.3}, 0)
                            .to('.home-hero-client-cms', {y: 0, height: $('.home-hero-client-cms-wrap').get(0).getBoundingClientRect().height, ease: glide, duration: 1.3}, 0)
                            .fromTo('.home-hero-client-item-logo', { autoAlpha: 0 }, { autoAlpha: 1, duration: .6, ease: 'none' }, .4)
                        }
                        if (!comingToHome) {
                            tl
                            .from($('.header').find('.header-top-line'), {scaleX: 0, transformOrigin: 'left', duration: 1.1, clearProps: 'all'}, '0')
                            .from($('.header').find('.header-side-line'), {scaleY: 0, transformOrigin: 'top', duration: 1.1, clearProps: 'all'}, '<=0')
                            .from($('.header-toggle'), {autoAlpha: 0 ,scale: 0, duration: .8, clearProps: 'all'}, '<=0')
                            .from($('.header-share-ic'), {autoAlpha: 0, duration: .8, scale: 0, clearProps: 'all'}, '<=0')
                            .from($('.header-logo-ic path'), {autoAlpha: 0, yPercent: 60, duration: .3, stagger: 0.03, clearProps: 'all'}, '<=0')
                            .from($('.header-logo-status'), {autoAlpha: 0, x: -parseRem(12), duration: .6, clearProps: 'all'}, '<=.4')
                            .from($('.header-reg'), {autoAlpha: 0, duration: .8, clearProps: 'all'}, '0')
                            .from($('.header-btn-ctc'), {autoAlpha: 0, duration: .8, clearProps: 'all'}, '0')
                        }

                        tl
                        .from('.bg-dots.home-vid-dots', {autoAlpha: 0, duration: .6}, "<=0")
                        //.from('.home-hero-thumb img', {scale: 1.2, duration: .6, clearProps: 'all'}, "<=0")
                    } else {
                        requestAnimationFrame(checkToStart)
                    }
                }
                requestAnimationFrame(checkToStart)
            }
            homeHero()

            function homeHeroVid() {
                if($(window).width() >= 768) {
                    gsap.set('.home-hero-thumb', {borderRadius: '4.16rem'})
                    let tl = gsap.timeline({
                        scrollTrigger: {
                            trigger: '.home-hero',
                            start: `top top`,
                            endTrigger: '.home-hero',
                            end: 'bottom bottom',
                            scrub: true
                        }
                    })
                    tl
                    .to('.home-hero-thumb', {scale: 1, borderRadius: '2rem', duration: 10, ease: 'none'})
                }
                $('.home-hero-vid-wrap [data-video]').on('click', function(e) {
                    e.preventDefault();
                    if ($(this).attr('data-video') == 'to-play') {
                        $(this).attr('data-video', 'to-pause')
                        let scrollTarget = $('.home-hero').outerHeight() - $(window).height();
                        lenis.scrollTo(scrollTarget)

                        $('.home-hero-vid-thumbnail').addClass('hidden')
                        $('.home-hero-vid-video').removeClass('hidden')
                        $('.home-hero-vid-thumbnail').find('video').get(0).pause()
                        $('.home-hero-vid-video').find('video').get(0).play()
                    } else {
                        $(this).attr('data-video', 'to-play')
                        // $('.home-hero-vid-thumbnail').removeClass('hidden')
                        // $('.home-hero-vid-video').addClass('hidden')
                        //$('.home-hero-vid-thumbnail').find('video').get(0).play()
                        $('.home-hero-vid-video').find('video').get(0).pause()
                    }
                })
            }
            if ($('.home-hero-thumb').length > 0) {
                homeHeroVid()
            }

            function homeHeroClient() {
                console.log('hello')
                // Setup
                $('.home-hero-client-item-inner').each((itemIndex, el) => {
                    let elUrl = $(el).attr('href');
                    let hasDetail = elUrl != '#' && elUrl != '' || elUrl.includes('work')
                    if (!hasDetail) {
                        let newUrl = $(el).attr('data-url-ext')
                        if (newUrl == '#' || newUrl == '') {
                            $(el).attr('data-cursor', 'soon')
                            updateDeetsDetail(itemIndex)
                        } else {
                            $(el).attr('href', newUrl)
                            $(el).attr('target','_blank')
                            $(el).attr('data-cursor', 'ext')
                        }
                    }
                    let video = $(el).find('video').get(0)
                    if (!isVideoPlaying(video)) {
                        $(el).find('.home-hero-client-item-vid').remove()
                    }
                })
                function updateDeetsDetail(itemIndex) {;
                    console.log('trigger')
                    let tempHtml = $('.client-news-popup-item').eq(itemIndex).find('.client-news-info-item').clone()
                    let temp = tempHtml.clone()
                    $('.client-news-popup-item').eq(itemIndex).find('.client-news-info-item').remove()
                    let dataList = $('.client-news-popup-item').eq(itemIndex).find('.client-news-info-list-data li')
                    if (!dataList || dataList.length == 0) {
                        $('.client-news-info-list').eq(itemIndex).remove()
                    } else {
                        dataList.each((index, data) => {
                            let dataItem = temp.clone()
                            let names = data.innerHTML.split('-')
                            $(dataItem).find('.client-news-info-item-label').html(names[0].trim())
                            $(dataItem).find('.client-news-info-item-txt').html(names[1].trim())
                            $(dataItem).appendTo($('.client-news-popup-item').eq(itemIndex).find('.client-news-info-list'))
                        })
                    }
                    if ($('.client-news-popup-item').eq(itemIndex).find('.client-news-block-rictxt a').length >= 1) {
                        $('.client-news-popup-item').eq(itemIndex).find('.client-news-block-rictxt a').each((idx, element) => {
                            $(element).addClass('hover-un').attr('data-cursor', 'txtLink')
                        })
                    }
                }

                // Anim on Scroll
                if ($(window).width() >= 767) {
                    // let maxHeight;
                    // maxHeight = $('.home-hero-client-cms-wrap').get(0).getBoundingClientRect().height
                    // let tl = gsap.timeline({
                    //     scrollTrigger: {
                    //         trigger: '.home-hero',
                    //         start: `top top`,
                    //         endTrigger: '.home-hero',
                    //         end: 'bottom bottom',
                    //         scrub: true
                    //     }
                    // })
                    // tl
                    // .to('.home-hero-client-item', { width: 100/3+'%', ease: 'none', duration: 1})
                    // .to('.home-hero-client-cms', {y: 0, height: maxHeight, ease: 'none', duration: 1}, 0)
                    // .fromTo('.home-hero-client-item-content-inner', { scale: 1 }, { scale: 1.5, duration: 1, ease: 'none' }, 0)
                    // .fromTo('.home-hero-client-item-logo', { autoAlpha: 0 }, { autoAlpha: 1, duration: .6, ease: 'none' }, .4)
                }
                // Interaction
                $('.home-hero-client-item-inner').on('click', function(e) {
                    openModal(e, this)
                })
                $('.client-news-overlay').on('click', function(e) {
                    e.preventDefault();
                    closeModal()
                })
                $('.client-news-label-hide').on('click', function(e) {
                    e.preventDefault();
                    closeModal()
                })
                if ($(window).width() >= 767) {
                    // if (isTouchDevice()) {
                    //     // $('.home-hero-client-item').on('click', function(e) {
                    //     //     openModal(e, this);
                    //     // });
                    // } else {
                    //     $('.home-hero-client-item').on('mouseenter', function(e) {
                    //         e.preventDefault();
                    //         let video = $(this).find('video').get(0)
                    //         if (video.querySelector('source').getAttribute('src') == '') return;
                    //         video.currentTime = 0
                    //         video.play()
                    //     })
                    //     $('.home-hero-client-item').on('mouseleave', function(e) {
                    //         e.preventDefault();
                    //         let video = $(this).find('video').get(0)
                    //         if (video.querySelector('source').getAttribute('src') == '') return;
                    //         video.pause()
                    //     })
                    // }
                } else {
                    $('.home-hero-client-cms').addClass('swiper')
                    $('.home-hero-client-inner').addClass('swiper-wrapper')
                    $('.home-hero-client-item').addClass('swiper-slide')
                    let swiper = new Swiper('.home-hero-client-cms', {
                        slidesPerView: 1,
                    })
                    // swiper.on('slideChange', function() {
                    //     let video = $('.home-hero-client-item-inner').eq(swiper.activeIndex).find('video').get(0)
                    //     video.currentTime = 0
                    //     video.play()
                    // })
                }
                function closeModal() {
                    history.replaceState({},'',window.location.pathname)
                    $('.client-news-wrap').removeClass('active')
                    lenis.start()
                }
                function openModal(e ,el) {
                    let elId = $(el).attr('data-news-id');
                    if (elId) {
                        history.replaceState({},'',`?news=${elId}`)
                    }
                    let elUrl = $(el).attr('href');
                    let hasDetail = elUrl != '#' && elUrl != '' || elUrl.includes('work')
                    let hasExternalLink = elUrl.includes('http')
                    if (hasExternalLink) { return }
                    if (hasDetail) { return }
                    e.preventDefault();
                    let index = $(el).closest('.home-hero-client-item').index()
                    let modalEl = $('.client-news-wrap').eq(index)
                    console.log(modalEl)
                    if (modalEl.length > 0 && !modalEl.hasClass('active')) {
                        lenis.stop()
                        modalEl.addClass('active')
                        // Find all video tags within modalEl and add autoplay
                        modalEl.find('video').each(function() {
                            $(this).attr('autoplay', true);
                            this.play();
                        });
                    }
                }
            }
            if ($('.home-hero-client-cms').length > 0) {
                homeHeroClient()
            }
            function homeAbt() {
                const homeAbtSub = new SplitText('.home-abt-title', typeOpts.chars);
                if ($(window).width() >= 768) {
                    let tlLabel = gsap.timeline({
                        scrollTrigger: {
                            trigger: '.home-abt-title',
                            start: '50% bottom',
                            once: true
                        }
                    })
                    tlLabel
                    .from(homeAbtSub.words, {yPercent: 60, autoAlpha: 0, duration: .5, stagger: .03})
                }
                let tlLabelScrub = gsap.timeline({
                    scrollTrigger: {
                        trigger: '.home-abt-title',
                        start: '50% bottom',
                        end: '-25% top',
                        scrub: .1,
                    }
                })
                tlLabelScrub
                .from(homeAbtSub.chars, {color: '#C1C1C1', duration: .1, stagger: 0.02, ease: 'power1.out'})

                if ($(window).width() >= 768){
                    const allLinksLine = $('.home-abt-sub-wrap-p .hover-un')

                    const homeAbtLabel = new SplitText('.home-abt-label', typeOpts.words)
                    const homeAbtSubTxt = new SplitText('.home-abt-sub-wrap-p', typeOpts.words)
                    gsap.set(allLinksLine, {'--line-width': '0%'})

                    gsap.set(homeAbtSubTxt.lines, {overflow: 'hidden'})
                    let tlAbt = gsap.timeline({
                        scrollTrigger: {
                            trigger: '.home-abt-label-wrap',
                            start: 'top top+=50%',
                        },
                        defaults: {
                            ease: gOpts.ease
                        },
                        onComplete: () => {
                            gsap.to(allLinksLine, {'--line-width': '100%', duration: .6, clearProps: 'all', onComplete: () => {
                                homeAbtLabel.revert()
                                homeAbtSubTxt.revert()
                            }})
                        }
                    })
                    tlAbt
                    .from(homeAbtLabel.words, {yPercent: 100, duration: .6, stagger: .1})
                    .from('.home-abt-label-wrap .line', {scaleX: 0, transformOrigin: 'left', duration: 1.1, clearProps: 'all'}, '<=.1')
                    .from(homeAbtSubTxt.words, {yPercent: 100, duration: .4, stagger: .015}, '<=.2')
                    .from('.home-abt-sub-logo', {autoAlpha: 0, duration: .4, stagger: .015}, '<=.2')
                    if ($('.home-abt-btn-video').length <= 0) {
                        tlAbt
                        .from('.home-abt-btn', {autoAlpha: 0, duration: .4}, '<=0')
                        .from('.home-abt-btn .txt', {width: '0', marginLeft: '-1.2rem', duration: .4}, '<=0')
                    } else {
                        tlAbt
                        .from('.home-abt-btn-video', {autoAlpha: 0, duration: .4}, '<=0')
                        .from('.home-abt-btn-video .ic-embed', {scale: .5, duration: .4}, '<=0')
                    }
                } else {
                    if ($('.home-abt-sub-logos').length) {
                        let logoGrp = $('.home-abt-sub-logos-inner').clone(true)
                        $('.home-abt-sub-logos').append(logoGrp);
                        $('.home-abt-sub-logos-inner').addClass('anim-marquee-mb')
                    }
                }

                if ($('.home-abt-btn-video').length > 0) {
                    $('.home-abt-btn-video[data-popup="showreel"]').on('click', function(e) {
                        e.preventDefault();
                        if (reel) {
                            reel.openReel()
                        }
                    })
                }

                if ($('.home-abt-sub-wrap').hasClass('hover-ready')) {
                    if ($(window).width() < 991 && isTouchDevice()) {
                        let allItems = $('.home-abt-sub-wrap-p .hover-un[data-cursor-img]')
                        allItems.each((idx, el) => {
                            console.log(el)
                            let imgEl = $(document.createElement('img'))
                            imgEl.attr('src', $(el).attr('data-cursor-img'))
                            imgEl.attr('alt', $(el).attr('data-cursor-img-alt'))
                            imgEl.addClass('img-el')
                            $(el).append(imgEl)
                            $(el).on('mouseenter', function() {
                                $(this).find('.img-el').addClass('active')
                            })
                            $(el).on('mouseleave', function() {
                                $(this).find('.img-el').removeClass('active')
                            })
                        })
                    }
                }
            }
            homeAbt()

            function homeSer(data) {
                ScrollTrigger.create({
                    trigger: '.home-ser',
                    start: 'top bottom',
                    once: true,
                    onEnter: () => {
                        let allLotties = $(data.next.container).find('.home-ser-lottie').find('dotlottie-player');
                        if ($(window).width() >= 768) {
                            //allLotties.attr('loop', '')
                            allLotties.attr('autoplay', 'true')
                        }
                        allLotties.attr('autoplay', 'true')
                        requestAnimationFrame(() => {
                            allLotties.each(function(idx, el) {
                                let src = $(el).attr('data-srcUrl')
                                $(el).get(0).load(src).then(() => {
                                    // if ($(window).width() < 767) {
                                    //     if (idx == 3) {
                                    //         $(el).get(0).seek('55%');
                                    //     } else {
                                    //         $(el).get(0).seek('50%');
                                    //     }
                                    // }
                                })
                            })
                            if ($(window).width() >= 768) {
                                const homeSerTitle = new SplitText('.home-ser-title', typeOpts.chars)
                                let tl = gsap.timeline({
                                    scrollTrigger: {
                                        trigger: '.home-ser .title-wrap',
                                        start: 'top top+=65%',
                                        onComplete: () => {
                                            homeSerTitle.revert()
                                            new SplitText('.home-ser-title', typeOpts.lines)
                                        }
                                    }
                                })
                                tl.from(homeSerTitle.chars, {yPercent: 60, autoAlpha: 0, duration: .4, stagger: .02})
                            }
                        })
                    }
                })
            }
            homeSer(data)
            updateComingSoon(data, '.home-proj-item')
            updateProjVideo(data, '.home-proj-item')
            function homeComingSummary(data, thumb, item) {
                $(`${thumb}[data-cursor="soon"]`).on('click', function(e) {
                    e.preventDefault();
                    $(this).closest(item).find('.projdtl-sum-wrap').removeClass('hidden')
                    requestAnimationFrame(() => {
                        $(data.next.container).find('.projdtl-sum-wrap.active').removeClass('active')
                        $(this).closest(item).find('.projdtl-sum-wrap').addClass('active')
                        lenis.stop()
                    })
                })
                $(data.next.container).find('.projdtl-sum-label-hide').on('click', function(e) {
                    e.preventDefault()
                    $(data.next.container).find('.projdtl-sum-wrap.active').removeClass('active')
                    lenis.start()
                })
            }
            homeComingSummary(data, '.proj-gall-item-inner', '.home-proj-item');
            updateProjSumPopup(data)
            function homeProj(data) {
                //update Link
                // let allItems = $('.home-proj-item');
                // allItems.each((idx, el) => {
                //     let projLink = $(el).find('.home-proj-item-link').attr('href')
                //     $(el).find('.proj-gall-item-inner').attr('href', projLink)
                // })
                if ($(window).width() >= 768) {
                    const homeProjTitle = new SplitText($(data.next.container).find('.home-proj-title'), typeOpts.chars)
                    let tl = gsap.timeline({
                        scrollTrigger: {
                            trigger: $(data.next.container).find('.home-proj .title-wrap'),
                            start: 'top top+=65%',
                            onComplete: () => {
                                homeProjTitle.revert()
                                new SplitText('.home-proj-title', typeOpts.lines)
                            }
                        }
                    })
                    tl.from(homeProjTitle.chars, {yPercent: 60, autoAlpha: 0, duration: .4, stagger: .02})
                    const homeProjSub = new SplitText($(data.next.container).find('.home-proj-sub'), typeOpts.words);
                    let tlSub = gsap.timeline({
                        scrollTrigger: {
                            trigger: '.home-proj-sub',
                            start: 'top top+=65%',
                            once: true,
                            onComplete: () => {
                                homeProjSub.revert()
                            }
                        }
                    })
                    tlSub
                    .from(homeProjSub.words, {yPercent: 100, autoAlpha: 1, duration: .6, stagger: .03})
                    const homeProjTxt = $(data.next.container).find('.home-proj-item-inner');
                    if (homeProjTxt.length >= 1) {
                        homeProjTxt.each((index, el) => {
                            let txt = new SplitText($(el).find('.txt'), typeOpts.words);
                            // 3.13+ puts the cursor dot inside the "View project" text line (3.9 gave it its own line); move it back to the link
                            $(el).find('.g-lines > .btn-dot').each((i, dot) => dot.parentNode.parentNode.appendChild(dot))

                            let tlHomeProjTxt = gsap.timeline({
                                scrollTrigger: {
                                    trigger: el,
                                    start: 'top top+=65%',
                                },
                                onComplete: () => {
                                    txt.revert()
                                }
                            })
                            tlHomeProjTxt
                            .from($(el).find('.dot-decor'), {yPercent: 100, autoAlpha: 0, duration: .6, ease: gOpts.ease}, 0)
                            // .from($(el).find('.proj-gall-item-inner'), {scale: .8, stagger: .02, duration: .6, ease: gOpts.ease}, "<=0")
                            // .fromTo($(el).find('img'), {scale: 1.4, autoAlpha: 0},{scale: 1, stagger: .02, autoAlpha: 1, duration: .6, ease: gOpts.ease, onComplete: ()=>{$(el).find('.prj-vid').addClass('active')}, clearProps: 'all'}, "<=0")

                            tlHomeProjTxt
                            .from($(el).find('.proj-gall-item-inner'), {scale: 0, autoAlpha: 0, transformOrigin: 'left top', duration: 1, ease: "power3.out"}, "<=0")


                            tlHomeProjTxt
                            .from(txt.words, {yPercent: 60, autoAlpha: 0, stagger: 0.02, duration: .6}, "<=0")
                            .from($(el).find('.home-proj-item-link.hover-un'), {'--line-width': 0, duration: 1, ease: gOpts.ease}, "<=.5")
                        })
                    }
                }
            }
            homeProj(data)
            function homeClientMarquee(data) {
                ScrollTrigger.create({
                    trigger: $(data.next.container).find('.home-client'),
                    start: 'top bottom',
                    once: true,
                    onEnter: () => {
                        if ($(window).width() < 767) {
                            $(data.next.container).find('.home-client-marquee-img img[loading="lazy"]').removeAttr('loading');
                        }
                        let items = $(data.next.container).find('.home-client-marquee-wrap');
                        let speed;
                        if ($(window).width() > 767) {
                            speed = 90;
                        } else {
                            speed = 45;
                        }
                        items.each((idx, el) => {
                            let cloneItem = $(el).find('.home-client-marquee-cms').eq(0).clone();
                            cloneItem.clone().attr('aria-hidden', 'true').appendTo(el)
                            requestAnimationFrame(() => {
                                let tlDur = Math.floor($(el).find('.home-client-marquee-cms').eq(0).width() / speed)
                                $(el).find('.home-client-marquee-cms').css('--marqueeDur', `${tlDur}s`)

                                // let tlMarquee = gsap.timeline({
                                //     repeat: -1,
                                //     onUpdate: () => {
                                //         if ($(window).width() > 767) {
                                //             // let tlDir = lenis.direction >= 0 ? 1 : -1;
                                //             let tlDir = 1
                                //             gsap.to(tlMarquee, {timeScale: tlDir * Math.min(Math.max(lenis.velocity/2, 1), 4), duration: .1, ease: 'none'})
                                //         }
                                //     }
                                // })
                                // tlMarquee
                                // .to($(el).find('.home-client-marquee-cms'), {xPercent: $(el).hasClass('left') ? -100 : 100, duration: tlDur,  ease: 'none'}, '0')
                                // tlMarquee.seek(28800)
                            })
                        })
                        requestAnimationFrame(() => {
                            items.find('.home-client-marquee-cms').addClass('anim')
                        })
                    }
                })
            }
            homeClientMarquee(data)

            function homeTesti() {
                ScrollTrigger.create({
                    trigger:'.home-testi',
                    start: 'top bottom',
                    once: true,
                    onEnter: () => {
                        if ($(window).width() > 991) {
                            let startIdx = 0;
                            gsap.set('.home-testi-item', {paddingBottom: 0})
                            gsap.set($('.home-testi-item').eq(startIdx), {paddingBottom: '3.2rem'})
                            gsap.set('.home-testi-item-body', {height: 0})
                            gsap.set($('.home-testi-item-body').eq(startIdx), {height: 'auto'})
                            // gsap.set('.home-testi-bg', {autoAlpha: 0})
                            // gsap.set($('.home-testi-bg').eq(startIdx), {autoAlpha: 1})
                            gsap.set('.home-testi-item-body-inner-bg', {yPercent: -20})
                            gsap.set($('.home-testi-item-body-inner-bg').eq(0), {yPercent: 0})
                            gsap.set('.home-testi-item-content', {yPercent: 10})
                            gsap.set($('.home-testi-item-content').eq(0), {yPercent: 0})
                            // gsap.set('.home-testi-item-head', {height: '8.16rem', paddingBottom: '2rem'})
                            // gsap.set($('.home-testi-item-head').eq(startIdx), {height: '2rem', paddingBottom: '0'})
                            // gsap.set('.home-testi-item-title', {autoAlpha: 1, scale: 1, y: 0, transformOrigin: 'left top'})
                            // gsap.set($('.home-testi-item-title').eq(startIdx), {autoAlpha: 0, scale: .8, y: '2rem'})
                            // gsap.set('.home-testi-item-job', {autoAlpha: 1, scale: 1, y: 0, transformOrigin: 'right top'})
                            // gsap.set($('.home-testi-item-job').eq(startIdx), {autoAlpha: 0, scale: .8, y: '2rem'})
                            let tlScrub = gsap.timeline({
                                scrollTrigger: {
                                    trigger: '.home-testi',
                                    start: 'top top',
                                    end: 'bottom bottom',
                                    scrub: .2,
                                    snap: {
                                        // To update exact position and check directional
                                        snapTo: [0.07, .3, .6, .91],
                                        duration: { min: 0.1, max: 1 },
                                        delay: 0.01,
                                    },
                                    onUpdate: (self) => {
                                    }
                                },
                                defaults: {
                                    ease: 'power3.inOut'
                                }
                            })
                            tlScrub
                            .to($('.home-testi-item-body').eq(0), {height: '0', paddingBottom: '0', duration: 1}, '.25')
                            .to($('.home-testi-item').eq(0), {paddingBottom: '0', duration: 1}, '<=0')
                            .to($('.home-testi-item-body-inner-bg').eq(0), {yPercent: -20, duration: 1}, '<=0')
                            .to($('.home-testi-item-content').eq(0), {yPercent: 10, duration: 1}, '<=0')
                            // .to($('.home-testi-item-head').eq(0), {height: '8.16rem', paddingBottom: '2rem', duration: 1}, '<=0')
                            // .to($('.home-testi-item-title').eq(0), {autoAlpha: 1, scale: 1, y: 0, duration: 1}, '<=0')
                            // .to($('.home-testi-item-job').eq(0), {autoAlpha: 1, scale: 1, y: 0, duration: 1}, '<=0')
                            // .to($('.home-testi-bg').eq(0), {y: '-20vh', autoAlpha: 0, duration: 1, ease: 'power1.inOut'}, '<=0')

                            .to($('.home-testi-item-body').eq(1), {height: 'auto', duration: 1}, '<=0')
                            .to($('.home-testi-item').eq(1), {paddingBottom: '3.2rem', duration: 1}, '<=0')
                            .to($('.home-testi-item-body-inner-bg').eq(1), {yPercent: 0, duration: 1}, '<=0')
                            .to($('.home-testi-item-content').eq(1), {yPercent: 0, duration: 1}, '<=0')
                            // .to($('.home-testi-item-head').eq(1), {height: '2rem', paddingBottom: '0', duration: 1}, '<=0')
                            // .to($('.home-testi-item-title').eq(1), {autoAlpha: 0, scale: .8, y: '2rem', duration: 1}, '<=0')
                            // .to($('.home-testi-item-job').eq(1), {autoAlpha: 0, scale: .8, y: '2rem', duration: 1}, '<=0')
                            // .to($('.home-testi-bg').eq(1), {y: '-20vh', autoAlpha: 1, duration: 1, ease: 'power1.inOut'}, '<=0')

                            .to($('.home-testi-item-body').eq(1), {height: '0', paddingBottom: '0', duration: 1}, '>=.25')
                            .to($('.home-testi-item').eq(1), {paddingBottom: '0', duration: 1}, '<=0')
                            .to($('.home-testi-item-body-inner-bg').eq(1), {yPercent: -20, duration: 1}, '<=0')
                            .to($('.home-testi-item-content').eq(1), {yPercent: 10, duration: 1}, '<=0')
                            // .to($('.home-testi-item-head').eq(1), {height: '8.16rem', paddingBottom: '2rem', duration: 1}, '<=0')
                            // .to($('.home-testi-item-title').eq(1), {autoAlpha: 1, scale: 1, y: 0, duration: 1}, '<=0')
                            // .to($('.home-testi-item-job').eq(1), {autoAlpha: 1, scale: 1, y: 0, duration: 1}, '<=0')
                            // .to($('.home-testi-bg').eq(1), {y: '-20vh', autoAlpha: 0, duration: 1, ease: 'power1.inOut'}, '<=0')

                            .to($('.home-testi-item-body').eq(2), {height: 'auto', duration: 1}, '<=0')
                            .to($('.home-testi-item').eq(2), {paddingBottom: '3.2rem', duration: 1}, '<=0')
                            .to($('.home-testi-item-body-inner-bg').eq(2), {yPercent: 0, duration: 1}, '<=0')
                            .to($('.home-testi-item-content').eq(2), {yPercent: 0, duration: 1}, '<=0')
                            // .to($('.home-testi-item-head').eq(2), {height: '2rem', paddingBottom: '0', duration: 1}, '<=0')
                            // .to($('.home-testi-item-title').eq(2), {autoAlpha: 0, scale: .8, y: '2rem', duration: 1}, '<=0')
                            // .to($('.home-testi-item-job').eq(2), {autoAlpha: 0, scale: .8, y: '2rem', duration: 1}, '<=0')
                            // .to($('.home-testi-bg').eq(2), {y: '-20vh', autoAlpha: 1, duration: 1, ease: 'power1.inOut'}, '<=0')

                            .to($('.home-testi-item-body').eq(2), {height: '0', paddingBottom: '0', duration: 1}, '>=.25')
                            .to($('.home-testi-item').eq(2), {paddingBottom: '0', duration: 1}, '<=0')
                            .to($('.home-testi-item-body-inner-bg').eq(2), {yPercent: -20, duration: 1}, '<=0')
                            .to($('.home-testi-item-content').eq(2), {yPercent: 10, duration: 1}, '<=0')
                            // .to($('.home-testi-item-head').eq(2), {height: '8.16rem', paddingBottom: '2rem', duration: 1}, '<=0')
                            // .to($('.home-testi-item-title').eq(2), {autoAlpha: 1, scale: 1, y: 0, duration: 1}, '<=0')
                            // .to($('.home-testi-item-job').eq(2), {autoAlpha: 1, scale: 1, y: 0, duration: 1}, '<=0')
                            // .to($('.home-testi-bg').eq(2), {y: '-20vh', autoAlpha: 0, duration: 1, ease: 'power1.inOut'}, '<=0')

                            .to($('.home-testi-item-body').eq(3), {height: 'auto', duration: 1}, '<=0')
                            .to($('.home-testi-item').eq(3), {paddingBottom: '3.2rem', duration: 1}, '<=0')
                            .to($('.home-testi-item-body-inner-bg').eq(3), {yPercent: 0, duration: 1}, '<=0')
                            .to($('.home-testi-item-content').eq(3), {yPercent: 0, duration: 1}, '<=0')
                            // .to($('.home-testi-item-head').eq(3), {height: '2rem', paddingBottom: '0', duration: 1}, '<=0')
                            // .to($('.home-testi-item-title').eq(3), {autoAlpha: 0, scale: .8, y: '2rem', duration: 1}, '<=0')
                            // .to($('.home-testi-item-job').eq(3), {autoAlpha: 0, scale: .8, y: '2rem', duration: 1}, '<=0')
                            // .to($('.home-testi-bg').eq(3), {y: '-20vh', autoAlpha: 1, duration: 1, ease: 'power1.inOut'}, '<=0')

                            .to($('.home-testi-item-body').eq(3), {height: 'auto', duration: .25}, '>=0')

                        } else {
                            $('.home-testi-item').eq(0).addClass('active')
                            $('.home-testi-bg-item').eq(0).addClass('active')
                            $('.home-testi-item').eq(0).find('.home-testi-item-body').slideDown();
                            $('.home-testi-item-head').on('click', function(e) {
                                e.preventDefault();
                                if ($(this).closest('.home-testi-item').hasClass('active')) {
                                } else {
                                    $('.home-testi-item.active').find('.home-testi-item-body').slideUp()
                                    $(this).closest('.home-testi-item').find('.home-testi-item-body').slideDown();
                                    $('.home-testi-item').removeClass('active')
                                    $(this).closest('.home-testi-item').addClass('active')
                                    $('.home-testi-bg-item').removeClass('active')
                                    $('.home-testi-bg-item').eq($(this).closest('.home-testi-item').index()).addClass('active')
                                }
                            })
                        }
                    }
                })
            }
            homeTesti()
        },
        beforeLeave() {
        },
    }
    SCRIPT.abtScript = {
        namespace: 'about',
        afterEnter(data) {
            let physicalEngine;
            if ($('.abt-decor-canvas').length) {
                physicalEngine = new physical('.abt-decor-canvas')
                physicalEngine.startAnim()
            }
            function abtHero(data) {
                if ($(window).width() >= 768) {
                    const titleTxt = new SplitText($(data.next.container).find('.abt-hero-title'), typeOpts.chars)
                    const subTxt = new SplitText($(data.next.container).find('.abt-hero-sub'), typeOpts.words)
                    let tl = gsap.timeline({
                        scrollTrigger: {
                            trigger: '.abt-hero',
                            start: 'top bottom',
                        },
                        delay: 2.5,
                        onComplete: () => {
                            titleTxt.revert()
                            new SplitText('.abt-hero-title', typeOpts.lines)
                            subTxt.revert()
                        }
                    })
                    tl
                    .from(titleTxt.chars, {yPercent: 60, autoAlpha: 0, stagger: 0.01, duration: .4, ease: gOpts.ease}, 0)
                    .from(subTxt.words, {yPercent: 60, autoAlpha: 0, stagger: 0.01, duration: .4, ease: gOpts.ease}, '<=.2')
                    .from($(data.next.container).find('.abt-hero-line'), {scaleX: 0, transformOrigin: 'left', duration: 1.5, ease: gOpts.ease}, '<=.2');

                    let staticItem = $($(data.next.container).find('.abt-statis-cms .abt-statis-item'));
                    staticItem.each((idx, el) => {
                        const title = new SplitText($(el).find('.abt-statis-item-title'), typeOpts.chars)
                        const sub = new SplitText($(el).find('.abt-statis-item-sub'), typeOpts.chars)
                        const line = $(el).find('.abt-statis-item-line')

                        tl
                        .from(title.chars, {yPercent: 40, autoAlpha: 0, stagger: .03, duration: .7, ease: gOpts.ease}, `${idx == 0 ? '<=' : ''}${0 + idx * .2}`)
                        .from(line, {scaleX: 0, autoAlpha: 0, transformOrigin: 'top left', duration: 1, ease: gOpts.ease}, '<=0')
                        .from(sub.chars, {yPercent: 60, autoAlpha: 0, stagger: .01, duration: .4, ease: gOpts.ease}, '<=.3')
                    })
                }
            }
            abtHero(data)
            // function abtStatis(data) {
            //     if ($(window).width() >= 768) {
            //         let staticItem = $($(data.next.container).find('.abt-statis-cms .abt-statis-item'));
            //         let tl = gsap.timeline({
            //             scrollTrigger: {
            //                 trigger: '.abt-statis',
            //                 start: 'top bottom',
            //             },
            //         })
            //         staticItem.each((idx, el) => {
            //             const title = new SplitText($(el).find('.abt-statis-item-title'), typeOpts.chars)
            //             const sub = new SplitText($(el).find('.abt-statis-item-sub'), typeOpts.chars)
            //             const line = $(el).find('.abt-statis-item-line')

            //             tl
            //             .from(title.chars, {yPercent: 40, autoAlpha: 0, stagger: .03, duration: .7, ease: gOpts.ease}, `${0 + idx * .2}`)
            //             .from(line, {scaleX: 0, autoAlpha: 0, transformOrigin: 'top left', duration: 1, ease: gOpts.ease}, '<=0')
            //             .from(sub.chars, {yPercent: 60, autoAlpha: 0, stagger: .01, duration: .4, ease: gOpts.ease}, '<=.3')
            //         })
            //     }
            // }
            //abtStatis(data)
            function abtGall(data) {
                if ( $(window).width() > 991) {
                    // const topOffset = $(window).height() - ($(data.next.container).find('.abt-gall-list').height() + $('.header-top').height())
                    // let speed = 2
                    // let distance = $(data.next.container).find('.abt-gall-list').width() - $(data.next.container).find('.abt-gall-cms').width() + parseFloat($('.container').css('padding-right'))
                    // let height = speed * distance
                    // gsap.set($(data.next.container).find('.abt-gall-sticky'), {
                    //     top: topOffset/2 + $('.header-top').height()
                    // })
                    // if (height >= parseFloat($(data.next.container).find('.abt-gall-wrap').css('height'))) {
                    //     gsap.set($(data.next.container).find('.abt-gall-wrap'), {height: height})
                    // }
                    // let tl = gsap.timeline({
                    //     scrollTrigger: {
                    //         trigger: $(data.next.container).find('.abt-gall-wrap'),
                    //         start: `top-=${topOffset/2} top+=${$('.header-top').height()}`,
                    //         end: `bottom bottom-=${topOffset/2}`,
                    //         scrub: .2,
                    //     }
                    // })
                    // tl.to($(data.next.container).find('.abt-gall-list'), {x: - distance, ease: 'none'})
                }
                const abtGallSwiper = new Swiper('.abt-gall-cms', {
                    slidesPerView: 'auto',
                    spaceBetween: parseRem(8),
                    grabCursor: true,
                    breakpoints: {
                        767: {
                            spaceBetween: parseRem(20)
                        }
                    }
                })
                if ($(window).width() >= 768) {
                    const abtValImgs = $(data.next.container).find('.abt-gall-item.swiper-slide');
                    let tlImgs = gsap.timeline({
                        scrollTrigger: {
                            trigger: $(data.next.container).find('.abt-gall-cms'),
                            start: 'top top+=85%',
                        }
                    })
                    requestAnimationFrame(() => {
                        tlImgs
                        .from(abtValImgs, {scale: .8, autoAlpha: 0, transformOrigin: 'center center', duration: .8, ease: gOpts.ease, stagger: 0.1, clearProps: 'transform, opacity, transform-origin'})
                    })
                }

            }
            abtGall(data)
            function abtVal(data) {
                //$(data.next.container).find('.abt-val-imgs-stick').css('top', ($(window).height() - $(data.next.container).find('.abt-val-imgs-stick').height())/2);
                if ($(window).width() >= 768) {
                    const labelTxt = new SplitText($(data.next.container).find('.abt-val .abt-val-label'), typeOpts.chars)
                    const titleTxt = new SplitText($(data.next.container).find('.abt-val .abt-val-title'), typeOpts.words)
                    let tl = gsap.timeline({
                        scrollTrigger: {
                            trigger: $(data.next.container).find('.abt-val-title'),
                            start: `top top+=75%`,
                        },
                        onComplete: () => {
                            labelTxt.revert()
                            titleTxt.revert()
                        }
                    })
                    tl
                    .from(labelTxt.chars, {yPercent: 60, autoAlpha:0, stagger: .01, duration: .4, ease: gOpts.ease}, 0)
                    .from(titleTxt.words, {yPercent: 60, autoAlpha:0, stagger: .01, duration: .4, ease: gOpts.ease}, '<=.2')
                }

                const items = $(data.next.container).find('.abt-val .abt-val-item');
                $(data.next.container).find('.abt-val-imgs-stick .abt-val-imgs-wrap').eq(0).addClass('active')
                items.each((idx, el) => {
                    ScrollTrigger.create({
                        trigger: el,
                        start: 'top top+=35%',
                        end: 'bottom top+=35%',
                        onEnter: () => {
                            $(data.next.container).find('.abt-val .abt-val-imgs-item:not(.abt-val-imgs-item-mobile)').removeClass('active')
                            $(data.next.container).find('.abt-val .abt-val-imgs-item:not(.abt-val-imgs-item-mobile)').eq(idx).addClass('active')
                        },
                        onEnterBack: () => {
                            $(data.next.container).find('.abt-val .abt-val-imgs-item:not(.abt-val-imgs-item-mobile)').removeClass('active')
                            $(data.next.container).find('.abt-val .abt-val-imgs-item:not(.abt-val-imgs-item-mobile)').eq(idx).addClass('active')
                        }
                    })
                })
            }
            abtVal(data)
            function abtTeamMarquee(data) {
                const barbaData = $(data.next.container)
                let cloneItem = barbaData.find('.abt-marquee-item').eq(0).clone();
                let cloneTime = Math.ceil(barbaData.find('.abt-marquee-inner').width() / barbaData.find('.abt-marquee-item').width());
                for (let i = 0; i < cloneTime; i++) {
                    cloneItem.clone().attr('aria-hidden', 'true').appendTo(barbaData.find('.abt-marquee-inner'))
                }
                let tlDur = 30;
                requestAnimationFrame(() => {
                    let tlMarquee = gsap.timeline({
                        repeat: -1,
                        onUpdate: () => {
                            let tlDir = lenis.direction >= 0 ? 1 : -1;
                            gsap.to(tlMarquee, {timeScale: tlDir * Math.min(Math.max(lenis.velocity/2, 1), 4), duration: .1, ease: 'none'})
                        }
                    })
                    tlMarquee.seek(28800)
                    tlMarquee
                    .to(barbaData.find('.abt-team-marquee .abt-marquee-item'), {xPercent: -100, duration: tlDur,  ease: 'none'})
                    requestAnimationFrame(() => {
                        let tl = gsap.timeline({
                            scrollTrigger: {
                                trigger: barbaData.find('.abt-team'),
                                start: 'top top+=65%',
                            },
                        })
                        if ($(window).width() >= 768) {
                            const marqueeTxt = new SplitText(barbaData.find('.abt-team-marquee .abt-marquee-item .abt-marquee-item-heading'), {...typeOpts.chars, linesClass: ''})
                            const titleTxt = new SplitText(barbaData.find('.abt-team .abt-team-sub-title'), typeOpts.words)

                            tl
                            .from(marqueeTxt.chars, {
                                onComplete: () => {marqueeTxt.revert()},
                                yPercent: 60, autoAlpha: 0, stagger: .01, duration: .6, ease: gOpts.ease
                            }, '<=.2')
                            .from(barbaData.find('.abt-team-marquee .abt-marquee-item .abt-marquee-dot'), {y: 200, autoAlpha: 0, duration: .6, ease: gOpts.ease}, '<=0')
                            .from(titleTxt.words, {
                                onComplete: () => {
                                    titleTxt.revert()
                                    new SplitText(barbaData.find('.abt-team-marquee .abt-marquee-item .abt-marquee-item-heading'), {...typeOpts.chars, linesClass: ''})
                                },
                                yPercent: 60, autoAlpha: 0, stagger: .01, duration: .6, ease: gOpts.ease
                            }, '<=.4')
                        }
                    })
                })
            }
            function abtTeamMain(data) {
                const barbaData = $(data.next.container)
                function activeItem(el) {
                    $('.abt-team-n-main-stick-ph').addClass('de-active')
                    let idx = $(el).attr('data-team-order');
                    console.log(idx)
                    $('.abt-team-n-main-stick-item').removeClass('active')
                    $(`.abt-team-n-main-stick-item[data-team-order="${idx}"]`).addClass('active')
                    barbaData.find('.abt-team-n-grid-item-link').removeClass('active')
                    $(el).addClass('active');
                }
                if ($(window).width() > 767) {
                    let MemberCloneItem = $(document.createElement('div')).addClass('abt-team-n-grid-item-blank')
                    let allItems = barbaData.find('.abt-team-n-grid-item')
                    allItems.each((idx, el) => {
                        $(el).after(MemberCloneItem.clone())
                    })
                    requestAnimationFrame(() => {
                        if ($(window).width() > 991) {
                            headerProgTl.scrollTrigger.refresh()
                        }
                    })
                    barbaData.find('.abt-team-n-grid-item-link').on('click', function(e) {
                        e.preventDefault()
                    })
                    barbaData.find('.abt-team-n-grid-item-link').on('pointerenter', function(e) {
                        e.preventDefault();
                        activeItem(this)
                    })
                    requestAnimationFrame(() => {
                        allItems.each((idx, el) => {
                            gsap.from($(el).find('.abt-team-n-grid-item-link'), {autoAlpha: 0, yPercent: 20, duration: 1, scrollTrigger: {
                                trigger: el,
                                once: true,
                                start: 'top top+=65%'
                            }})
                        })
                    })
                } else {
                    $('.abt-team-n-grid-cms').addClass('swiper');
                    $('.abt-team-n-grid-list').addClass('swiper-wrapper');
                    $('.abt-team-n-grid-item').addClass('swiper-slide')
                    const abtTeamSwiperMb = new Swiper('.abt-team-n-grid-cms', {
                        slidesPerView: 4,
                        spaceBetween: parseRem(8),
                        breakpoints: {
                            479: {
                                slidesPerView: 5
                            }
                        }
                    })
                    barbaData.find('.abt-team-n-grid-item-link').on('click', function(e) {
                        e.preventDefault();
                        activeItem(this)
                    })
                }
            }
            function abtTeam(data) {
                // function old() {
                //     let cloneItem = barbaData.find('.abt-marquee-item').eq(0).clone();
                //     let cloneTime = Math.ceil(barbaData.find('.abt-marquee-inner').width() / barbaData.find('.abt-marquee-item').width());
                //     for (let i = 0; i < cloneTime; i++) {
                //         cloneItem.clone().appendTo(barbaData.find('.abt-marquee-inner'))
                //     }
                //     let tlDur = 30;
                //     requestAnimationFrame(() => {
                //         let tlMarquee = gsap.timeline({
                //             repeat: -1,
                //             onUpdate: () => {
                //                 let tlDir = lenis.direction >= 0 ? 1 : -1;
                //                 gsap.to(tlMarquee, {timeScale: tlDir * Math.min(Math.max(lenis.velocity/2, 1), 4), duration: .1, ease: 'none'})
                //             }
                //         })
                //         tlMarquee.seek(28800)
                //         tlMarquee
                //         .to(barbaData.find('.abt-team-marquee .abt-marquee-item'), {xPercent: -100, duration: tlDur,  ease: 'none'})
                //         requestAnimationFrame(() => {
                //             let tl = gsap.timeline({
                //                 scrollTrigger: {
                //                     trigger: barbaData.find('.abt-team'),
                //                     start: 'top top+=65%',
                //                 },
                //             })
                //             if ($(window).width() >= 768) {
                //                 const marqueeTxt = new SplitText(barbaData.find('.abt-team-marquee .abt-marquee-item .abt-marquee-item-heading'), {type: 'chars,words,lines'})
                //                 const titleTxt = new SplitText(barbaData.find('.abt-team .abt-team-sub-title'), typeOpts.words)

                //                 tl
                //                 .from(marqueeTxt.chars, {
                //                     onComplete: () => {marqueeTxt.revert()},
                //                     yPercent: 60, autoAlpha: 0, stagger: .01, duration: .6, ease: gOpts.ease
                //                 }, '<=.2')
                //                 .from(barbaData.find('.abt-team-marquee .abt-marquee-item .abt-marquee-dot'), {y: 200, autoAlpha: 0, duration: .6, ease: gOpts.ease}, '<=0')
                //                 .from(titleTxt.words, {
                //                     onComplete: () => {
                //                         titleTxt.revert()
                //                         new SplitText(barbaData.find('.abt-team-marquee .abt-marquee-item .abt-marquee-item-heading'), {type: 'chars,words,lines'})
                //                     },
                //                     yPercent: 60, autoAlpha: 0, stagger: .01, duration: .6, ease: gOpts.ease
                //                 }, '<=.4')
                //             }

                //             if ($(window).width() > 991) {
                //                 tl
                //                 .from(barbaData.find('.abt-team-window'), {y: 50, scale: .96, borderRadius: '2rem' , transformOrigin: 'bottom center', autoAlpha: 0, duration: 1, ease: 'power1.out', clearProps: 'all'}, '<=.2')
                //                 .from(barbaData.find('.abt-team-main-item'), {scale: .9, autoAlpha: 0, stagger: .06, duration: .8, ease: gOpts.ease, clearProps: 'all'}, '<=.6')
                //                 let mainItems = barbaData.find('.abt-team-main-wrap .abt-team-main-item')
                //                 let infoItems = barbaData.find('.abt-team-main-info-cms .abt-team-main-info-item')
                //                 mainItems.each((idx, el) => {
                //                     $(el).on('mouseenter', function(e) {
                //                         e.preventDefault()
                //                         activeIndex(infoItems, idx)
                //                     })
                //                     $(el).on('mouseleave', function(e) {
                //                         e.preventDefault()
                //                         infoItems.removeClass('active')
                //                     })
                //                 })
                //                 function initMouse() {
                //                     let wrap = barbaData.find('.abt-team-main-info-cms')
                //                     let target = barbaData.find('.abt-team-main-info-list')

                //                     let xTarget = xGetter(target.get(0))
                //                     let yTarget = yGetter(target.get(0))
                //                     if (barbaData.find('.abt-team:hover').length) {
                //                         let xMove = (pointerCurr().x - wrap.get(0).getBoundingClientRect().left)
                //                         let yMove = (pointerCurr().y - wrap.get(0).getBoundingClientRect().top)/(wrap.height()) * (wrap.height())
                //                         xSetter(target)(lerp(xTarget, xMove, 0.05))
                //                         ySetter(target)(lerp(yTarget, yMove, 0.05))
                //                     }
                //                     requestAnimationFrame(initMouse)
                //                 }
                //                 requestAnimationFrame(initMouse)
                //             } else if ($(window).width() > 767) {
                //                 barbaData.find('.abt-team-main-item').each((idx, el) => {
                //                     $(el).on('mousedown', function(e) {
                //                         e.preventDefault()
                //                         if (!$(el).hasClass('active')) {
                //                             barbaData.find('.abt-team-main-item').removeClass('active')
                //                             $(el).addClass('active')
                //                         } else {
                //                             barbaData.find('.abt-team-main-item').removeClass('active')
                //                         }
                //                     })
                //                 })
                //             }
                //         })
                //     })
                // }
                ScrollTrigger.create({
                    trigger: '.abt-team',
                    start: 'top bottom',
                    once: true,
                    onEnter: () => {
                        abtTeamMarquee(data)
                        abtTeamMain(data)
                    }
                })
            }
            abtTeam(data)
            function abtAward(data) {
                let tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: $(data.next.container).find('.abt-award'),
                        start: 'top top+=65%',
                    }
                })
                if ($(window).width() >= 768) {
                    const titleTxt = new SplitText($(data.next.container).find('.abt-award-title'), typeOpts.words)
                    tl
                    .from(titleTxt.words, {
                        onComplete: () => {
                            titleTxt.revert()
                        },
                        yPercent: 60, autoAlpha: 0, stagger: .05, duration: .6, ease: gOpts.ease
                    })
                }

                if ( $(window).width() > 991 ) {
                    $(data.next.container).find('.abt-award-sub-item').each((idx, el) => {
                        let subTxt = new SplitText($(el).find('.abt-award-sub-item-txt'), typeOpts.chars)
                        tl
                        .from(subTxt.chars, { yPercent: 60, autoAlpha: 0, stagger: .04, duration: .6, ease: gOpts.ease}, '<=.1')
                        .from($(el).find('.line'), {scaleX: 0, transformOrigin: 'left', duration: 1.5, ease: gOpts.ease}, '0')
                    })
                    $(data.next.container).find('.abt-award-main-item').each((idx, el) => {
                        let dateTxt = new SplitText($(el).find('.abt-award-date .abt-award-sub-item-txt'), typeOpts.chars)
                        let nameTxt = new SplitText($(el).find('.abt-award-project .abt-award-sub-item-txt'), typeOpts.chars)
                        let typeTxt = new SplitText($(el).find('.abt-award-type .abt-award-sub-item-txt'), typeOpts.chars)
                        let awardTxt = new SplitText($(el).find('.abt-award-award .abt-award-sub-item-txt'), typeOpts.chars)
                        tl
                        .from(dateTxt.chars, {yPercent: 60, autoAlpha: 0, stagger: 0.01, duration: .4, ease: gOpts.ease}, `${0 + idx * .3}`)
                        .from(nameTxt.chars, {yPercent: 60, autoAlpha: 0, stagger: 0.01, duration: .4, ease: gOpts.ease}, '<=.1')
                        .from(typeTxt.chars, {yPercent: 60, autoAlpha: 0, stagger: 0.01, duration: .4, ease: gOpts.ease}, '<=.1')
                        .from(awardTxt.chars, {yPercent: 60, autoAlpha: 0, stagger: 0.01, duration: .4, ease: gOpts.ease}, '<=.1')
                    })
                    const items = $(data.next.container).find('.abt-award-main-cms .abt-award-main-item')
                    const thumbs = $(data.next.container).find('.abt-award-thumb-cms')
                    $(data.next.container).find('.abt-award-main-cms .abt-award-main-item').on('pointerenter', function(e) {
                        thumbs.addClass('active')
                    })
                    $(data.next.container).find('.abt-award-main-cms .abt-award-main-item').on('pointerleave', function(e) {
                        thumbs.removeClass('active')
                    })

                    $(data.next.container).find('.abt-award-thumb-item').css('height', $(data.next.container).find('.abt-award-thumb-cms').height())
                    let currIdx;
                    function initImgMove() {
                        let parent = $(data.next.container).find('.abt-award-main-cms');
                        let target = $(data.next.container).find('.abt-award-thumb-wrapper');
                        let targetThumb = $(data.next.container).find('.abt-award-thumb-cms')
                        // $(data.next.container).find('.abt-award-main-item').each((idx, el) => {
                        //     if ($(el).is(':hover')) {
                        //         currIdx = idx;
                        //         gsap.to($(data.next.container).find('.abt-award-thumb-list'), {
                        //             yPercent: (-100/$(data.next.container).find('.abt-award-thumb-item').length) * currIdx
                        //         })
                        //     }
                        // })
                        if ($(data.next.container).find('.abt-award-main-item:hover').length) {
                            let thisIdx = $(data.next.container).find('.abt-award-main-item:hover').index();
                            if (currIdx != thisIdx) {
                                gsap.to($(data.next.container).find('.abt-award-thumb-list'), {
                                    yPercent: (-100/$(data.next.container).find('.abt-award-thumb-item').length) * thisIdx, overwrite: true
                                })
                                currIdx = thisIdx
                            }
                        }
                        let xThumb = xGetter(target.get(0))
                        let yThumb = yGetter(target.get(0))
                        rotZThumb = rotZGetter(target.get(0))

                        if ($(data.next.container).find('.abt-award:hover').length) {
                            moveX = (pointerCurr().x - parent.get(0).getBoundingClientRect().left) / parent.width() * targetThumb.width()/2
                            moveY = (pointerCurr().y - parent.get(0).getBoundingClientRect().top) / parent.height() * (parent.height()) - targetThumb.height()/2
                            xSetter(target.get(0))(lerp(xThumb, moveX, 0.1))
                            ySetter(target.get(0))(lerp(yThumb, moveY, 0.1))
                            rotZSetter(target.get(0))(Math.min(Math.max((lerp(rotZThumb, (moveX - xThumb)/20, .1)), -5), 5))
                        }
                        requestAnimationFrame(initImgMove)
                    }
                    requestAnimationFrame(initImgMove)
                } else if ($(window).width() <= 991 && $(window).width() > 767) {
                    let parent = $(data.next.container).find('.abt-award-main-cms');
                    let target = $(data.next.container).find('.abt-award-thumb-wrapper');
                    let items = $(data.next.container).find('.abt-award-main-cms .abt-award-main-item')
                    let currIdx
                    items.each((idx, el) => {
                        $(el).on('click', function(e) {
                            e.preventDefault()
                            if (!$(el).hasClass('active')) {
                                activeIndex(items, idx)
                                $(data.next.container).find('.abt-award-thumb-cms').addClass('active')
                            } else {
                                items.removeClass('active')
                                $(data.next.container).find('.abt-award-thumb-cms').removeClass('active')
                            }
                            let moveY = ($(el).get(0).getBoundingClientRect().top - parent.get(0).getBoundingClientRect().top)
                            gsap.to(target, {
                                y: moveY - $(el).height()/2
                            })
                            currIdx = idx
                            gsap.to($(data.next.container).find('.abt-award-thumb-list'), {
                                yPercent: -100/$(data.next.container).find('.abt-award-thumb-item').length * currIdx
                            })
                        })
                    })
                    $(document).on('mouseup', function(e) {
                        if (!parent.is(e.target) && parent.has(e.target).length === 0) {
                            $(data.next.container).find('.abt-award-thumb-cms').removeClass('active')
                            items.removeClass('active')
                        }
                    })
                } else {
                    const items = $(data.next.container).find('.abt-award-main-cms .abt-award-main-item .abt-award-wrap-head')
                    items.on('click', function(e) {
                        e.preventDefault()
                        if ( !$(this).closest('.abt-award-main-item').hasClass('active') ) {
                            items.closest('.abt-award-main-item').removeClass('active')
                            $(this).closest('.abt-award-main-item').addClass('active')
                            items.closest('.abt-award-main-item').find('.abt-award-wrap-body').slideUp(400)
                            $(this).closest('.abt-award-main-item').find('.abt-award-wrap-body').slideDown(400)

                        } else {
                            items.closest('.abt-award-main-item').removeClass('active')
                            items.closest('.abt-award-main-item').find('.abt-award-wrap-body').slideUp(400)
                        }
                    })
                }
            }
            abtAward(data)
            function abtTesti(data) {
                const titleTxt = new SplitText($(data.next.container).find('.abt-testi-title'), typeOpts.chars)

                if ($(window).width() >= 768) {
                    const labelTxt = new SplitText($(data.next.container).find('.abt-testi-label'), typeOpts.chars)
                    let tl = gsap.timeline({
                        scrollTrigger: {
                            trigger: $(data.next.container).find('.abt-testi'),
                            start: 'top top+=85%',
                        },
                        onComplete: () => {
                            labelTxt.revert()
                        }
                    })
                    tl
                    .from(titleTxt.chars, {yPercent: 60, autoAlpha: 0, stagger: .01, duration: .6, ease: gOpts.ease}, 0)
                    .from(labelTxt.chars, {yPercent: 60, autoAlpha: 0, stagger: .01, duration: .6, ease: gOpts.ease}, '<=.4')
                    .from($(data.next.container).find('.abt-testi-label-wrap .line'), {scaleX: 0, transformOrigin: 'left', duration: 1, ease: gOpts.ease}, '<=.4')
                }

                let tlColor = gsap.timeline({
                    scrollTrigger: {
                        trigger: $(data.next.container).find('.abt-testi'),
                        start: 'top top+=85%',
                        end: 'top top+=10%',
                        scrub: .1,
                    }
                })
                tlColor
                .from(titleTxt.chars, {color: '#C1C1C1', stagger: .06 ,ease: 'none'})

                if ($(window).width() >= 768) {
                    $(data.next.container).find('.abt-testi-main-item').each((idx, el) => {
                        const nameTxt = new SplitText($(el).find('.abt-testi-main-name'), typeOpts.words)
                        const subTxt = new SplitText($(el).find('.abt-testi-main-sub'), typeOpts.chars)
                        const richTxt = new SplitText($(el).find('.abt-testi-main-text'), typeOpts.words)

                        let itemTl = gsap.timeline({
                            scrollTrigger: {
                                trigger: $(el),
                                start: 'top top+=85%',
                                onComplete: () => {
                                    nameTxt.revert()
                                    subTxt.revert()
                                    richTxt.revert()
                                }
                            }
                        })

                        itemTl
                        .from(nameTxt.words, {yPercent: 60, autoAlpha: 0, stagger: .04, duration: .6, ease: gOpts.ease}, 0)
                        .from(subTxt.chars, {yPercent: 60, autoAlpha: 0, stagger: .03, duration: .6, ease: gOpts.ease}, '<=.2')
                        .from($(el).find('.abt-testi-main-logo-wrap'), {yPercent: 20,autoAlpha: 0, duration: .6, ease: gOpts.ease, clearProps: "all"},'<=.2')
                        .from(richTxt.words, {yPercent: 60, autoAlpha: 0, stagger: .01, duration: .6, ease: gOpts.ease}, 0)
                    })
                }

                if ($(window).width() > 991) {
                    let mainItems = $(data.next.container).find('.abt-testi-main-item')
                    let thumbItems = $(data.next.container).find('.abt-testi-thumb-item')
                    let richTxt = $(data.next.container).find('.abt-testi-main-txt-wrap')

                    richTxt.on('mouseenter', function(e) {
                        e.preventDefault()
                        activeIndex(thumbItems, $(this).closest('.abt-testi-main-item').index())
                    })
                    richTxt.on('mouseleave', function(e) {
                        e.preventDefault()
                        thumbItems.removeClass('active')
                    })
                    function initThumbMove() {
                        let wrap = $(data.next.container).find('.abt-testi-thumb-wrap')
                        let target = $(data.next.container).find('.abt-testi-thumb-cms')
                        let xThumb = xGetter(target.get(0))
                        let yThumb = yGetter(target.get(0))
                        let rotzThumb = rotZGetter(target.get(0))
                        if ($(data.next.container).find('.abt-testi:hover').length) {
                            let moveX = (pointerCurr().x - wrap.get(0).getBoundingClientRect().left)/(wrap.width()) * (wrap.width())
                            let moveY = (pointerCurr().y - wrap.get(0).getBoundingClientRect().top)/(wrap.height()) * (wrap.height())
                            xSetter(target.get(0))(lerp(xThumb, moveX, 0.05))
                            ySetter(target.get(0))(lerp(yThumb, moveY, 0.05))
                            rotZSetter(target.get(0))(Math.min(Math.max((lerp(rotzThumb, (moveX - xThumb)/40, .05)), -12), 12))
                        }
                        requestAnimationFrame(initThumbMove)
                    }
                    requestAnimationFrame(initThumbMove)
                }
            }
            abtTesti(data)
        },
        beforeLeave() {
            physicalEngine.destroy()
        },
    }
    SCRIPT.projDtlScript = {
        namespace: 'projDtl',
        afterEnter(data) {
            console.log("Enter ProjDtl");
            function updateNewsProj(data) {
                if ($(window).width() > 991) {
                    if ($(data.next.container).find('.projdtl-intro-news-list').length <= 0) {
                        $(data.next.container).find('.projdtl-intro-main').addClass('mod-full');
                        $(data.next.container).find('.projdtl-intro-news').addClass('hidden');
                    }
                }
                if ($(data.next.container).find('.projdtl-sum-stick-wrap').hasClass('w-condition-invisible')) {
                    $(data.next.container).find('.projdtl-intro-main').addClass('mod-no-sum')
                }
            }
            updateNewsProj(data)
            function updateNextProj(data) {
                let current = $(data.next.container).find('.proj-data-item-link.w--current').closest('.proj-data-item').index();
                let next;
                if (current + 1 >= $(data.next.container).find('.proj-data-item').length) {
                    next = 0
                } else {
                    next = current + 1
                }

                $(data.next.container).find('.projdtl-hero.mod-bottom').find('.projdtl-hero-title').removeClass('w-dyn-bind-empty')
                $(data.next.container).find('.projdtl-hero.mod-bottom').find('.projdtl-hero-title-label-name').text($(data.next.container).find('.proj-data-item').eq(next).find('.proj-data-item-name').text())
                $(data.next.container).find('.projdtl-hero.mod-bottom').find('.projdtl-hero-title').text($(data.next.container).find('.proj-data-item').eq(next).find('.proj-data-item-link').text())
                $(data.next.container).find('.projdtl-hero.mod-bottom').find('.projdtl-hero-title-wrap').attr('href', $(data.next.container).find('.proj-data-item').eq(next).find('.proj-data-item-link').attr('href'))
            }
            updateNextProj(data)
            function projdtlHero(data) {
                if ($(window).width() > 767) {
                    requestAnimationFrame(() => {
                        // let colorHero = $(data.next.container).find('.projdtl-hero.mod-top').find('.projdtl-hero-color').css('color').replace('rgb(','').replace(')','')
                        // let colorFooter = $(data.next.container).find('.projdtl-hero.mod-bottom').find('.projdtl-hero-color').css('color').replace('rgb(','').replace(')','')
                        let colorFooter = {x: '150', y: '128', z: '255'};

                        initTitleGrid($(data.next.container).find('.projdtl-hero.mod-top').find('.title-dot-canvas'))
                        initTitleGrid($(data.next.container).find('.projdtl-hero.mod-bottom').find('.title-dot-canvas'), colorFooter)
                    })
                }
            }
            projdtlHero(data)
            function projdtlToc(data) {
                let items = $(data.next.container).find('.projdtl-prog-item:not(".w-condition-invisible")')
                $('.header-projdtl-name').text($(data.next.container).find('.projdtl-sum-label-txt').text())
                items.each((idx, el) => {
                    $(el).find('.projdtl-prog-item-label').text(`0${idx + 1}`)
                })
                $('[data-proj-step]').removeClass('hidden');
                $('.header-projdtl .header-projdtl-comma').removeClass('hidden')
                $(data.next.container).find('[data-proj-section]').each((idx, el) => {
                    if ($(el).hasClass('w-condition-invisible')) {
                        $(`[data-proj-step="${idx}"]`).addClass('hidden')
                    }
                })
                if ($(data.next.container).find('[data-proj-section]:not(".w-condition-invisible")').length <= 2) {
                    $('.header-projdtl .header-projdtl-comma').addClass('hidden')
                    $(data.next.container).find('.projdtl-prog-wrap').remove();
                    $('[data-proj-step]').addClass('hidden');
                }
                $('[data-proj-step]').on('click', function(e) {
                    e.preventDefault();
                    let val = $(this).data('proj-step');
                    let target = $(`[data-proj-section="${val}"]:not(".w-condition-invisible")`).get(0);
                    if (val != 0) {
                        history.replaceState({},'',`#sc${val}`)
                    } else {
                        history.replaceState({},'','#')
                    }
                    lenis.scrollTo(target, {
                        offset: parseRem(200) * -1,
                    })
                })

                requestAnimationFrame(() => {
                    $('.header-projdtl-toc-item').removeClass('active');
                    lenis.on('scroll', function(e) {
                        let scTarget = $('section[data-proj-section]:not(".w-condition-invisible")')
                        scTarget.each((idx, el) => {
                            let top = el.getBoundingClientRect().top;
                            if (top < $(window).height()/2) {
                                let target = $(el).attr('data-proj-section')
                                $(`.header-projdtl-toc-item[data-proj-step="${target}"]`).addClass('active');
                                $('.header-projdtl-toc-item').not(`[data-proj-step="${target}"]`).removeClass('active');
                            }
                        })

                    })
                })
            }
            function projdtlThumb(data) {
                let tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: $(data.next.container).find('.projdtl-thumb'),
                        start: 'top top+=75%',
                    }
                })
                .from($(data.next.container).find('.projdtl-thumb-img'), {scale: .8, yPercent: 0, autoAlpha: 0, duration: 1, ease: gOpts.ease}, 0)
                .from($(data.next.container).find('.projdtl-thumb-img img'), {scale: 1.2, duration: .8, ease: gOpts.ease}, '<=0')
            }
            projdtlThumb(data)
            projdtlToc(data)
            function projDtlSum(data) {
                let defaultTop = $(data.next.container).find('.projdtl-intro-toggle-ph').offset().top;
                let defaultBot = $(data.next.container).find('.projdtl-cta').outerHeight() + $(data.next.container).find('.projdtl-hero.mod-bottom').outerHeight() + parseFloat($(data.next.container).find('.projdtl-testi').css('padding-bottom')) + ($(data.next.container).find('.ser-faq:visible').outerHeight() || 0);
                $(data.next.container).find('.projdtl-sum-stick-wrap').removeClass('hidden')
                gsap.set($(data.next.container).find('.projdtl-sum-stick-wrap'), {marginTop: defaultTop, marginBottom: defaultBot})
                $(data.next.container).find('.projdtl-intro-toggle').on('click', function(e) {
                    if ($(data.next.container).find('.projdtl-sum-wrap').hasClass('active')) {
                        if ($(window).width() > 991) {
                            $(data.next.container).find('.projdtl-sum-wrap').removeClass('active')
                            $(data.next.container).find('.projdtl-intro-toggle').removeClass('active')
                            lenis.start()
                        }
                        //handleCursor.show()
                    }  else {
                        $(data.next.container).find('.projdtl-sum-wrap').addClass('active')
                        $(data.next.container).find('.projdtl-intro-toggle').addClass('active')
                        lenis.stop()
                        //handleCursor.hide()
                    }
                })

                let defaultX = 0;
                let defaultY = 0;
                let targetX = defaultX;
                let targetY = defaultY;
                let cursorHeight = $(data.next.container).find('.projdtl-intro-toggle-ph').outerHeight() * .5;
                let magneticCondition = () => {
                    let xCord = pointerCurr().x >= $(data.next.container).find('.projdtl-intro-toggle-wrap').get(0).getBoundingClientRect().left - parseRem(20) && pointerCurr().x <= $(data.next.container).find('.projdtl-intro-toggle-wrap').get(0).getBoundingClientRect().left + cursorHeight * 2 + parseRem(20);
                    let yCord = pointerCurr().y >= $(data.next.container).find('.projdtl-intro-toggle-wrap').get(0).getBoundingClientRect().top - parseRem(20) && pointerCurr().y <= $(data.next.container).find('.projdtl-intro-toggle-wrap').get(0).getBoundingClientRect().top + cursorHeight * 2 + parseRem(20)
                    return xCord && yCord
                }
                function toggleMove() {
                    let cursorX = xGetter($(data.next.container).find('.projdtl-intro-toggle').get(0))
                    let cursorY = yGetter($(data.next.container).find('.projdtl-intro-toggle').get(0))
                    if ($(data.next.container).find('.projdtl-intro-toggle').hasClass('active')) {
                        if ($(data.next.container).find('.projdtl-sum:hover').length  || $('.header > *:hover').length) {
                            targetX = defaultX;
                            targetY = defaultY;
                        } else {
                            targetX = pointerCurr().x - $(data.next.container).find('.projdtl-sum-stick-inner').get(0).getBoundingClientRect().left - cursorHeight;
                            targetY = pointerCurr().y - $(data.next.container).find('.projdtl-sum-stick-inner').get(0).getBoundingClientRect().top - cursorHeight;
                        }
                    } else {
                        if (magneticCondition()) {
                            targetX = pointerCurr().x - $(data.next.container).find('.projdtl-sum-stick-inner').get(0).getBoundingClientRect().left - cursorHeight;
                            targetY = pointerCurr().y - $(data.next.container).find('.projdtl-sum-stick-inner').get(0).getBoundingClientRect().top - cursorHeight;
                        } else {
                            targetX = defaultX;
                            targetY = defaultY;
                        }
                    }
                    xSetter($(data.next.container).find('.projdtl-intro-toggle').get(0))(lerp(cursorX, targetX, 0.09))
                    ySetter($(data.next.container).find('.projdtl-intro-toggle').get(0))(lerp(cursorY, targetY, 0.09))
                    requestAnimationFrame(toggleMove)
                }
                requestAnimationFrame(toggleMove)

                ///CLose on mobile ,disable close desktop
                if ($(window).width() <= 991) {
                    $(data.next.container).find('.projdtl-sum-label-hide').on('click', function(e) {
                        $(data.next.container).find('.projdtl-sum-wrap').removeClass('active')
                        $(data.next.container).find('.projdtl-intro-toggle').removeClass('active')
                        lenis.start()
                    })
                }
            }
            projDtlSum(data)

            // Case-study FAQ: same accordion as the services pages. Opening an answer makes the page taller,
            // so the summary toggle's bottom margin is measured again once the answer has opened or closed.
            function projDtlFaq(data) {
                const container = $(data.next.container);
                const bodies = container.find('.ser-faq-item-body');
                if (!bodies.length) return;
                bodies.css('display', 'block')
                gsap.set(bodies, {height: 0, overwrite: true, marginTop: 0})
                container.find('.ser-faq-item').on('click', function(e) {
                    e.preventDefault();
                    const wasOpen = $(this).hasClass('active');
                    const open = $('.ser-faq-item.active');
                    if (open.length) {
                        gsap.to(open.find('.ser-faq-item-body'), {height: 0, duration: .6, marginTop: '0', overwrite: true})
                        open.removeClass('active')
                    }
                    if (!wasOpen) {
                        $(this).addClass('active')
                        gsap.to($(this).find('.ser-faq-item-body'), {height: 'auto', duration: .6, marginTop: '1rem', overwrite: true})
                    }
                    gsap.delayedCall(.65, () => gsap.set(container.find('.projdtl-sum-stick-wrap'), {
                        marginBottom: container.find('.projdtl-cta').outerHeight() + container.find('.projdtl-hero.mod-bottom').outerHeight() + parseFloat(container.find('.projdtl-testi').css('padding-bottom')) + (container.find('.ser-faq:visible').outerHeight() || 0)
                    }))
                })
            }
            projDtlFaq(data)

            function projdtlInfo(data) {
                const infoLabel = new SplitText($(data.next.container).find('.projdtl-info-label'), typeOpts.chars)
                const tl = gsap.timeline({
                    delay: delayTime / 2
                });
                tl
                .from(infoLabel.chars, {yPercent: 60, autoAlpha: 0, duration: .4, stagger: .02, ease: gOpts.ease}, 0)
                .from($(data.next.container).find('.projdtl-info-label-wrap .line'), {scaleX: 0, transformOrigin: 'top left', duration: 1.5, ease: gOpts.ease}, 0)

                const subWrap = $(data.next.container).find('.projdtl-info-sub-wrap');
                subWrap.each((idx, el) => {
                    const subLabel = new SplitText(el.querySelector('.projdtl-info-sub-label'), typeOpts.chars)
                    const subTxt = new SplitText(el.querySelector('.projdtl-info-sub-txt'), typeOpts.words)

                    tl
                    .from(subLabel.chars, {yPercent: 60, autoAlpha: 0, duration: .4, stagger: .02, ease: gOpts.ease}, `${.2 + .2 * idx}`)
                    .from(subTxt.words, {yPercent: 60, autoAlpha: 0, duration: .4, stagger: .02, ease: gOpts.ease}, '<=.2')
                    if ($(el).find('.projdtl-info-sub-link').length) {
                        gsap.set($(el).find('.projdtl-info-sub-link'), {overflow: "hidden"});
                        tl
                        .from($(el).find('.hover-un'), { '--line-width': '0%', duration: .4, ease: gOpts.ease}, '<=0')
                        .from($(el).find('.ic-embed'), { xPercent: -100, yPercent: 100, duration: .4, ease: gOpts.ease, clearProps: 'all'}, '<=.1')
                    }
                })
            }
            projdtlInfo(data)

            function projDtlProg(data) {
                $(data.next.container).find('.projdtl-prog-item').on('mouseover', function(e) {
                    let currIdx = $(this).index();
                    $(data.next.container).find('.projdtl-prog-imgs-item').removeClass('active')
                    $(data.next.container).find('.projdtl-prog-imgs-item').eq(currIdx).addClass('active')
                })
                $(data.next.container).find('.projdtl-prog-item').on('mouseleave', function(e) {
                    $(data.next.container).find('.projdtl-prog-imgs-item').removeClass('active')
                })

                const progItems = $(data.next.container).find('.projdtl-prog-item');
                progItems.each((idx, el) =>  {
                    const tlProjDtlProg = gsap.timeline({
                        scrollTrigger: {
                            trigger: $(data.next.container).find('.projdtl-prog'),
                            start: 'top top+=65%',
                        }
                    });
                    if (idx == 0) {
                        tlProjDtlProg
                        .from($(data.next.container).find('.projdtl-prog-wrap'), {autoAlpha: 0, duration: .6, y: parseRem(40), ease: 'power1.out'})
                    }
                    if ($(window).width() >= 768) {
                        const itemLabel = new SplitText($(el).find('.projdtl-prog-item-label'), typeOpts.chars);
                        tlProjDtlProg
                        .from(itemLabel.chars, {
                            onComplete: () => {itemLabel.revert()},
                            yPercent: 60, autoAlpha: 0, duration: .5, stagger: .03, ease: gOpts.ease
                        }, `${.4 + idx * .2}`)
                    }
                    tlProjDtlProg
                    .from($(el).find('.projdtl-prog-item-line'), {scaleY: 0, transformOrigin: 'top', duration: .8, ease: 'power1.out'}, '<=.1')

                    if ($(window).width() >= 768) {
                        const itemTitle = new SplitText($(el).find('.projdtl-prog-item-title'), typeOpts.words);
                        tlProjDtlProg
                        .from(itemTitle.words, {yPercent: 60, autoAlpha: 0, duration: .5, stagger: .02, ease: gOpts.ease}, '<=.1')
                    }
                })
            }
            projDtlProg(data)

            function projdtlIntro(data) {
                const introMain = $(data.next.container).find('.projdtl-intro .projdtl-intro-main')
                const introMainTxt = new SplitText(introMain.find('.projdtl-intro-main-txt:not(.w-condition-invisible)'), typeOpts.chars);

                if ($(window).width() >= 768) {
                    const introMainLabel = new SplitText(introMain.find('.projdtl-intro-label'), typeOpts.chars);
                    let tlIntroMain = gsap.timeline({
                        scrollTrigger: {
                            trigger: $(data.next.container).find('.projdtl-intro'),
                            start: 'top top+=75%',
                        },
                        onComplete: () => {
                            introMainLabel.revert()
                        }
                    })

                    tlIntroMain
                    .from(introMainLabel.chars, {yPercent: 60, autoAlpha: 0, duration: .4, stagger: .02, ease: gOpts.ease}, 0)
                    .from(introMain.find('.line'), {scaleX: 0, transformOrigin: 'left', duration: .8, ease: gOpts.ease}, "<=.2")
                    .from(introMainTxt.words, {yPercent: 60, autoAlpha: 0, duration: .6, stagger: .02, ease: gOpts.ease}, '<=.2')
                    .fromTo($(data.next.container).find('.projdtl-intro-toggle'), {scale: .8, autoAlpha: 0}, {scale: 1, autoAlpha: 1, duration: .6, ease: gOpts.ease, clearProps: 'all'}, '>=-.2')

                    const introNews = $(data.next.container).find('.projdtl-intro .projdtl-intro-news');
                    const introNewsLabel = new SplitText(introNews.find('.projdtl-intro-label'), typeOpts.chars);
                    const introNewsLinks = $(data.next.container).find('.projdtl-intro-news-link');

                    let tlIntroNews = gsap.timeline({
                        scrollTrigger: {
                            trigger: $(data.next.container).find('.projdtl-intro'),
                            start: 'top top+=65%',
                        },
                        onComplete: () => {
                            introNewsLabel.revert()
                        }
                    })

                    tlIntroNews
                    .from(introNewsLabel.chars, {yPercent: 60, autoAlpha: 0, duration: .4, stagger: .02, ease: gOpts.ease}, 0)
                    .from(introNews.find('.line'), {scaleX: 0, transformOrigin: 'left', duration: .8, ease: gOpts.ease}, "<=.2")

                    introNewsLinks.each((idx, el) => {
                        const newsLink = new SplitText($(el).find('.projdtl-info-sub-txt'), typeOpts.words);
                        gsap.set(el, {overflow: "hidden"});
                        tlIntroNews
                        .from(newsLink.words, {yPercent: 60, autoAlpha: 0, duration: .4, stagger: .02, ease: gOpts.ease}, `${0 + .2 * idx}`)
                        .from($(el).find('.ic-embed'), { xPercent: -100, yPercent: 100, duration: .4, ease: gOpts.ease, clearProps: 'all'}, '>=-.4')
                    })
                }

                let tlIntroMainScrub = gsap.timeline({
                    scrollTrigger: {
                        trigger: $(data.next.container).find('.projdtl-intro-main-txt'),
                        start: 'top+=25% bottom',
                        end: '-25% top',
                        scrub: .4,
                    }
                })
                tlIntroMainScrub
                .from(introMainTxt.chars, {color: '#C1C1C1', duration: .2, stagger: 0.008, ease: 'power1.out'})
            }
            projdtlIntro(data)

            updateImgGrid(data, '.projdtl-brand-img-grid', $(data.next.container).find('.hidden-el').find('.projdtl-brand-img-info').eq(0).clone())

            function projdtlBrand(data) {
                const projdtlTxt =  $(data.next.container).find('.projdtl-brand');

                projdtlTxt.each((idx, el) => {
                    if ($(el).hasClass('w-condition-invisible')) {
                        return;
                    } else {
                        const label = new SplitText($(el).find('.projdtl-intro-label'), typeOpts.chars)
                        const title = new SplitText($(el).find('.projdtl-brand-title'), typeOpts.words)
                        let tlTxt = gsap.timeline({
                            scrollTrigger: {
                                trigger: el,
                                start: 'top top+=65%',
                            },
                            onComplete: () => {
                                label.revert()
                                title.revert()
                            }
                        })
                        tlTxt
                        .from(label.chars, {yPercent: 60, autoAlpha: 0, duration: .4, stagger: .02, ease: gOpts.ease})
                        .from($(el).find('.line'), {scaleX: 0, transformOrigin: ' left', duration: .8, ease: gOpts.ease}, '<=.2')
                        .from(title.words, {yPercent: 60, autoAlpha: 0, duration: .4, stagger: .02, ease: gOpts.ease}, '<=.2')

                        let richTxt = $(el).find('.projdtl-brand-rictxt p');
                        richTxt.each((idx, el) => {
                            // CSS hides <br> in this rich text, but 3.13+ still starts a new line at each one
                            $(el).find('br').filter((i, br) => getComputedStyle(br).display === 'none').remove()
                            const richTxtInner = new SplitText(el, typeOpts.words)
                            tlTxt
                            .from(richTxtInner.words, {
                                onComplete: () => {richTxtInner.revert()},
                                yPercent: 60, autoAlpha: 0, duration: .3, stagger: .01, ease: gOpts.ease
                            }, `${.4 + .2 * idx}`)
                        })
                        const projdtlImg = $(el).find('.projdtl-brand-img-grid').children();
                        projdtlImg.each((idx, el) => {
                            let tlImgs = gsap.timeline({
                                scrollTrigger: {
                                    trigger: el,
                                    start: 'top top+=85%',
                                }
                            })
                            requestAnimationFrame(() => {
                                tlImgs
                                .from(el, {scale: .8, autoAlpha: 0, transformOrigin: 'center center', duration: .8, ease: gOpts.ease})
                            })
                        })
                    }
                })
            }
            projdtlBrand(data)

            function projdtlClientTesti(data) {
                const parent = $(data.next.container).find('.projdtl-testi');
                // Split the quote once: 3.13+ reverts an earlier split when the same element is split again
                const testiMainParaColor = new SplitText(parent.find('.projdtl-testi-main-txt'), typeOpts.chars)
                if ($(window).width() >= 768) {
                    const labelTesti = new SplitText(parent.find('.projdtl-intro-label'), typeOpts.chars);
                    const clientName = new SplitText(parent.find('.projdtl-testi-client-name'), typeOpts.chars);
                    const clientJob = new SplitText(parent.find('.projdtl-testi-client-job'), typeOpts.words);
                    const testiMainPara = testiMainParaColor

                    let tl = gsap.timeline({
                        scrollTrigger: {
                            trigger: $(data.next.container).find('.projdtl-testi'),
                            start: 'top top+=65%',
                        }
                    })

                    tl
                    .from(labelTesti.chars, {yPercent: 60, autoAlpha: 0, duration: .4, stagger: .015, ease: gOpts.ease})
                    .from(parent.find('.line'), {scaleX: 0, transformOrigin: 'left', duration: .8, ease: 'power1.out'}, '<=.2')
                    .from(testiMainPara.words, {yPercent: 60, autoAlpha: 0, duration: .4, stagger: .015, ease: gOpts.ease}, '<=.2')
                    .from(clientName.chars, {yPercent: 60, autoAlpha: 0, duration: .4, stagger: .015, ease: gOpts.ease}, '<=0')
                    .from(clientJob.words, {yPercent: 60, autoAlpha: 0, duration: .4, stagger: .015, ease: gOpts.ease}, '<=.2')
                }

                let colorTl = gsap.timeline({
                    scrollTrigger: {
                        trigger: $(data.next.container).find('.projdtl-testi-main-txt'),
                        start: 'top+=25% bottom',
                        end: '-25% top',
                        scrub: .4,
                    }
                })
                colorTl
                .from(testiMainParaColor.chars , {color: '#C1C1C1', duration: .2, stagger: 0.08, ease: 'power1.out'})
            }
            projdtlClientTesti(data)
            function imgTestiMouseMove(data) {
                const wrapper = $(data.next.container).get(0).querySelector('.projdtl-testi .projdtl-testi-main-wrap');
                const target = wrapper.querySelector('.projdtl-testi-cursor');
                function mouseInit() {
                    if ($(wrapper).is(':hover')) {
                        $(target).addClass('hovering');
                    } else {
                        $(target).removeClass('hovering')
                    }
                    imgX = xGetter(target);
                    imgY = yGetter(target);
                    imgRotX = rotXGetter(target);
                    imgRotY = rotYGetter(target);
                    imgRotZ = rotZGetter(target);
                    targetX = ((pointerCurr().x - $(wrapper).offset().left)/$(wrapper).width()) * $(wrapper).width();
                    targetY = (pointerCurr().y - wrapper.getBoundingClientRect().top)/$(wrapper).height() * ($(wrapper).height() - $(target).height());

                    xSetter(target)(lerp(imgX, targetX, 0.05))
                    ySetter(target)(lerp(imgY, targetY, 0.05))
                    rotZSetter(target)(Math.min(Math.max(lerp(imgRotZ, -1 * (targetX - imgX)/20, .05), -15), 15))
                    requestAnimationFrame(mouseInit)
                }
                requestAnimationFrame(mouseInit)
            }
            imgTestiMouseMove(data)
        },
        beforeLeave() {
        },
    }
    SCRIPT.serviceScript = {
        namespace: 'service',
        afterEnter(data) {
            function SerMarquee(data) {
                ScrollTrigger.create({
                    trigger: '.ser-marquee',
                    start: 'top bottom',
                    once: true,
                    onEnter: () => {
                        let cloneItem = $(data.next.container).find('.ser-marquee-item').eq(0).clone();
                        let cloneTime = Math.ceil($(data.next.container).find('.ser-marquee-inner').width() / $(data.next.container).find('.ser-marquee-item').width()) + 1;
                        for (let i = 0; i < cloneTime; i++) {
                            // copies are decoration, so hide them from screen readers and agents (the item holds the page's H1)
                            cloneItem.clone().attr('aria-hidden', 'true').appendTo($(data.next.container).find('.ser-marquee-inner'))
                        }
                        let tlDur = 30;
                        let tlMarquee = gsap.timeline({
                            repeat: -1,
                        })
                        tlMarquee
                        .to($(data.next.container).find('.ser-marquee .ser-marquee-item'), {xPercent: -100, duration: tlDur,  ease: 'none'})

                    }
                })
            }
            SerMarquee(data)
            function serHero(data) {
                if ($(window).width() >= 768) {
                    const titleTxt = new SplitText($(data.next.container).find('.ser-hero-title'), typeOpts.words)
                    const subTxt = new SplitText($(data.next.container).find('.ser-client-sub'), typeOpts.words)
                    let tl = gsap.timeline({
                        scrollTrigger: {
                            trigger: $(data.next.container).find('.ser-hero-title'),
                            start: 'top bottom',
                        },
                        onComplete: () => {
                            titleTxt.revert()
                            subTxt.revert()
                        },
                        delay: .2
                    })
                    tl
                    .from(titleTxt.words, {yPercent: 70, autoAlpha: 0, stagger: 0.012, duration: .4, ease: gOpts.ease}, 0)
                    .from(subTxt.words, {yPercent: 70, autoAlpha: 0, stagger: 0.01, duration: .4, ease: gOpts.ease}, '<=.5')
                }


                let slidePagiItem = $(data.next.container).find('.ser-reel-prog-item').eq(0).clone();
                let slideItems = $(data.next.container).find('.ser-reel-item')
                slideItems.each((idx, el) => {
                    let html = slidePagiItem.clone();
                    if (idx != 0) {
                        html.appendTo($(data.next.container).find('.ser-reel-prog-main'))
                    }
                })
                let imgHeroSwiper = new Swiper($(data.next.container).find('.ser-reel-cms').get(0), {
                    slidesPerView: 1,
                    effect: 'fade',
                    fadeEffect: {
                      crossFade: true
                    },
                    loop: true,
                    autoplay: {
                        delay: 4000,
                        disableOnInteraction: false,
                    },
                })
                imgHeroSwiper.on('realIndexChange', function (swiper) {
                    activeCurrentPagi(swiper.realIndex)
                    // gsap.set($(data.next.container).find('.ser-reel-prog-item .ser-reel-prog-item-inner'), {opacity})
                    // gsap.fromTo($(data.next.container).find('.ser-reel-prog-inner'), {'--currProg': '0deg'}, {'--currProg': '360deg', overwrite: true, duration: 3, ease: 'none'})
                });
                function activeCurrentPagi(currIdx) {
                    $(data.next.container).find('.ser-reel-prog-item').each((idx,el) => {
                        if (idx == currIdx) {
                            gsap.set($(el).find('.ser-reel-prog-item-inner'), {width: '0%'})
                            gsap.to($(el).find('.ser-reel-prog-item-inner'), {width: '100%', duration: 4});
                        } else if (idx < currIdx) {
                            gsap.set($(el).find('.ser-reel-prog-item-inner'), {width: '100%', overwrite: true})
                        } else {
                            gsap.set($(el).find('.ser-reel-prog-item-inner'), {width: '0%', overwrite: true})
                        }
                    })

                }

                let imgHerotl = gsap.timeline({
                    scrollTrigger: {
                        trigger: '.ser-reel',
                        start: 'top top+=85%',
                    }
                })
                imgHerotl
                .from($(data.next.container).find('.ser-reel-cms'), {scale: .8, yPercent: 0, autoAlpha: 0, duration: 1, ease: gOpts.ease}, 0)
                .from($(data.next.container).find('.ser-reel-item img'), {scale: 1.2, duration: .8, ease: gOpts.ease}, '<=0')
                .from($(data.next.container).find('.ser-reel-prog'), {scale: .8, yPercent: 0, autoAlpha: 0, duration: 1, ease: gOpts.ease}, '<=0')
            }
            serHero(data)
            function serAbt(data) {
                if ($(window).width() >= 768) {
                    const subTxt = new SplitText($(data.next.container).find('.ser-abt-sub'), typeOpts.words)
                    const titleTxt = new SplitText($(data.next.container).find('.ser-abt-title'), typeOpts.words)
                    let tl = gsap.timeline({
                        scrollTrigger: {
                          trigger: $(data.next.container).find('.ser-abt'),
                          start: 'top top+=65%',
                        },
                        onComplete: () => {
                            subTxt.revert()
                            titleTxt.revert()
                        }
                    });
                    tl
                    .from(subTxt.words, {yPercent: 60, autoAlpha: 0, stagger: .02, duration: .4, ease: gOpts.ease}, 0)
                    .from(titleTxt.words, {yPercent: 60, autoAlpha: 0, stagger: .04, duration: .4, ease: gOpts.ease}, '<=.1')
                }
            }
            serAbt(data)
            function serClient(data) {
                ScrollTrigger.create({
                    trigger: $(data.next.container).find('.ser-client'),
                    start: 'top bottom',
                    once: true,
                    onEnter: () => {
                        let cloneItem = $(data.next.container).find('.ser-client-marquee-cms').eq(0).clone();
                        let cloneTime = Math.ceil($(data.next.container).find('.ser-client-marquee-wrap').width() / $(data.next.container).find('.ser-client-marquee-cms').width());
                        for (let i = 0; i < cloneTime; i++) {
                            cloneItem.clone().appendTo($(data.next.container).find('.ser-client-marquee-wrap'))
                        }
                        let speed;
                        if ($(window).width() > 767) {
                            speed = 90;
                        } else {
                            speed = 45;
                        }
                        let tlDur = Math.floor($(data.next.container).find('.ser-client-marquee-cms').eq(0).width() / speed)
                        requestAnimationFrame(() => {
                            $(data.next.container).find('.ser-client-marquee-cms').css('--marqueeDur', `${tlDur}s`)
                            requestAnimationFrame(() => {
                                $(data.next.container).find('.ser-client-marquee-cms').addClass('anim')
                            })
                        })
                        // let tlMarquee = gsap.timeline({
                        //     repeat: -1,
                        //     onUpdate: () => {
                        //         if ($(window).width() > 767) {
                        //             let tlDir = lenis.direction >= 0 ? 1 : -1;
                        //             gsap.to(tlMarquee, {timeScale: tlDir * Math.min(Math.max(lenis.velocity/2, 1), 4), duration: .1, ease: 'none'})
                        //         }
                        //     }
                        // })
                        // tlMarquee
                        // .to($(data.next.container).find('.ser-client .ser-client-marquee-cms'), {xPercent: -100, duration: tlDur,  ease: 'none'})
                        // tlMarquee.seek(28800)
                    }
                })
            }
            serClient(data)
            function serFeaLottie(data) {
                ScrollTrigger.create({
                    trigger: '.ser-fea',
                    start: 'top bottom',
                    once: true,
                    onEnter: () => {
                        let allLotties
                        if ($(window).width() > 767) {
                            allLotties = $(data.next.container).find('.ser-fea-imgs-item.force-1-1').find('dotlottie-player');
                        } else {
                            allLotties = $(data.next.container).find('.ser-fea-imgs-item.ser-fea-imgs-item-mobile').find('dotlottie-player');
                        }
                        console.log(allLotties)
                        if ($(window).width() >= 768) {
                            allLotties.attr('autoplay', 'true')
                        }
                        requestAnimationFrame(() => {
                            allLotties.each(function(idx, el) {
                                let src = $(el).attr('data-srcUrl')
                                $(el).get(0).load(src).then((e) => {
                                    $(el).get(0).play()
                                })
                                // $(data.next.container).find('.ser-fea-imgs-item.force-1-1').addClass('active')
                                // // $(data.next.container).find('.ser-fea-imgs-item.force-1-1').eq(1).addClass('active')
                                // $(el).get(0).addEventListener('frame', function(e) {
                                //     let state = $(this).closest('.ser-fea-lottie').attr('data-state');
                                //     if (state == 'start') {
                                //         if (e.detail.frame > 105) {
                                //             $(el).get(0).seek('0')
                                //         }
                                //     } else if ( state == 'loop') {
                                //         if (e.detail.frame > 200) {
                                //             $(el).get(0).seek('105')
                                //         }
                                //     } else if (state == 'end') {
                                //         if (e.detail.frame > 299) {
                                //             $(el).get(0).seek('200')
                                //         }
                                //     }
                                // })
                                $(el).get(0).addEventListener('frame', function(e) {
                                    if (e.detail.frame > 200) {
                                        $(el).get(0).seek('105')
                                    }
                                })
                            })
                        })
                    }
                })
            }
            serFeaLottie(data)
            function serFea(data) {
                let allItems = $(data.next.container).find('.ser-fea-item-label');
                allItems.each((idx, el) => {
                    $(el).text(idx + 1)
                })
                $(data.next.container).find('.ser-fea-imgs-item').eq(0).addClass('active')
                if ($(window).width() > 767) {
                    // let tl = gsap.timeline({
                    //     scrollTrigger: {
                    //         trigger: $(data.next.container).find('.ser-fea-main'),
                    //         start: 'top top',
                    //         end: 'bottom bottom',
                    //         markers: true,
                    //         onUpdate: (self) => {
                    //             if (self.progress <= .33) {
                    //                 currIdx = 0
                    //             } else if ( self.progress <= .66) {
                    //                 currIdx = 1
                    //             } else {
                    //                 currIdx = 2
                    //             }
                    //             //activeIndex($(data.next.container).find('.ser-fea-imgs-item'),currIdx)
                    //             activeSerFeaIdx($(data.next.container).find('.ser-fea-imgs-item').find('dotlottie-player'), currIdx)
                    //         }
                    //     }
                    // })
                    let items = $(data.next.container).find('.ser-fea-main-item');
                    items.each((idx, el) => {
                        let tl = gsap.timeline({
                            scrollTrigger: {
                                trigger: el,
                                start: 'top top+=50%',
                                end: 'bottom top+=50%',
                                onEnter: () => {
                                    activeSerFeaIdx($(data.next.container).find('.ser-fea-imgs-item'),$(el).index())
                                },
                                onEnterBack: () => {
                                    activeSerFeaIdx($(data.next.container).find('.ser-fea-imgs-item'),$(el).index())
                                }
                            }
                        })
                    })

                    function activeSerFeaIdx(list, currIdx) {
                        $(list).removeClass('active')
                        $(list).eq(currIdx).addClass('active')
                    }
                }
            }
            serFea(data)

            function serProg(data) {
                if ($(window).width() >= 768) {
                    const titleTxt = new SplitText($(data.next.container).find('.ser-prog-title'), typeOpts.words)
                    const subTxt = new SplitText($(data.next.container).find('.ser-prog-sub'), typeOpts.words)

                    let txtTl = gsap.timeline({
                        scrollTrigger: {
                            trigger: $(data.next.container).find('.ser-prog'),
                            start: 'top top+=65%',
                        },
                        onComplete: () => {
                            subTxt.revert()
                            titleTxt.revert()
                        }
                    })
                    txtTl
                    .from(titleTxt.words, {yPercent: 60, autoAlpha: 0, stagger: .02, duration: .4, ease: gOpts.ease}, 0)
                    .from(subTxt.words, {yPercent: 80, autoAlpha: 0, stagger: .01, duration: .4, ease: gOpts.ease}, '<=.1')
                    .from($(data.next.container).find('.ser-prog-btn'), {width: 0, duration: .8, ease: 'power2.out'}, .3)
                    .from($(data.next.container).find('.ser-prog-btn'), {autoAlpha: 0, duration: .6, ease: gOpts.ease}, '<=.2')
                }
                if ($(window).width() >= 992) {
                    let offwidth = $(data.next.container).find('.ser-prog-item').width();
                    let offmargin = Math.abs(parseFloat($(data.next.container).find('.ser-prog-item').eq(0).css('margin-right')))
                    let tl = gsap.timeline({
                        scrollTrigger: {
                            trigger: $(data.next.container).find('.ser-prog-cms'),
                            start: 'top top+=65%',
                        }
                    })
                    tl
                    .from($(data.next.container).find('.ser-prog-item:nth-child(1)'), {x: `${1.5 * offwidth - 3 * offmargin}`, duration: 1.2, ease: 'power2.inOut'})
                    .from($(data.next.container).find('.ser-prog-item:nth-child(2)'), {x: `${.5 * offwidth - 1 * offmargin}`, duration: 1.2, ease: 'power2.inOut'}, '<=0')
                    .from($(data.next.container).find('.ser-prog-item:nth-child(3)'), {x: `${-1 * (.5 * offwidth - 1 * offmargin)}`, duration: 1.2, ease: 'power2.inOut'}, '<=0')
                    .from($(data.next.container).find('.ser-prog-item:nth-child(4)'), {x: `${-1 * (1.5 * offwidth - 3 * offmargin)}`, duration: 1.2, ease: 'power2.inOut'}, '<=0')

                    .from($(data.next.container).find('.ser-prog-list'), {scale: .9, duration: 1.2, autoAlpha: 0}, '<=0')
                    .from($(data.next.container).find('.ser-prog-item-inner'), {backgroundColor: 'rgba(242, 240, 248, 1)', duration: 1}, '<=.2')
                } else if ($(window).width() >= 768) {
                    $(data.next.container).find('.ser-prog-item').each((idx, el) => {
                        $(el).on('click', function(e) {
                            e.preventDefault()
                            if (!$(el).hasClass('active')) {
                                $(el).addClass('active')
                            } else {
                                $(data.next.container).find('.ser-prog-item').removeClass('active')
                            }
                        })
                    })
                } else {
                    let parent = $(data.next.container).find('.ser-prog-cms[data-swiper="swiper"]')
                    parent.addClass('swiper')
                    let wrapper = parent.find('[data-swiper="wrapper"]')
                    wrapper.addClass('swiper-wrapper')
                    let slides = parent.find('[data-swiper="slide"]')
                    slides.addClass('swiper-slide')

                    const progSwiper = new Swiper(parent.get(0), {
                        slidesPerView: 1,
                        speed: 600,
                        scrollbar: {
                            el: '.ser-prog-nav',
                        },
                    })
                }
            }
            serProg(data)
            updateComingSoon(data, '.ser-proj-item')
            updateProjSumPopup(data)
            function updateSerProjUrl(data) {
                let thisPage = $(data.next.container).find('[data-thumb-page]').attr('data-thumb-page')
                let scIdx;
                if (thisPage == 'branding') {scIdx = 3}
                else if (thisPage == 'design-system') {scIdx = 6}
                else if (thisPage == 'product-design') {scIdx = 5}
                else if (thisPage == 'website-design') {scIdx = 4}
                console.log(scIdx)
                let allProjLinks = $(data.next.container).find('[data-change-url]')
                allProjLinks.each((idx, el) => {
                    let newUrl = $(el).attr('href')
                    $(el).attr('href', `${newUrl}#sc${scIdx}`)
                })
            }
            updateSerProjUrl(data)
            function updateThumbnail(data) {
                let thisPage = $(data.next.container).find('[data-thumb-page]').attr('data-thumb-page')
                let allThumbs = $(data.next.container).find('.ser-proj-thumb');
                allThumbs.each((idx, el) => {
                    $(el).find('img').each((idx, el) => {{
                        if ($(el).attr('data-thumb') == thisPage && !$(el).hasClass('w-dyn-bind-empty')) {
                            let imgSrc = $(el).attr('src')
                            let mainThumb = $(el).closest('.ser-proj-thumb').find('[data-thumb-main]')
                            mainThumb.attr('src', `${imgSrc}`)
                        }
                    }})
                    $(el).find('img[data-thumb]').remove()
                })
            }
            updateThumbnail(data)
            function serProjComingSummary(data, thumb, item) {
                $(`${thumb}[data-cursor="soon"]`).on('click', function(e) {
                    e.preventDefault();
                    $(data.next.container).find('.projdtl-sum-wrap.active').removeClass('active')
                    let target = $(this).closest(item).index()
                    let targetName = $(this).attr('data-proj-name')
                    $(data.next.container).find(`.projdtl-sum-wrap[data-proj-name="${targetName}"]`).addClass('active')
                    lenis.stop()
                })
                $(data.next.container).find('.projdtl-sum-wrap-cms').find('.projdtl-sum-label-hide').on('click', function(e) {
                    e.preventDefault()
                    $(data.next.container).find('.projdtl-sum-wrap.active').removeClass('active')
                    lenis.start()
                })
            }
            serProjComingSummary(data, '.ser-proj-thumb', '.ser-proj-item');
            function serProj(data) {
                ScrollTrigger.create({
                    trigger: $(data.next.container).find('.ser-proj'),
                    start: 'top bottom',
                    once: true,
                    onEnter: () => {
                        if ( $(window).width() > 767) {
                            let speed = 2
                            let offsetTop = $('.header-top').height() + (($(window).height() - $('.ser-proj-sticky').height() - $('.header-top').height()) / 2);
                            let distance = ($('.ser-proj-list').width() - $('.ser-proj-cms').width() + parseFloat($('.container').css('padding-right')));

                            let height = speed * distance
                            gsap.set('.ser-proj-sticky', {
                                top: offsetTop
                            })
                            gsap.set('.ser-proj-wrap', {height: height})
                            let tl = gsap.timeline({
                                scrollTrigger: {
                                    trigger: '.ser-proj-wrap',
                                    start: `top top+=${offsetTop}`,
                                    end: `bottom bottom-=${offsetTop}`,
                                    scrub: .2,
                                }
                            })
                            tl.to('.ser-proj-list', {x: - distance, ease: 'none'})
                        }
                        if ($(window).width() > 991) {
                            headerProgTl.scrollTrigger.refresh()
                        }
                        $(window).trigger('resize')
                    }
                })
            }
            serProj(data)
            function serQuote(data) {
                ScrollTrigger.create({
                    trigger: $(data.next.container).find('.ser-quote'),
                    start: 'top bottom',
                    once: true,
                    onEnter: () => {
                        const qteTxt = new SplitText($(data.next.container).find('.ser-quote-title'), typeOpts.chars);

                        if ($(window).width() >= 768) {
                            let tl = gsap.timeline({
                                scrollTrigger: {
                                    trigger: $(data.next.container).find('.ser-quote'),
                                    start: 'top top+=65%',
                                }
                            })
                            tl
                            .from(qteTxt.words, {yPercent: 60, autoAlpha: 0, stagger: .01, duration: .4, ease: gOpts.ease})
                        }
                        let tlScrub = gsap.timeline({
                            scrollTrigger: {
                                trigger: $(data.next.container).find('.ser-quote'),
                                start: 'top top+=65%',
                                end: 'bottom top+=25%',
                                scrub: .1,
                            }
                        })
                        tlScrub
                        .from(qteTxt.chars, {color: '#C1C1C1', stagger: .05})
                    }
                })

            }
            serQuote(data)
            function serTesti(data) {
                if ($(window).width() >= 768) {
                    const parent = $(data.next.container).find('.ser-testi')
                    let linkItem = parent.find('.ser-testi-sub-item')
                    let linkInner = parent.find('.ser-testi-sub-item-inner');
                    let lineInner = parent.find('.ser-testi-sub-list .line.ser-testi-sub-line-inner')
                    let listMain = parent.find('.ser-testi-main-item')

                    function nextIndex(currIdx) {
                        if (currIdx < linkItem.length - 1) {
                            currIdx = currIdx + 1
                        } else {
                            currIdx = 0
                        }
                        toggleActive(currIdx)
                    }
                    function toggleActive(idx) {
                        activeIndex(linkItem, idx);
                        activeIndex(listMain, idx);
                        progressTesti(idx);
                    }
                    linkInner.on('click', function(e) {
                        e.preventDefault();
                        let idx = $(this).closest('.ser-testi-sub-item').index();
                        currIdx = idx;
                        toggleActive(currIdx)
                    })
                    function progressTesti(currIdx) {
                        gsap.to(lineInner.not(`:eq(${currIdx})`), {scaleX: 0, transformOrigin: 'right', duration: .3, ease: 'sine.out', overwrite: true})
                        gsap.set(lineInner.eq(currIdx), {scaleX: 0, transformOrigin: 'left', overwrite: true})
                        gsap.to(lineInner.eq(currIdx), {scaleX: 1, duration: 3, ease: 'sine.out', overwrite: true, onComplete: () => {
                            nextIndex(currIdx)
                        }}, '<=0')
                    }
                    progressTesti(0)

                    let thumbItems = $(data.next.container).find('.ser-testi-thumb-item')
                    let richTxt = $(data.next.container).find('.ser-testi-item-content-txt')

                    richTxt.on('mouseenter', function(e) {
                        e.preventDefault()
                        activeIndex(thumbItems, $(this).closest('.ser-testi-main-item').index())
                    })
                    richTxt.on('mouseleave', function(e) {
                        e.preventDefault()
                        thumbItems.removeClass('active')
                    })
                    function initThumbMove() {
                        let wrap = $(data.next.container).find('.ser-testi-thumb-wrap')
                        let target = $(data.next.container).find('.ser-testi-thumb-cms')
                        let xThumb = xGetter(target.get(0))
                        let yThumb = yGetter(target.get(0))
                        let rotzThumb = rotZGetter(target.get(0))
                        if ($('.ser-testi:hover').length) {
                            let moveX = (pointerCurr().x - wrap.get(0).getBoundingClientRect().left)/(wrap.width()) * (wrap.width())
                            let moveY = (pointerCurr().y - wrap.get(0).getBoundingClientRect().top)/(wrap.height()) * (wrap.height())
                            xSetter(target.get(0))(lerp(xThumb, moveX, 0.05))
                            ySetter(target.get(0))(lerp(yThumb, moveY, 0.05))
                            rotZSetter(target.get(0))(Math.min(Math.max((lerp(rotzThumb, (moveX - xThumb)/40, .05)), -12), 12))
                        }
                        requestAnimationFrame(initThumbMove)
                    }
                    requestAnimationFrame(initThumbMove)
                } else {
                    const items = $('.ser-testi-sub-item')
                    items.on('click', function(e) {
                        e.preventDefault()
                        if (!$(this).closest('.ser-testi-sub-item').hasClass('active')) {
                            $('.ser-testi-accord-body').slideUp()
                            $(this).find('.ser-testi-accord-body').slideDown()
                            items.removeClass('active')
                            $(this).addClass('active')
                        } else {
                            $(this).find('.ser-testi-accord-body').slideUp()
                            items.removeClass('active')
                        }
                    })
                }

            }
            serTesti(data)
            function serWhy(data) {
                // $(data.next.container).find('.ser-why-item').on('mouseover', function(e) {
                //     let currIdx = $(this).index();
                //     $(data.next.container).find('.ser-why-imgs-item').removeClass('active')
                //     $(data.next.container).find('.ser-why-imgs-item').eq(currIdx).addClass('active')
                // })
                // $(data.next.container).find('.ser-why-item').on('mouseleave', function(e) {
                //     $('.ser-why-imgs-item').removeClass('active')
                // })

                if ($(window).width() >= 768) {
                    const serProjItems = $(data.next.container).find('.ser-why-item');
                    serProjItems.each((idx, el) =>  {
                        const itemLabel = new SplitText($(el).find('.ser-why-item-label'), typeOpts.chars);
                        const itemTitle = new SplitText($(el).find('.ser-why-item-title'), typeOpts.words);
                        const itemSub = new SplitText($(el).find('.ser-why-item-sub'), typeOpts.words);
                        const tlSerProj = gsap.timeline({
                            scrollTrigger: {
                                trigger: '.ser-why-list',
                                start: 'top top+=65%',
                            },
                            onComplete: () => {
                                itemLabel.revert()
                                itemTitle.revert()
                                itemSub.revert()
                            },
                            delay: delayTime
                        });
                        tlSerProj
                        .from(itemLabel.chars, {yPercent: 60, autoAlpha: 0, duration: .5, stagger: .03, ease: gOpts.ease}, `${0 + idx * .2}`)
                        .from($(el).find('.projdtl-prog-item-line'), {scaleY: 0, transformOrigin: 'top', duration: .8, ease: 'power1.out'}, '<=.1')
                        .from(itemTitle.words, {yPercent: 60, autoAlpha: 0, duration: .5, stagger: .02, ease: gOpts.ease}, '<=.1')
                        //.from(itemSub.words, {yPercent: 60, autoAlpha: 0, duration: .4, stagger: .006, ease: gOpts.ease}, '<=.2')
                    })
                }

            }
            serWhy(data)
            function serFaq(data) {
                $(data.next.container).find('.ser-faq-item-body').css('display','block')
                gsap.set($(data.next.container).find('.ser-faq-item').find('.ser-faq-item-body'),{height: 0, overwrite: true, marginTop: 0})
                $(data.next.container).find('.ser-faq-item').on('click', function(e) {
                    e.preventDefault();
                    if ($(this).hasClass('active')) {
                        gsap.to($('.ser-faq-item.active').find('.ser-faq-item-body'),{height: 0, duration: .6, marginTop: '0', overwrite: true})
                        $('.ser-faq-item').removeClass('active')
                    } else {
                        if ($('.ser-faq-item.active').length >= 1) {
                            gsap.to($('.ser-faq-item.active').find('.ser-faq-item-body'),{height: 0, duration: .6, marginTop: '0', overwrite: true})
                            $('.ser-faq-item').removeClass('active')
                        }
                        $(this).addClass('active')
                        gsap.to($(this).find('.ser-faq-item-body'), {height: 'auto', duration: .6, marginTop: '1rem', overwrite: true})
                    }
                })
            }
            serFaq(data)
        },
        beforeLeave() {
        },
    }
    SCRIPT.projListScript = {
        namespace: 'projList',
        afterEnter(data) {
            console.log('enter projList')
            updateComingSoon(data, '.projlist-main-item')
            updateProjSumPopup(data)

            function projListComingSummary(data, thumb, item) {
                $(`${thumb}[data-cursor="soon"]`).on('click', function(e) {
                    e.preventDefault();
                    $(data.next.container).find('.projdtl-sum-wrap.active').removeClass('active')
                    let targetName = $(this).attr('data-proj-name')
                    $(data.next.container).find(`.projdtl-sum-wrap[data-proj-name="${targetName}"]`).addClass('active')
                    lenis.stop()
                })
                $(data.next.container).find('.projdtl-sum-wrap-cms').find('.projdtl-sum-label-hide').on('click', function(e) {
                    e.preventDefault()
                    $(data.next.container).find('.projdtl-sum-wrap.active').removeClass('active')
                    lenis.start()
                })
            }
            projListComingSummary(data, '.projlist-main-item-thumb', '.projlist-main-item');
            function projListUpdateServices(data) {
                let allItems = $(data.next.container).find('.projlist-main-item');
                let allType = $(data.next.container).find('.projlist-filter-item-link');
                allType.eq(0).find('.projlist-filter-item-count').text(allItems.length < 10 ? `0${allItems.length}` : allItems.length)
                allItems.each((idx, el) => {
                    if (idx != -1) {
                        let url = window.location.origin + $(el).find('[data-filter-ser]').attr('href');
                        fetch(url).then((res) => {
                            return res.text()
                        })
                        .then((html) => {
                            let serList = '';
                            $(html).find('.fetch-ser-list .w-dyn-item').each((idx, el) => serList += ` ${$(el).text()}`)
                            $(el).find('[data-filter-ser]').text(serList.trim())
                            allType.each((idx, el) => {
                                if (serList.trim().includes($(el).attr('data-filter'))) {
                                    let curCount = Number($(el).find('.projlist-filter-item-count').text())
                                    curCount++;
                                    let newCount = curCount < 10 ? `0${curCount}` : curCount
                                    $(el).find('.projlist-filter-item-count').text(newCount)
                                }
                            })
                        })
                    }
                })
            }
            projListUpdateServices(data)
            function projListinitFilter(data) {
                let allProjItems = $(data.next.container).find('.projlist-main-item');
                let allFilterItems = $(data.next.container).find('.projlist-filter-item-link');

                function projListUpdateFilter(target) {
                    if ($(target).hasClass('active')) {
                        return
                    }
                    $('.projlist-filter-item-link').removeClass('active')
                    $(target).addClass('active')
                    let type = $(target).attr('data-filter')
                    console.log(type)
                    gsap.to('.projlist-main-cms', {autoAlpha: 0, duration: .3, onComplete: () => {
                        if (type === '*') {
                            allProjItems.removeClass('filter-hidden')
                        } else {
                            allProjItems.each((idx, el) => {
                                if ($(el).find('[data-filter-ser]').text().includes(type)) {
                                    console.log($(el).find('[data-filter-ser]').text())
                                    $(el).removeClass('filter-hidden')
                                } else {
                                    $(el).addClass('filter-hidden')
                                }
                            })
                        }
                        projListLoadmore(data)
                        gsap.to('.projlist-main-cms', {autoAlpha: 1, duration: .3, delay: .1})
                    }})
                }
                let projListSwiper
                if ($(window).width() < 992 ) {
                    let itemClone = $(data.next.container).find('.projlist-filter-item').eq(0).clone()
                    itemClone.html($(data.next.container).find('[data-filter="*"]'))
                    $('.projlist-filter-list').prepend(itemClone)
                    $('.projlist-filter-cms').addClass('swiper')
                    $('.projlist-filter-list').addClass('swiper-wrapper')
                    $('.projlist-filter-item').addClass('swiper-slide')

                    projListSwiper = new Swiper($(data.next.container).find('.projlist-filter-cms').get(0), {
                        slidesPerView: "auto",
                        spaceBetween: parseRem(20)
                    })
                }

                $(data.next.container).find('.projlist-filter-item-link[data-filter="*"]').addClass('active');
                allFilterItems.on('click', function(e) {
                    e.preventDefault();
                    projListUpdateFilter(this)
                    if ($(window).width() < 992 ) {
                        projListSwiper.slideTo($(this).closest('.projlist-filter-item').index())
                    }
                })
            }
            projListinitFilter(data)

            let itemsLimits = 6;
            function projListLoadmore(data, projList) {
                let allItems
                if (!projList) {
                    allItems = $(data.next.container).find('.projlist-main-item:not(.filter-hidden)');
                } else {
                    allItems = projList
                }
                allItems.removeClass('load-hidden')
                allItems.each((idx, el) => {
                    if ((idx + 1) > 6) {
                        $(el).addClass('load-hidden')
                    }
                })
                if ($(data.next.container).find('.projlist-main-item.load-hidden:not(.filter-hidden)').length == 0) {
                    $(data.next.container).find('.projlist-main-btn').slideUp(() => {
                        $(data.next.container).find('.projlist-main-btn').addClass('hidden')
                    })
                } else {
                    $(data.next.container).find('.projlist-main-btn').removeClass('hidden')
                    $(data.next.container).find('.projlist-main-btn').slideDown()
                }
                if ($(window).width() > 991) {
                    if (headerProgTl.ScrollTrigger) {
                        headerProgTl.scrollTrigger.refresh()
                    }
                }
            }
            $(data.next.container).find('.projlist-main-btn').on('click', function(e) {
                e.preventDefault();
                let allHiddenItems = $(data.next.container).find('.projlist-main-item.load-hidden:not(.filter-hidden)');
                allHiddenItems.each((idx, el) => {
                    if ((idx + 1) <= itemsLimits) {
                        $(el).css('display','none');
                        $(el).removeClass('load-hidden');
                        $(el).slideDown('slow', () => {
                            gsap.set(el, {clearProps: 'all'})
                            if ($(window).width() > 991) {
                                headerProgTl.scrollTrigger.refresh()
                            }
                        })
                        gsap.from($(el).children(), {autoAlpha: 0, duration: .6, stagger: .1, y: -parseRem(20), ease: 'Power2.in'})
                    }
                    if ($(data.next.container).find('.projlist-main-item.load-hidden:not(.filter-hidden)').length == 0) {
                        $(this).slideUp(() => {
                            $(this).addClass('hidden')
                        })
                    }
                })
            })

            function projListAnim(data) {
                if ($(window).width() >= 768) {
                    const headTxt = new SplitText($(data.next.container).find('.projlist-hero-title-inner .projlist-title'), typeOpts.chars)
                    const abtTxt = new SplitText($(data.next.container).find('.projlist-abt-title'), typeOpts.words)
                    const filterLabelTxt = new SplitText($(data.next.container).find('.projlist-filter-label'), typeOpts.chars)

                    gsap.set(headTxt.chars, {yPercent: 60, autoAlpha: 0})
                    gsap.set(abtTxt.words, {yPercent: 60, autoAlpha: 0})
                    gsap.set(filterLabelTxt.chars, {yPercent: 60, autoAlpha: 0})
                    gsap.set($(data.next.container).find('.projlist-abt-line'), {scaleX: 0, transformOrigin: "left", ease: gOpts.ease, duration: .8}, "<=.8")
                    gsap.set($(data.next.container).find('.projlist-filter .projlist-filter-line'), {scaleX: 0, transformOrigin: "left", ease: gOpts.ease, duration: .8}, "<=.8")

                    let tl = gsap.timeline({
                        onComplete: () => {
                            headTxt.revert()
                            const newHeadTxt = new SplitText($(data.next.container).find('.projlist-hero-title-inner .projlist-title'), typeOpts.lines)
                            abtTxt.revert()
                            filterLabelTxt.revert()
                        },
                        delay: 2.2
                    })
                    tl
                    .to(headTxt.chars, {yPercent: 0, autoAlpha: 1, stagger: .03, ease: gOpts.ease, duration: .8})
                    .to($(data.next.container).find('.projlist-abt-line'), {scaleX: 1, ease: "power2.out", duration: 2, clearProps: "all"}, "<=.3")
                    .to(abtTxt.words, {yPercent: 0, autoAlpha: 1, stagger: .03, ease: gOpts.ease, duration: .5}, "<=.3")
                    .to($(data.next.container).find('.projlist-filter .projlist-filter-line'), {scaleX: 1, ease: "power2.out", stagger: .3, duration: 2, clearProps: "all"}, "<=.1")
                    .to(filterLabelTxt.chars, {yPercent: 0, autoAlpha: 1, stagger: .01, ease: gOpts.ease, duration: .5}, "<=.2")

                    $(data.next.container).find('.projlist-filter-item-link').each((idx, el) => {
                        let filterTxt = new SplitText($(el).find('.projlist-filter-item-txt'), typeOpts.chars)
                        gsap.set(filterTxt.chars, {yPercent: 60, autoAlpha: 0})
                        gsap.set($(el).find('.projlist-filter-item-count'), {yPercent: 60, autoAlpha: 0})
                        gsap.set($(el).find('.projlist-filter-item-dot'), {autoAlpha: 0})
                        tl
                        .to(filterTxt.chars, {
                            onComplete: () => {
                                filterTxt.revert()
                            },
                            yPercent: 0, autoAlpha: 1, stagger: .01, ease: gOpts.ease, duration: .6
                        }, "<=.05")
                        .to($(el).find('.projlist-filter-item-count'), {yPercent: 0, autoAlpha: 1, ease: gOpts.ease, duration: .4}, "<=.1")
                        .to($(el).find('.projlist-filter-item-dot'), {autoAlpha: 1, ease: gOpts.ease ,duration: .6}, "<=.1")
                    })
                }
            }

            function updateMainItems(data) {
                if ($(window).width() >= 768) {
                    $(data.next.container).find('.projlist-main-item:not(.load-hidden)').each((idx, el) => {
                        $(el).css('pointerEvents', 'none')

                        let titleTxt = new SplitText($(el).find('.projlist-main-item-title-txt'), typeOpts.chars);
                        let subTxt = new SplitText($(el).find('.projlist-main-item-sub'), typeOpts.words);

                        let tl = gsap.timeline({
                            delay: 3.5,
                            onComplete: () => {
                                titleTxt.revert()
                                subTxt.revert()
                                $(el).css('pointerEvents', 'auto')
                            },
                            once: true
                        })
                        tl
                        .from(titleTxt.chars, {yPercent: 60, autoAlpha: 0, ease: gOpts.ease, duration: .8})
                        .from(subTxt.words, {yPercent: 60, autoAlpha: 0, stagger: 0.02, duration: .6}, "<=.2")
                        .from($(el).find('.projlist-main-item-thumb'), {scale: .8, autoAlpha: 0, duration: 1, ease: gOpts.ease}, "<=.1")
                        .fromTo($(el).find('.projlist-main-item-thumb img'), {scale: 1.2}, {scale: 1, duration: 1, ease: gOpts.ease, clearProps: 'all'}, "<=0")
                    })
                }
            }
            requestAnimationFrame(() => {
                projListAnim(data)
                updateMainItems(data)
                projListLoadmore(data)
            })
        },
        beforeLeave() {
            console.log('leave projList')
        },
    }
    SCRIPT.termAndPoliciesScript = {
        namespace: 'termAndPolicies',
        afterEnter(data) {
            function addActive(data) {
                let target = $(data.next.container).attr('data-term-name')

                $(`.term-nav-link[data-term-link="${target}"]`).addClass('active')
            }
            addActive(data)
        },
        beforeLeave() {
        },
    }
    SCRIPT.notfoundScript = {
        namespace: 'notfound',
        afterEnter(data) {
            console.log('enter NotFound')
            function initNotFound() {
                const ragdoll = function() {
                    let Engine = Matter.Engine,
                        Events = Matter.Events,
                        Render = Matter.Render,
                        Runner = Matter.Runner,
                        Body = Matter.Body,
                        Common = Matter.Common,
                        Composite = Matter.Composite,
                        Composites = Matter.Composites,
                        MouseConstraint = Matter.MouseConstraint,
                        Mouse = Matter.Mouse,
                        Bodies = Matter.Bodies;

                    // create engine
                    let engine = Engine.create(),
                        world = engine.world;

                    // create renderer
                    let render = Render.create({
                        element: document.querySelector('.notfound-canvas-wrap'),
                        engine: engine,
                        options: {
                            width: document.querySelector('.notfound-canvas-wrap').offsetWidth,
                            height: document.querySelector('.notfound-canvas-wrap').offsetHeight,
                            pixelRatio: window.devicePixelRatio,
                            background: 'transparent',
                            contain: 'transparent',
                            wireframes: false,
                        }
                    });

                    Render.run(render);

                    // create runner
                    let runner = Runner.create();
                    Runner.run(runner, engine);

                    // create stairs
                    let stairWidth;
                    if ($(window).width > 991) {
                        stairWidth = Math.floor(parseRem(80));
                    } else if ($(window).width() > 767) {
                        stairWidth = Math.floor(parseRem(60));
                    } else {
                        stairWidth = Math.floor(parseRem(40));
                    }
                    let stairHeight = Math.floor(render.bounds.max.y + stairWidth)
                    let stairCount = render.bounds.max.x / stairWidth;
                    let stack = Composites.stack(0, 0, stairCount + 2, 1, 0, 0, function(x, y, column) {
                        return Bodies.rectangle(x, y + column * stairWidth, stairWidth, stairHeight, {
                            isStatic: true,
                            render: {
                                fillStyle: 'transparent',
                                strokeStyle: "#9B9B9B",
                                lineWidth: 1
                            }
                        });
                    });

                    // create obstacles
                    let shapes = {
                        shape_0: {
                            text: '<svg width="194" height="217" viewBox="0 0 194 217" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M27.6317 186.438L27.6336 186.44C45.9316 206.146 68.966 216 96.7 216C125.031 216 148.267 206.148 166.368 186.438C184.47 166.727 193.5 140.698 193.5 108.4C193.5 75.9054 184.572 49.7763 166.671 30.0649C148.967 10.3494 125.627 0.5 96.7 0.5C68.5665 0.5 45.4297 10.4541 27.33 30.3637L27.3299 30.3639C9.42908 50.0748 0.5 76.1039 0.5 108.4C0.5 140.698 9.52996 166.727 27.6317 186.438ZM97 170.6C91.3283 170.6 86.3892 169.312 82.1653 166.754C77.9405 164.194 74.4036 160.346 71.5631 155.184C65.8738 144.844 63 129.271 63 108.4C63 88.8389 65.7958 73.4247 71.3488 62.1205C74.118 56.4831 77.6389 52.2844 81.899 49.4932C86.157 46.7035 91.1839 45.3 97 45.3C102.816 45.3 107.843 46.7035 112.101 49.4932C116.361 52.2844 119.882 56.4831 122.651 62.1205C128.204 73.4247 131 88.8389 131 108.4C131 129.271 128.126 144.844 122.437 155.184C119.596 160.346 116.06 164.194 111.835 166.754C107.611 169.312 102.672 170.6 97 170.6Z" stroke="#9B9B9B"/></svg>',
                            url: 'https://uploads-ssl.webflow.com/65544f28fc8e963bc080b6f4/65b6b7a8069a126f84567dac_0.svg'
                        },
                        shape_4: {
                            text: '<svg width="186" height="211" viewBox="0 0 186 211" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M97.6757 209.211V209.711H98.1757H156.376H156.876V209.211V163.511H184.576H185.076V163.011V118.911V118.411H184.576H156.876V1.91138V1.41138L156.376 1.41138L98.4757 1.41138H98.2468L98.0973 1.58457L1.19727 113.785L1.07568 113.925V114.111L1.07568 163.011V163.511H1.57568H97.6757V209.211ZM97.6757 118.411H45.3507L97.6757 58.0593V118.411Z" stroke="#9B9B9B"/></svg>',
                            url: 'https://uploads-ssl.webflow.com/65544f28fc8e963bc080b6f4/65b6b7a923169546f943c65a_4.svg'
                        }
                    }
                    let obstacles = Composites.stack(0, 0, 3, 2, 0, 0, function(x, y, column) {
                        let shape = Math.random() > .5 ? shapes.shape_0 : shapes.shape_4;
                        let svg = new DOMParser().parseFromString(shape.text,'image/svg+xml');
                        let scaleFactor;
                        if ($(window).width() > 991) {
                            scaleFactor = 1
                        } else if ($(window).width() > 767) {
                            scaleFactor = .66
                        } else {
                            scaleFactor = .44
                        }
                        let svgWidth = Math.floor(parseRem(svg.querySelector('svg').getAttribute('width'))) * scaleFactor;
                        let svgHeight = Math.floor(parseRem(svg.querySelector('svg').getAttribute('height'))) * scaleFactor;

                        let options = {
                            friction: 0.4,
                            frictionAir: 0.015,
                            chamfer: {
                                radius: svgHeight * .4
                            },
                            render: {
                                sprite: {
                                    texture: shape.url,
                                    xScale: scaleFactor,
                                    yScale: scaleFactor
                                }
                            },
                            };
                            return Bodies.rectangle(x + 1 + column * stairWidth, y - stairWidth * 4, svgWidth, svgHeight, options);
                    });

                    Composite.add(world, [stack, obstacles]);

                    Events.on(engine, 'afterUpdate', function(event) {
                        let timeScale = (event.delta || (1000 / 60)) / 1000;
                        for (let i = 0; i < stack.bodies.length; i += 1) {
                            let body = stack.bodies[i];

                            // animate stairs
                            Body.translate(body, {
                                x: -stairWidth / 2 * timeScale * .5,
                                y: -stairWidth / 2 * timeScale * .5
                            });

                            // loop stairs when they go off screen
                            if (body.position.x < -stairWidth) {
                                Body.setPosition(body, {
                                    x: stairWidth * (stack.bodies.length - 1),
                                    y: stairWidth + render.bounds.max.y * 2 + stairHeight
                                });

                                Body.setVelocity(body, {
                                    x: 0,
                                    y: 0
                                });
                            }
                        }

                        for (i = 0; i < obstacles.bodies.length; i += 1) {
                            let body = obstacles.bodies[i],
                                bounds = body.bounds;
                            // move obstacles back to the top of the screen
                            if (bounds.min.y > render.bounds.max.y + 100) {
                                Body.setPosition(body, {
                                    x: stairWidth * 1,
                                    y: -stairWidth * 3
                                });
                            }
                        }
                    });

                    // add mouse control and make the mouse revolute
                    let mouse = Mouse.create(render.canvas),
                        mouseConstraint = MouseConstraint.create(engine, {
                            mouse: mouse,
                            constraint: {
                                stiffness: 0.6,
                                length: 0,
                                angularStiffness: 0,
                                render: {
                                    visible: false
                                }
                            }
                        });

                    Composite.add(world, mouseConstraint);

                    // keep the mouse in sync with rendering
                    render.mouse = mouse;

                    // fit the render viewport to the scene
                    Render.lookAt(render, {
                        min: { x: 0, y: 0 },
                        max: { x: render.bounds.max.x, y: render.bounds.max.y }
                    });
                };
                ragdoll()
            }
            initNotFound()
            $('a').on('click', function(e) {
                e.preventDefault();
                if ($(this).attr('href') !== '#') {
                    window.location = $(this).attr('href')
                }
            })
        },
        beforeLeave() {
        },
    }
    SCRIPT.contactScript = {
        namespace: 'contact',
        afterEnter(data) {
            console.log('enter Contact')
            let newUrl = window.location.origin + '?contact'
            window.location = newUrl
            history.replaceState({}, '', window.location.origin)
        },
        beforeLeave() {
        },
    }
    SCRIPT.playgroundScript = {
        namespace: 'playground',
        afterEnter(data) {
            console.log('enter Playground')
            $('.side-bg-ph').addClass('dark')
            $('.header').addClass('on-dark')
            $('.playg-main').removeClass('fade')
            $('.header-prog').addClass('hidden');
            $('.ic-playg').removeClass('bounce2');
            $('.header .ic-playg').attr('href', '/')
            function setLayout(data) {
                let allItems = $(data.next.container).find('.playg-main-item');
                allItems.each((idx, el) => {
                    if ($(el).find('.playg-main-item-inner').attr('href') != '#') {
                        $(el).find('.playg-main-item-inner').addClass('has-link')
                    }
                    if ($(window).width() >= 991) {
                        if (idx % 3 == 0) {
                            $(el).appendTo($(data.next.container).find('.playg-main-col-inner').eq(0))
                        } else if (idx % 3 == 1) {
                            $(el).prependTo($(data.next.container).find('.playg-main-col-inner').eq(1))
                        } else if (idx % 3 == 2) {
                            $(el).appendTo($(data.next.container).find('.playg-main-col-inner').eq(2))
                        }
                    } else if ($(window).width() >= 767) {
                        if (idx % 2 == 0) {
                            $(el).appendTo($(data.next.container).find('.playg-main-col-inner').eq(0))
                        } else if (idx % 2 == 1) {
                            $(el).prependTo($(data.next.container).find('.playg-main-col-inner').eq(1))
                        }
                    } else {
                        $(el).prependTo($(data.next.container).find('.playg-main-col-inner').eq(0))
                    }
                })
                $('.playg-main-cms').remove()
            }
            setLayout(data)
            function scrollAnim(data) {
                if ($(window).width() >= 767) {
                    let offset = $(window).height() - parseRem(120)
                    let allCols = $(data.next.container).find('.playg-main-col-inner');
                    let maxHeight = Math.max(allCols.eq(0).height(), allCols.eq(1).height(), allCols.eq(2).height())
                    $(data.next.container).find('.playg-main-cms-wrap').css('height', `${maxHeight * 2}px`)
                    let tl = gsap.timeline({
                        scrollTrigger: {
                            trigger: $(data.next.container).find('.playg-main'),
                            start: 'top top',
                            end: 'bottom bottom',
                            scrub: true
                        },
                        defaults: {
                            ease: 'linear'
                        }
                    })
                    tl
                    .to(allCols.eq(0), {y: Math.abs(allCols.eq(0).height() - offset)})
                    .to(allCols.eq(1), {y: -1 * Math.abs(allCols.eq(1).height() - offset)}, 0)
                    .to(allCols.eq(2), {y: Math.abs(allCols.eq(2).height()) - offset}, 0)


                    requestAnimationFrame(() => {
                        let tlAnim = gsap.timeline({
                            delay: 2
                        })
                        tlAnim
                        .from(allCols.eq(0).find('.playg-main-item'), {yPercent: -65, autoAlpha: 0, duration: 1.4, ease: 'power2.out', stagger: -0.1, clearProps: 'all'})
                        .from(allCols.eq(1).find('.playg-main-item'), {yPercent: 65, autoAlpha: 0, duration: 1.4, ease: 'power2.out', stagger: 0.1, clearProps: 'all'}, .1)
                        .from(allCols.eq(2).find('.playg-main-item'), {yPercent: -65, autoAlpha: 0, duration: 1.4, ease: 'power2.out', stagger: -0.1, clearProps: 'all'}, .2)
                    })
                }
            }
            scrollAnim(data)
        },
        afterLeave(data) {
            console.log('leave Playground')
            $('.side-bg-ph').removeClass('dark')
            $('.header').removeClass('on-dark')
            $('.playg-main').addClass('fade')
            $('.header-prog').removeClass('hidden')
            $('.ic-playg').addClass('bounce2');
            $('.header .ic-playg').attr('href', '/playground')
        }
    }
    SCRIPT.adsScript = {
        namespace: 'ads',
        afterEnter(data) {
        },
        beforeLeave() {
        },
    }
    const VIEWS = [
        SCRIPT.homeScript,
        SCRIPT.abtScript,
        SCRIPT.projDtlScript,
        SCRIPT.serviceScript,
        SCRIPT.projListScript,
        SCRIPT.termAndPoliciesScript,
        SCRIPT.notfoundScript,
        SCRIPT.contactScript,
        SCRIPT.playgroundScript,
        SCRIPT.adsScript
    ]
    barba.init({
        preventRunning: true,
        timeout: 10000,
        transitions: [{
            name: 'opacity-transition',
            sync: true,
            once(data) {
                updateImgGrid(document, '.client-news-block-rictxt-imgs')
                if ($(window).width() > 767) {
                    initTitleMouseMove(data)
                }
                addNavActiveLink(data)
                addStickyFooter(data)
                handleScrollTo()
                handleNav.isProjDtl(data)
                // textReplace(data)
                transitionOnce(data)
                documentHeightObserver('init')
                if ($(window).width() > 991) {
                    scrollProg(data.next.container)
                }
            },
            enter(data) {
            },
            async after(data) {
            },
            async afterEnter(data) {
                if ($(window).width() > 767 && !isTouchDevice()) {
                    handleCursor.reUpdateHtml(data)
                }
                documentHeightObserver('init')
                handleNav.isProjDtl(data)
                await transitionEnter(data)
                if ($(window).width() > 991) {
                    requestAnimationFrame(() => {
                        $('.header-prog').removeClass('hidden')
                        scrollProg(data.next.container)
                    })
                }
                handleContactForm.update(data)
                handleScrollTo()
                if (!isTouchDevice()) {
                    if ($(window).width() > 767) {
                        initTitleMouseMove(data)
                    }
                    $(data.next.container).find('[data-magnetic]').on('pointerleave', function(e) {
                        gsap.to(this, {
                            x: 0,
                            y: 0,
                            duration: 1,
                            ease: "elastic.out(1,0.3)",
                            overwrite: true
                        })
                    })
                    initFooter()
                    if ($(window).width() > 991) {
                        if ($(data.next.container).find('[data-move="wrap"]').length) {
                            if ($(data.next.container).find('[data-move="wrap"]').find('.title-dot-canvas').length) {
                                $(data.next.container).find('[data-move="wrap"]').each((idx, el) => {
                                    requestAnimationFrame(() => {
                                        initTitleGrid($(el).find('.title-dot-canvas'))
                                    })
                                })
                            }
                        }
                    }
                }
            },
            async beforeLeave(data) {
                resetBeforeLeave(data)
                //textReplace(data)
                $('.header-prog').addClass('hidden')
            },
            async leave(data) {
                await transitionLeave(data).then(() => {
                    removeAllScrollTrigger();
                })
            },
            async afterLeave(data) {
            }
        }],
        views: VIEWS
    })
}


window.onload = (() => {
    if (!window.location.pathname.includes('ai-design-system')) {
        mainScript();
    }
})();