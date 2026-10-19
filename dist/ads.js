const landingScript = () => {
    gsap.registerPlugin(ScrollTrigger, SplitText);
    gsap.config({ nullTargetWarn: false });

    const isStaging = window.location.href.indexOf('webflow') > -1 ? true : false

    const lenis = new Lenis({
        lerp: false,
        duration: 1.6
    })
    function raf(time) {
        lenis.raf(time)
        requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf);

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
    let typeOpts = {
        lines: { type: 'lines', linesClass: 'g-lines'},
        words: { type: 'words,lines', linesClass: 'g-lines'},
        chars: { type: 'chars,words,lines', linesClass: 'g-lines'}
    };
    let gOpts = {
        ease: 'power2.easeOut',
    };
    let delayTime = .8;

    lenis.on('scroll', function(inst) {
        if (inst.scroll > $('.header-top').height() ) {
            $('.header-top').addClass('on-scroll')
        } else {
            $('.header-top').removeClass('on-scroll')
        }
    })

    const isObjectEmpty = (objectName) => {
        return (
            objectName &&
            Object.keys(objectName).length === 0 &&
            objectName.constructor === Object
        );
    };

    $.fn.hasAttr = function (name) {
        return this.attr(name) !== undefined;
    };

    const required = (message) => ({ message, required: true });
    const regexp = (pattern, message) => ({ regexp: pattern, message });

    const REGEXP = {
        email: /^(?!.*@(gmail|yahoo|hotmail|outlook|live|msn|icloud|aol|protonmail|proton|zoho|mail|gmx|yandex|tutanota|me|mac|inbox|rediffmail|rocketmail|sbcglobal|att|verizon|comcast|cox|charter|earthlink|juno|netzero|aim|bellsouth|qq|163|sina|naver|daum|hanmail|ymail|rediff|extandard|fastmail|mailru|web\.de|rambler\.ru|libero\.it|uol\.com\.br|bol\.com\.br|sfr\.fr|neuf\.fr|tiscali\.it|shaw\.ca|optonline\.net|freenet\.de|t-online\.de|bluewin\.ch|skynet\.be|sympatico\.ca|windstream\.net|centurytel\.net|bigpond\.com\.au|optusnet\.com\.au|blueyonder\.co\.uk|ntlworld\.com|frontiernet\.net|hetnet\.nl|zonnet\.nl|club-internet\.fr|chello\.nl|bigpond\.net\.au|terra\.com\.br|ig\.com\.br|orange\.fr|wanadoo\.fr|alice\.it|tin\.it|arcor\.de|virgilio\.it|mailfence|posteo|mailbox\.org|startmail|soverin|disroot\.org|cock\.li)\..*)(?!.*\.(edu|ac|sch|gov|mil)$)[\w\.-]+@([\w-]+\.)+[a-zA-Z]{2,}$/gi,
        tel: /(03|05|07|08|09|01[2|6|8|9])+([0-9]{8})\b/
    }

    const ERROR_MESSAGE = {
        required: (name) => `Please fill your ${name}`,
        regexp: 'Field not like format'
    }

    const mapFormToObject = (form, originFormData) => {
        /** -NOTE-
         * read it: https://stackoverflow.com/questions/12077859/difference-between-this-and-event-target
         * form: this property will be
         *          [e.target]: when the form have event
         *       or [$(formID).get(0)]: when the form don't have event
         */

        let formData = originFormData || new FormData(form);
        const parsedFormData = [...formData.entries()].reduce(
            (prev, cur) => {
                const name = cur[0];
                const val = cur[1];
                let dataName;

                for (let field of form) {
                    let fieldDataName = field.dataset.name;
                    let fieldName = field.name;
                    if (name === fieldName) dataName = fieldDataName;
                }

                return {
                    ...prev, [name]: {
                        value: val,
                        name: dataName,
                        validType: []
                    }
                };
            },
            {}
        );

        // Handle select fields that might be missing due to disabled option
        for (let field of form) {
            if (field.tagName === 'SELECT' && field.name && !parsedFormData[field.name]) {
                const selectedOption = field.options[field.selectedIndex];
                const value = selectedOption ? selectedOption.value : '';
                const dataName = field.dataset.name;

                parsedFormData[field.name] = {
                    value: value,
                    name: dataName,
                    validType: []
                };
            }
        }

        return parsedFormData;
    }

    const mapObjectFormToValidate = (form, obj) => {
        const parsedFormData = [...Object.entries(obj)].reduce((prev, cur) => {
            const name = cur[0];
            const val = cur[1];
            let validArr = val.validType;

            for (let field of form) {
                let fieldName = field.name;
                let fieldType = field.type;
                let fieldRequired = field.required || false;
                let REGEXP_TYPE = ['email', 'tel'];
                if (name === fieldName) {
                    if (fieldRequired) {
                        let CusMessage = field.getAttribute('mess-required');
                        validArr.unshift(required(CusMessage))
                    }
                    if (REGEXP_TYPE.includes(fieldType)) {
                        let CusMessage = field.getAttribute('mess-regexp');
                        let CusRegexp = field.getAttribute('cus-regexp');
                        validArr.unshift(regexp(CusRegexp || fieldType, CusMessage))
                    }
                }
                continue;
            }
            return {
                ...prev, [name]: val
            }
        }, {})
        return parsedFormData;
    }

    const validateForm = ({ formsObj: forms, rules }) => {
        const errors = {};
        for (let name in rules) {
            for (let rule of rules[name].validType) {
                if (rule.required && forms[name]) {
                    if (!forms[name].value.trim() || forms[name].value.trim() == "false") {
                        errors[name] = rule.message || ERROR_MESSAGE.required(forms[name].name);
                    }
                }
                if (rule.regexp && forms[name]) {
                    let regexp = rule.regexp;
                    if (regexp in REGEXP) {
                        regexp = new RegExp(REGEXP[regexp]);
                    }
                    else if (!(regexp instanceof RegExp)) {
                        regexp = new RegExp()
                    }
                    if (!regexp.test(forms[name].value.trim())) {
                        errors[name] = rule.message || ERROR_MESSAGE.regexp;
                    }
                }
            }
        }
        return {
            errors,
            isValidated: Object.keys(errors).length === 0
        };
    }

    const validateInput = ({ targetInputObject: input, targetInputRule: rules }) => {
        let errors;
        const isEmpty = (value) => (value == null || (typeof value === "string" && value.trim().length === 0));
        for (let rule of rules.validType) {
            if (rule.required) {
                if (!input.value.trim() || input.value.trim() == "false") {
                    errors = rule.message || ERROR_MESSAGE.required(input.name);
                }
            }
            if (rule.regexp) {
                let regexp = rule.regexp;
                if (regexp in REGEXP) {
                    regexp = new RegExp(REGEXP[regexp]);
                }
                else if (!(regexp instanceof RegExp)) {
                    regexp = new RegExp()
                }
                if (!regexp.test(input.value.trim())) {
                    errors = rule.message || ERROR_MESSAGE.regexp;
                }
            }
        }
        return errors;
    }

    const errorValidation = {
        singleActive: (input, error) => {
            let errorEl = $(input).find('.input-error');
            if (error) {
                $(errorEl).find('.txt').html(error);
                $(errorEl).slideDown('fast');
            }
            else {
                $(errorEl).slideUp('fast', () => $(errorEl).find('.txt').html(''));
            }
        },
        active: (form, errors) => {
            Array.from(form.querySelectorAll('.input-grp input.w-input, .input-grp select, .input-grp textarea')).forEach(node => {
                let errorEl = node.parentElement.querySelector('.input-error');
                if (errors.hasOwnProperty(node.getAttribute('name'))) {
                    errorEl.querySelector('.txt').innerHTML = errors[node.getAttribute('name')];
                    $(errorEl).slideDown('fast');
                }
                else {
                    $(errorEl).slideUp('fast', () => errorEl.querySelector('.txt').innerHTML = '');
                }
            });
        },
        reset: (form) => {
            Array.from(form.querySelectorAll('.input-grp input.w-input, .input-grp select, .input-grp textarea')).forEach(node => {
                let errorEl = node.parentElement.querySelector('.input-error');
                $(errorEl).slideUp('fast', () => errorEl.querySelector('.txt').innerHTML = '');
            });
        }
    }

    const submitForm = ({ formsObj, rules }) => {
        let validateInfo = { status: false, resultForm: {} };
        const { errors, isValidated } = validateForm({ formsObj, rules });
        if (isValidated) {
            validateInfo.status = true;
            Object.entries(rules).forEach(([key, { value }]) => {
                validateInfo.resultForm[key.toLowerCase()] = value;
            });
            return { validateInfo };
        }
        else {
            validateInfo.status = false;
            return { errors, validateInfo };
        }
    }

    const validateOnInput = ({ targetInputObject, targetInputRule }) => {
        let validateInfo = { status: false, resultForm: {} };
        const error = validateInput({ targetInputObject, targetInputRule });

        return error;
    }

    const formHandler = (formID, options = {}) => {
        /** -NOTE-
         * read it: https://stackoverflow.com/questions/12077859/difference-between-this-and-event-target
         *  e.target <--> $(formID).get(0)
         *  e.currentTarget <--> $(this) <--> $(formID)
         */
        const formTarget = $(formID).get(0);
        let formsObj = mapFormToObject(formTarget);
        let rules = mapObjectFormToValidate(formTarget, formsObj);

        const validateThisInput = (e) => {
            let targetInputObject = {
                ...formsObj[$(e.target).attr('name')],
                value: $(e.target).val()
            };
            let targetInputRule = { ...rules[$(e.target).attr('name')] }
            const error = validateOnInput({ targetInputObject, targetInputRule });
            errorValidation.singleActive($(e.target).closest('.input-grp'), error);
        }

        $(`${formID} .input-grp input`).bind('input', debounce(validateThisInput))
        $(`${formID} .input-grp textarea`).bind('input', debounce(validateThisInput))
        $(`${formID} .input-grp select`).bind('change', debounce(validateThisInput))
        $(`${formID} .form-submit`).on('click', function (e) {
            const { onSuccess, onError } = options;
            formsObj = mapFormToObject(formTarget);
            rules = mapObjectFormToValidate(formTarget, formsObj);

            const { errors, validateInfo } = submitForm({ formsObj, rules });
            if (validateInfo.status) {
                onSuccess?.(validateInfo);
                $(this).closest('form').trigger('submit');
                errorValidation.reset($(formID).get(0));
            }
            else {
                e.preventDefault();
                onError?.(errors);
                errorValidation.active($(formID).get(0), errors);
            }
            return false;
        })
    }

    const formSubmitEvent = (function () {
        const init = ({
            onlyWorkOnThisFormName,
            onSuccess,
            onFail
        }) => {
            let inputSubmit = $(`#${getIDFormName(onlyWorkOnThisFormName)} .input-submit-wrap .txt`);

            $(document).on('ajaxSend', function (event, xhr, settings) {
                if (settings.url.includes("https://webflow.com/api/v1/form/")) {
                    inputSubmit.text('Please wait...');
                }
            });
            $(document).on('ajaxComplete', function (event, xhr, settings) {
                if (settings.url.includes("https://webflow.com/api/v1/form/")) {
                    const isSuccessful = xhr.status === 200
                    const isWorkOnAllForm = onlyWorkOnThisFormName == undefined
                    const isCorrectForm = !isWorkOnAllForm && settings.data.includes(getSanitizedFormName(onlyWorkOnThisFormName));

                    if (isWorkOnAllForm) {
                        if (isSuccessful) {
                            onSuccess?.()
                            inputSubmit.text('Sent');
                        } else {
                            onFail?.()
                        }
                    } else if (isCorrectForm) {
                        if (isSuccessful) {
                            onSuccess?.()
                            inputSubmit.text('Sent');
                        } else {
                            onFail?.()
                        }
                    }
                }
            });
        }
        function getIDFormName(name) {
            return name.toLowerCase().replaceAll(" ", "-");
        }
        function getSanitizedFormName(name) {
            return name.replaceAll(" ", "+")
        }
        return {
            init
        }
    })();

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

    function isInViewport(el) {
        const rect = el.getBoundingClientRect();
        return (
            rect.top >= -rect.height &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + rect.height &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    }
    function removeAllScrollTrigger() {
        let triggers = ScrollTrigger.getAll();
        triggers.forEach(trigger => {
            trigger.kill();
        });
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
    const parallaxImage = ({ el, scaleOffset = 0.3 }) => {
        gsap.set(el, { 'overflow': 'hidden' });
        gsap.set($(el).find('img'), { height: '120%' });
        const updateOnScroll = (dist, total) => {
            if ($(el).find('img') && isInViewport(el)) {
                let percent = el.getBoundingClientRect().bottom / total;

                ySetter($(el).find('img'))(-dist * percent * 1.2);
                gsap.set($(el).find('img'), { scale: 1 + (percent * scaleOffset) });
            }
        };

        let dist = $(el).find('img').get(0).offsetHeight - el.offsetHeight;
        let total = el.getBoundingClientRect().height + window.innerHeight;

        updateOnScroll(dist, total);
        lenis.on('scroll', () => {
            updateOnScroll(dist, total);
        });
    };

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
            // if ($(window).width() < 768) {
            //     this.el.find('.popup-reel-mb-info').removeClass('active')
            // }
            // $(this.videoToggle).attr('data-video', 'to-pause')
            // this.el.find('.popup-reel-inner').addClass('on-play')
            // this.el.find('.popup-reel-video-main').addClass('on-play')
            this.video.play()
            // this.el.find('.cursor-vid-prog').addClass('active')
            // requestAnimationFrame(this.updateReel.bind(this))
            // this.status = 'to-pause'
        }
        pauseReel() {
            // if ($(window).width() < 768) {
            //     this.el.find('.popup-reel-mb-info').addClass('active')
            // }
            // $(this.videoToggle).attr('data-video', 'to-play')
            // this.el.find('.popup-reel-inner').removeClass('on-play')
            // this.el.find('.popup-reel-video-main').removeClass('on-play')
            this.el.find('.popup-reel-video-main').find('video').get(0).pause()
            // gsap.set('.cursor-vid-prog', {'--vid-prog': '0deg', clearProps: 'all'})
            // cancelAnimationFrame(this.updateReel.bind(this))
            // this.status = 'to-play'
        }
        openReel() {
            this.el.find('.popup-reel-close-btn, .popup-reel-close-btn-mb').css('pointer-events', 'auto')
            this.el.addClass('active')
            this.el.find('.popup-ads-close-inner').addClass('active')
            // video.currentTime = 0
            this.playReel()
        }
        closeReel() {
            this.el.find('.popup-reel-close-btn, .popup-reel-close-btn-mb').css('pointer-events', 'none')
            this.el.removeClass('active')
            this.el.find('.popup-ads-close-inner').removeClass('active')
            this.pauseReel()
        }
        updateReel() {
            // let progress = (this.video.currentTime / this.video.duration) * 360;
            // gsap.set('.cursor-vid-prog', {'--vid-prog': `${progress}deg`});
            // requestAnimationFrame(this.updateReel.bind(this));
        }
    }
    //Reel
    let reel = null;
    if ($('.popup-ads').length) {
        reel = new Reel($('.popup-ads'))
    }
    function inputInteractionInit(formEl) {
        //Normal input
        $(`${formEl} .input-grp .input-field`).on('focus', function(e) {
            $(this).parent().addClass('active')
        })
        $(`${formEl} .input-grp .input-field`).on('blur', function(e) {
            $('.input-grp').removeClass('active')
        })
        $(`${formEl} .input-grp .input-field`).on('keyup', function(e) {
            if ($(this).val() != '') {
                $(this).parent().addClass('filled')
            } else {
                $(this).parent().removeClass('filled')
            }
        })
        $(`${formEl} .input-grp .input-field`).on('change', function(e) {
            if ($(this).val() != '') {
                $(this).parent().addClass('filled')
            } else {
                $(this).parent().removeClass('filled')
            }
        })
        $(`${formEl} .input-grp select option:first-child`).css('display', 'none');
    }
    const handleContactForm = {
        init: () => {
            $('[data-popup="book"]').on('click', function(e) {
                e.preventDefault();
                if ($('.ads-ctc-popup').hasClass('active')) {
                    $(window).width() <= 767 && headerOnClose()
                    handleContactForm.close()
                } else {
                    $(window).width() <= 767 && headerOnOpen()
                    handleContactForm.open()
                }
            })
            if ($(window).width() > 767) {
                $('.ads-ctc-popup-bg').on('click', function(e) {
                    e.preventDefault();
                    if (!$('.ads-ctc-popup-inner:hover').length) {
                        $(window).width() <= 767 && headerOnClose()
                        handleContactForm.close()
                    }
                })
            }

            let currentIndex = 0;
            let interval = null;

            const activeIndex = () => {
                $('.ads-ctc-testi-item').eq(currentIndex).addClass('active').siblings().removeClass('active');
            }

            const startInterval = () => {
                if (interval) {
                    clearInterval(interval);
                }

                interval = setInterval(() => {
                    currentIndex++;
                    if (currentIndex >= $('.ads-ctc-testi-item').length) {
                        currentIndex = 0;
                    }
                    activeIndex();
                }, 3200);
            }
            let name = '';
            function capitalizeFirstLetter(string) {
                return string.charAt(0).toUpperCase() + string.slice(1);
            }
            $('input[data-name="Name"]').bind('change keyup paste keydown', function (e) {
                name = $(this).val();
            })
            formHandler('#contact-form', {
                onSuccess: ({ resultForm }) => {
                    formSubmitEvent.init({
                        onlyWorkOnThisFormName: "Contact Form",
                        onSuccess: () => {
                            $('.ads-ctc-popup-success [data-name]').text(capitalizeFirstLetter(name));
                            $('.ads-ctc-popup-inner').addClass('success');
                            dataLayer.push({'event': 'form_submit'});
                            setTimeout(() => {
                                handleContactForm.reset();
                            }, 1000);
                            setTimeout(() => {
                                currentIndex++;
                                activeIndex();
                                startInterval();
                            }, 2500);
                        },
                    });
                }
            });
        },
        open: () => {
            $(window).width() <= 767 && $('.header-btn-ctc').addClass('active');
            $('.ads-ctc-popup').addClass('active')
            setTimeout(() => {
                $('.ads-ctc-popup-bg').addClass('active')
            }, $(window).width() > 767 ? 0 : 400);

            // gsap.set('.pop-ctc-main-bg, .pop-ctc-sub-bg', {scale: 0, transformOrigin: 'top left', overwrite: true})
            // gsap.set('.pop-ctc-main, .pop-ctc-sub', {clipPath: 'polygon(0% 0%, 0% 0%, 0% 0%, 0% 0%)', overwrite: true})
            let tlOpenPop = gsap.timeline({

            })
            tlOpenPop
            .set('.ads-ctc-popup-inner', {transformOrigin: '100% 0%', scale: 0})
            .to('.ads-ctc-popup-inner', {scale: 1, duration: .6, transformOrigin: '100% 0%', ease: 'power2.inOut'})
        },
        close: () => {
            $(window).width() <= 767 && $('.header-btn-ctc').removeClass('active');
            let tlClosePop = gsap.timeline({

            })
            tlClosePop
                .fromTo('.ads-ctc-popup-inner', { transformOrigin: '0% 100%' }, { scale: 0, duration: .6, transformOrigin: '0% 100%', ease: 'power2.inOut' })
            setTimeout(() => {
                $('.ads-ctc-popup').removeClass('active')
            }, 600);
            $('.ads-ctc-popup-bg').removeClass('active')

            document.querySelector('.ads-ctc-popup-form').scrollTo({
                top: 0,
                left: 0,
                behavior: 'smooth'
            })
            // handleContactForm.reset()
        },
        reset: () => {
            $('.ads-ctc-popup-form').trigger('reset');
            $('.ads-ctc-popup-form .input-grp').removeClass('filled');
            document.querySelector('.ads-ctc-popup-form').scrollTo({
                top: 0,
                left: 0,
                behavior: 'smooth'
            })
            if ($('.pop-ctc-succ.w-form-done').css('display') == 'block') {
                // $('.pop-ctc-succ').css('display', 'none');
                // $('.ads-ctc-popup-inner').css('display', 'block');
            }
        },
        isOpen: () => {
            return $('.ads-ctc-popup').hasClass('active')
        },
        update: (data) => {
            $('[data-popup="book"]').on('click', function(e) {
                e.preventDefault();
                if ($('.ads-ctc-popup').hasClass('active')) {
                    handleContactForm.close()
                    $(window).width() <= 767 && headerOnClose()
                } else {
                    handleContactForm.open()
                    $(window).width() <= 767 && headerOnOpen()
                }
            })
        },
    }
    function headerOnOpen() {
        $('.header-top').addClass('on-open')
        gsap.set('.header', {'mix-blend-mode': 'normal', 'filter': 'invert(0)'})
        $('.header').addClass('on-open')
    }
    function headerOnClose() {
        $('.header-top').removeClass('on-open')
        $('.header').removeClass('on-open')
        setTimeout(() => {
            gsap.set('.header', {'mix-blend-mode': 'difference', 'filter': 'invert(1)'})
        }, 300);
    }
    function adsHero() {
        ScrollTrigger.create({
            trigger: $('.ads-hero'),
            start: 'top bottom',
            once: true,
            onEnter: () => {
                if ($(window).width() < 767) {
                    $('.ads-hero-client-logo img[loading="lazy"]').removeAttr('loading');
                }
                let items = $('.ads-hero-client');
                let speed;
                if ($(window).width() > 767) {
                    speed = 90;
                } else {
                    speed = 45;
                }
                items.each((idx, el) => {
                    let cloneItem = $(el).find('.ads-hero-client-cms').eq(0).clone();
                    cloneItem.clone().appendTo(el)
                    requestAnimationFrame(() => {
                        let tlDur = Math.floor($(el).find('.ads-hero-client-cms').eq(0).width() / speed)
                        $(el).find('.ads-hero-client-cms').css('--marqueeDur', `${tlDur}s`)

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
                    items.find('.ads-hero-client-cms').addClass('anim')
                })
            }
        })
    }
    function adsIntro() {
        if ($('.ads-intro-video').length > 0) {
            $('.ads-intro-video[data-popup="showreel"]').on('click', function(e) {
                e.preventDefault();
                if (reel) {
                    reel.openReel()
                }
            })
        }
    }
    function adsCta() {
    }
    function adsReview() {
        parallaxImage({ el: $('.ads-review-bg').get(0), scaleOffset: .1 })
    }

    function adsClient() {
        //$(data.next.container).find('.abt-val-imgs-stick').css('top', ($(window).height() - $(data.next.container).find('.abt-val-imgs-stick').height())/2);
        $('.ads-client-asset-stick').css('margin-block', ($('.ads-client-asset-item').get(0).offsetTop * -1) + parseRem($(window).width() > 991 ? 90 : 40));
        const items = $('.ads-client .ads-client-item');
        $('.ads-client-asset-stick .ads-client-asset-item').eq(0).addClass('active')
        items.each((idx, el) => {
            ScrollTrigger.create({
                trigger: el,
                start: 'top top+=35%',
                end: 'bottom top+=35%',
                onEnter: () => {
                    $('.ads-client-asset-stick .ads-client-asset-item').removeClass('active')
                    $('.ads-client-asset-stick .ads-client-asset-item').eq(idx).addClass('active')
                },
                onEnterBack: () => {
                    $('.ads-client-asset-stick .ads-client-asset-item').removeClass('active')
                    $('.ads-client-asset-stick .ads-client-asset-item').eq(idx).addClass('active')
                }
            })
        })
    }

    function adsFAQ() {
        $('.ads-faq-ans').hide();
        $('.ads-faq-ques').on('click', function(e) {
            e.preventDefault();
            $(this).siblings('.ads-faq-ans').slideToggle();
            $(this).parent().siblings().find('.ads-faq-ans').slideUp();
        })
    }

    function init() {
        documentHeightObserver('init');
        scrollToTop();
        if (!isTouchDevice()) {
            if ($(window).width() > 991) {
                magnetMove();
                $('[data-move="wrap"]').each((idx, el) => {
                    if ($(el).find('.title-dot-canvas').length) {
                        requestAnimationFrame(() => {
                            initTitleGrid($(el).find('.title-dot-canvas'))
                        })
                    }
                })
            }
        }
        handleContactForm.init()
        inputInteractionInit('.ads-ctc-popup-form')
        adsHero()
        adsCta()
        adsIntro()
        adsReview()
        adsClient()
        adsFAQ()
    }
    init()
}
window.onload = landingScript;
