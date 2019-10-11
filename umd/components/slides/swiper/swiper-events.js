(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./swiper-utils", "./swiper-transition", "./swiper", "./swiper-progress", "./swiper-index", "./swiper-pagination", "./swiper-classes"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var swiper_utils_1 = require("./swiper-utils");
    var swiper_transition_1 = require("./swiper-transition");
    var swiper_1 = require("./swiper");
    var swiper_progress_1 = require("./swiper-progress");
    var swiper_index_1 = require("./swiper-index");
    var swiper_pagination_1 = require("./swiper-pagination");
    var swiper_classes_1 = require("./swiper-classes");
    /*=========================
      Events
      ===========================*/
    // Attach/detach events
    function initEvents(s, plt) {
        var win = plt.win();
        var doc = plt.doc();
        s._supportTouch = (function () {
            return !!(('ontouchstart' in win) || win.DocumentTouch && doc instanceof win.DocumentTouch);
        })();
        // Define Touch Events
        s._touchEventsDesktop = { start: 'mousedown', move: 'mousemove', end: 'mouseup' };
        if (win.navigator.pointerEnabled) {
            s._touchEventsDesktop = { start: 'pointerdown', move: 'pointermove', end: 'pointerup' };
        }
        else if (win.navigator.msPointerEnabled) {
            s._touchEventsDesktop = { start: 'MSPointerDown', move: 'MSPointerMove', end: 'MSPointerUp' };
        }
        s._touchEvents = {
            start: s._supportTouch || !s.simulateTouch ? 'touchstart' : s._touchEventsDesktop.start,
            move: s._supportTouch || !s.simulateTouch ? 'touchmove' : s._touchEventsDesktop.move,
            end: s._supportTouch || !s.simulateTouch ? 'touchend' : s._touchEventsDesktop.end
        };
        // WP8 Touch Events Fix
        if (win.navigator.pointerEnabled || win.navigator.msPointerEnabled) {
            (s.touchEventsTarget === 'container' ? s.container : s._wrapper).classList.add('swiper-wp8-' + s.direction);
        }
        var unregs = [];
        var touchEventsTarget = s.touchEventsTarget === 'container' ? s.container : s._wrapper;
        // Touch Events
        if (s._supportTouch) {
            // touchstart
            plt.registerListener(touchEventsTarget, s._touchEvents.start, function (ev) {
                onTouchStart(s, plt, ev);
            }, { passive: true, zone: false }, unregs);
            // touchmove
            plt.registerListener(touchEventsTarget, s._touchEvents.move, function (ev) {
                onTouchMove(s, plt, ev);
            }, { zone: false }, unregs);
            // touchend
            plt.registerListener(touchEventsTarget, s._touchEvents.end, function (ev) {
                onTouchEnd(s, plt, ev);
            }, { passive: true, zone: false }, unregs);
        }
        if ((s.simulateTouch && !plt.is('ios') && !plt.is('android')) || (s.simulateTouch && !s._supportTouch && plt.is('ios')) || plt.getQueryParam('ionicPlatform')) {
            // mousedown
            plt.registerListener(touchEventsTarget, 'mousedown', function (ev) {
                onTouchStart(s, plt, ev);
            }, { zone: false }, unregs);
            // mousemove
            plt.registerListener(touchEventsTarget, 'mousemove', function (ev) {
                onTouchMove(s, plt, ev);
            }, { zone: false }, unregs);
            // mouseup
            plt.registerListener(touchEventsTarget, 'mouseup', function (ev) {
                onTouchEnd(s, plt, ev);
            }, { zone: false }, unregs);
        }
        // onresize
        var resizeObs = plt.resize.subscribe(function () { return onResize(s, plt, false); });
        // Next, Prev, Index
        if (s.nextButton) {
            plt.registerListener(s.nextButton, 'click', function (ev) {
                onClickNext(s, plt, ev);
            }, { zone: false }, unregs);
        }
        if (s.prevButton) {
            plt.registerListener(s.prevButton, 'click', function (ev) {
                onClickPrev(s, plt, ev);
            }, { zone: false }, unregs);
        }
        if (s.paginationType) {
            plt.registerListener(s._paginationContainer, 'click', function (ev) {
                onClickIndex(s, plt, ev);
            }, { zone: false }, unregs);
        }
        // Prevent Links Clicks
        if (s.preventClicks || s.preventClicksPropagation) {
            plt.registerListener(touchEventsTarget, 'click', function (ev) {
                preventClicks(s, ev);
            }, { zone: false, capture: true }, unregs);
        }
        // return a function that removes all of the added listeners
        return function () {
            resizeObs.unsubscribe();
            unregs.forEach(function (unreg) {
                unreg();
            });
            unregs = null;
        };
    }
    exports.initEvents = initEvents;
    /*=========================
      Handle Clicks
      ===========================*/
    // Prevent Clicks
    function preventClicks(s, e) {
        if (!s._allowClick) {
            if (s.preventClicks) {
                e.preventDefault();
            }
            if (s.preventClicksPropagation && s._animating) {
                e.stopPropagation();
                e.stopImmediatePropagation();
            }
        }
    }
    // Clicks
    function onClickNext(s, plt, e) {
        e.preventDefault();
        if (s._isEnd && !s.loop) {
            return;
        }
        swiper_1.slideNext(s, plt);
    }
    function onClickPrev(s, plt, e) {
        e.preventDefault();
        if (s._isBeginning && !s.loop) {
            return;
        }
        swiper_1.slidePrev(s, plt);
    }
    function onClickIndex(s, plt, e) {
        var indexStr = e.target.getAttribute('data-slide-index');
        if (indexStr) {
            var index = parseInt(indexStr, 10);
            e.preventDefault();
            if (s.loop) {
                index = index + s.loopedSlides;
            }
            swiper_1.slideTo(s, plt, index);
        }
    }
    /*=========================
      Handle Touches
      ===========================*/
    function findElementInEvent(e, selector) {
        var el = e.target;
        if (!el.matches(selector)) {
            if (typeof selector === 'string') {
                el = el.closest(selector);
            }
            else if (selector.nodeType) {
                var parentEl = el.parentElement;
                while (parentEl) {
                    if (parentEl === selector) {
                        return selector;
                    }
                }
                return undefined;
            }
        }
        return el;
    }
    function updateClickedSlide(s, plt, e) {
        var slide = findElementInEvent(e, '.' + swiper_utils_1.CLS.slide);
        var slideIndex = -1;
        if (slide) {
            for (var i = 0; i < s._slides.length; i++) {
                if (s._slides[i] === slide) {
                    slideIndex = i;
                    break;
                }
            }
        }
        if (slide && slideIndex > -1) {
            s.clickedSlide = slide;
            s.clickedIndex = slideIndex;
        }
        else {
            s.clickedSlide = undefined;
            s.clickedIndex = undefined;
            return;
        }
        if (s.slideToClickedSlide && s.clickedIndex !== undefined && s.clickedIndex !== s._activeIndex) {
            var slideToIndex = s.clickedIndex;
            var realIndex;
            var slidesPerView = s.slidesPerView === 'auto' ? swiper_1.currentSlidesPerView(s) : s.slidesPerView;
            if (s.loop) {
                if (s._animating)
                    return;
                realIndex = parseInt(s.clickedSlide.getAttribute('data-swiper-slide-index'), 10);
                if (s.centeredSlides) {
                    if ((slideToIndex < s.loopedSlides - slidesPerView / 2) || (slideToIndex > s._slides.length - s.loopedSlides + slidesPerView / 2)) {
                        swiper_1.fixLoop(s, plt);
                        slideToIndex = swiper_utils_1.getElementIndex(s._wrapper.querySelector('.' + swiper_utils_1.CLS.slide + '[data-swiper-slide-index="' + realIndex + '"]:not(.' + swiper_utils_1.CLS.slideDuplicate + ')'));
                        plt.timeout(function () {
                            swiper_1.slideTo(s, plt, slideToIndex);
                        });
                    }
                    else {
                        swiper_1.slideTo(s, plt, slideToIndex);
                    }
                }
                else {
                    if (slideToIndex > s._slides.length - slidesPerView) {
                        swiper_1.fixLoop(s, plt);
                        slideToIndex = swiper_utils_1.getElementIndex(s._wrapper.querySelector('.' + swiper_utils_1.CLS.slide + '[data-swiper-slide-index="' + realIndex + '"]:not(.' + swiper_utils_1.CLS.slideDuplicate + ')'));
                        plt.timeout(function () {
                            swiper_1.slideTo(s, plt, slideToIndex);
                        });
                    }
                    else {
                        swiper_1.slideTo(s, plt, slideToIndex);
                    }
                }
            }
            else {
                swiper_1.slideTo(s, plt, slideToIndex);
            }
        }
    }
    var isTouched;
    var isMoved;
    var allowTouchCallbacks;
    var touchStartTime;
    var isScrolling;
    var currentTranslate;
    var startTranslate;
    var allowThresholdMove;
    // Last click time
    var lastClickTime = Date.now();
    var clickTimeout;
    // Velocities
    var velocities = [];
    var allowMomentumBounce;
    // Touch handlers
    var isTouchEvent;
    var startMoving;
    function onTouchStart(s, plt, ev) {
        (void 0) /* console.debug */;
        if (ev.originalEvent) {
            ev = ev.originalEvent;
        }
        s.originalEvent = ev;
        isTouchEvent = ev.type === 'touchstart';
        if (!isTouchEvent && 'which' in ev && ev.which === 3) {
            return;
        }
        if (s.noSwiping && findElementInEvent(ev, '.' + swiper_utils_1.CLS.noSwiping)) {
            s._allowClick = true;
            return;
        }
        if (s.swipeHandler) {
            if (!findElementInEvent(ev, s.swipeHandler))
                return;
        }
        var startX = s._touches.currentX = ev.type === 'touchstart' ? ev.targetTouches[0].pageX : ev.pageX;
        var startY = s._touches.currentY = ev.type === 'touchstart' ? ev.targetTouches[0].pageY : ev.pageY;
        // Do NOT start if iOS edge swipe is detected. Otherwise iOS app (UIWebView) cannot swipe-to-go-back anymore
        if (plt.is('ios') && s.iOSEdgeSwipeDetection && startX <= s.iOSEdgeSwipeThreshold) {
            return;
        }
        isTouched = true;
        isMoved = false;
        allowTouchCallbacks = true;
        isScrolling = undefined;
        startMoving = undefined;
        s._touches.startX = startX;
        s._touches.startY = startY;
        touchStartTime = Date.now();
        s._allowClick = true;
        swiper_1.updateContainerSize(s, plt);
        s.swipeDirection = undefined;
        if (s.threshold > 0) {
            allowThresholdMove = false;
        }
        if (ev.type !== 'touchstart') {
            var preventDefault = true;
            if (swiper_utils_1.isFormElement(ev.target)) {
                preventDefault = false;
            }
            plt.focusOutActiveElement();
            if (preventDefault) {
                ev.preventDefault();
            }
        }
        s.ionSlideTouchStart.emit(ev);
    }
    function onTouchMove(s, plt, ev) {
        (void 0) /* console.debug */;
        if (ev.originalEvent) {
            ev = ev.originalEvent;
        }
        s.originalEvent = ev;
        if (isTouchEvent && ev.type === 'mousemove')
            return;
        if (ev.preventedByNestedSwiper) {
            s._touches.startX = ev.type === 'touchmove' ? ev.targetTouches[0].pageX : ev.pageX;
            s._touches.startY = ev.type === 'touchmove' ? ev.targetTouches[0].pageY : ev.pageY;
            return;
        }
        if (s.onlyExternal) {
            // isMoved = true;
            s._allowClick = false;
            if (isTouched) {
                s._touches.startX = s._touches.currentX = ev.type === 'touchmove' ? ev.targetTouches[0].pageX : ev.pageX;
                s._touches.startY = s._touches.currentY = ev.type === 'touchmove' ? ev.targetTouches[0].pageY : ev.pageY;
                touchStartTime = Date.now();
            }
            return;
        }
        if (isTouchEvent && s.touchReleaseOnEdges && !s.loop) {
            if (!swiper_utils_1.isHorizontal(s)) {
                // Vertical
                if ((s._touches.currentY < s._touches.startY && s._translate <= swiper_utils_1.maxTranslate(s)) ||
                    (s._touches.currentY > s._touches.startY && s._translate >= swiper_utils_1.minTranslate(s))) {
                    return;
                }
            }
            else {
                if ((s._touches.currentX < s._touches.startX && s._translate <= swiper_utils_1.maxTranslate(s)) ||
                    (s._touches.currentX > s._touches.startX && s._translate >= swiper_utils_1.minTranslate(s))) {
                    return;
                }
            }
        }
        var activeEle = plt.getActiveElement();
        if (isTouchEvent && activeEle) {
            if (ev.target === activeEle && swiper_utils_1.isFormElement(ev.target)) {
                isMoved = true;
                s._allowClick = false;
                return;
            }
        }
        if (ev.targetTouches && ev.targetTouches.length > 1)
            return;
        s._touches.currentX = ev.type === 'touchmove' ? ev.targetTouches[0].pageX : ev.pageX;
        s._touches.currentY = ev.type === 'touchmove' ? ev.targetTouches[0].pageY : ev.pageY;
        if (typeof isScrolling === 'undefined') {
            var touchAngle;
            if (swiper_utils_1.isHorizontal(s) && s._touches.currentY === s._touches.startY || !swiper_utils_1.isHorizontal(s) && s._touches.currentX === s._touches.startX) {
                isScrolling = false;
            }
            else {
                touchAngle = Math.atan2(Math.abs(s._touches.currentY - s._touches.startY), Math.abs(s._touches.currentX - s._touches.startX)) * 180 / Math.PI;
                isScrolling = swiper_utils_1.isHorizontal(s) ? touchAngle > s.touchAngle : (90 - touchAngle > s.touchAngle);
            }
        }
        if (!isTouched)
            return;
        if (isScrolling) {
            isTouched = false;
            return;
        }
        s._allowClick = false;
        s.ionSlideDrag.emit(s);
        ev.preventDefault();
        if (s.touchMoveStopPropagation) {
            ev.stopPropagation();
        }
        if (!isMoved) {
            if (s.loop) {
                swiper_1.fixLoop(s, plt);
            }
            startTranslate = swiper_transition_1.getWrapperTranslate(s, plt);
            swiper_transition_1.setWrapperTransition(s, plt, 0);
            if (s._animating) {
                swiper_utils_1.triggerTransitionEnd(plt, s._wrapper);
            }
            if (s.autoplay && s._autoplaying) {
                if (s.autoplayDisableOnInteraction) {
                    swiper_1.stopAutoplay(s);
                }
                else {
                    swiper_1.pauseAutoplay(s, plt);
                }
            }
            allowMomentumBounce = false;
        }
        isMoved = true;
        var diff = s._touches.diff = swiper_utils_1.isHorizontal(s) ? s._touches.currentX - s._touches.startX : s._touches.currentY - s._touches.startY;
        diff = diff * s.touchRatio;
        if (s._rtl)
            diff = -diff;
        s.swipeDirection = diff > 0 ? 'prev' : 'next';
        currentTranslate = diff + startTranslate;
        var disableParentSwiper = true;
        if ((diff > 0 && currentTranslate > swiper_utils_1.minTranslate(s))) {
            disableParentSwiper = false;
            if (s.resistance) {
                currentTranslate = swiper_utils_1.minTranslate(s) - 1 + Math.pow(-swiper_utils_1.minTranslate(s) + startTranslate + diff, s.resistanceRatio);
            }
        }
        else if (diff < 0 && currentTranslate < swiper_utils_1.maxTranslate(s)) {
            disableParentSwiper = false;
            if (s.resistance)
                currentTranslate = swiper_utils_1.maxTranslate(s) + 1 - Math.pow(swiper_utils_1.maxTranslate(s) - startTranslate - diff, s.resistanceRatio);
        }
        if (disableParentSwiper) {
            ev.preventedByNestedSwiper = true;
        }
        // Directions locks
        if (!s._allowSwipeToNext && s.swipeDirection === 'next' && currentTranslate < startTranslate) {
            currentTranslate = startTranslate;
        }
        if (!s._allowSwipeToPrev && s.swipeDirection === 'prev' && currentTranslate > startTranslate) {
            currentTranslate = startTranslate;
        }
        // Threshold
        if (s.threshold > 0) {
            if (Math.abs(diff) > s.threshold || allowThresholdMove) {
                if (!allowThresholdMove) {
                    allowThresholdMove = true;
                    s._touches.startX = s._touches.currentX;
                    s._touches.startY = s._touches.currentY;
                    currentTranslate = startTranslate;
                    s._touches.diff = swiper_utils_1.isHorizontal(s) ? s._touches.currentX - s._touches.startX : s._touches.currentY - s._touches.startY;
                    return;
                }
            }
            else {
                currentTranslate = startTranslate;
                return;
            }
        }
        if (!s.followFinger)
            return;
        // Update active index in free mode
        if (s.freeMode || s.watchSlidesProgress) {
            swiper_index_1.updateActiveIndex(s);
        }
        if (s.freeMode) {
            // Velocity
            if (velocities.length === 0) {
                velocities.push({
                    position: s._touches[swiper_utils_1.isHorizontal(s) ? 'startX' : 'startY'],
                    time: touchStartTime
                });
            }
            velocities.push({
                position: s._touches[swiper_utils_1.isHorizontal(s) ? 'currentX' : 'currentY'],
                time: (new Date()).getTime()
            });
        }
        // Update progress
        swiper_progress_1.updateProgress(s, currentTranslate);
        // Update translate
        swiper_transition_1.setWrapperTranslate(s, plt, currentTranslate);
    }
    function onTouchEnd(s, plt, ev) {
        (void 0) /* console.debug */;
        if (ev.originalEvent) {
            ev = ev.originalEvent;
        }
        s.originalEvent = ev;
        if (allowTouchCallbacks) {
            s.ionSlideTouchEnd.emit(ev);
        }
        allowTouchCallbacks = false;
        if (!isTouched)
            return;
        // Time diff
        var touchEndTime = Date.now();
        var timeDiff = touchEndTime - touchStartTime;
        // Tap, doubleTap, Click
        if (s._allowClick) {
            updateClickedSlide(s, plt, ev);
            s._zone.run(function () {
                s.ionSlideTap.emit(s);
                if (timeDiff < 300 && (touchEndTime - lastClickTime) > 300) {
                    if (clickTimeout) {
                        plt.cancelTimeout(clickTimeout);
                    }
                    clickTimeout = plt.timeout(function () {
                        if (!s)
                            return;
                        if (s.paginationHide && s._paginationContainer && !ev.target.classList.contains(swiper_utils_1.CLS.bullet)) {
                            s._paginationContainer.classList.toggle(swiper_utils_1.CLS.paginationHidden);
                        }
                    }, 300);
                }
                if (timeDiff < 300 && (touchEndTime - lastClickTime) < 300) {
                    if (clickTimeout)
                        clearTimeout(clickTimeout);
                    s.ionSlideDoubleTap.emit(s);
                }
            });
        }
        lastClickTime = Date.now();
        plt.timeout(function () {
            if (s) {
                s._allowClick = true;
            }
        });
        if (!isTouched || !isMoved || !s.swipeDirection || s._touches.diff === 0 || currentTranslate === startTranslate) {
            isTouched = isMoved = false;
            return;
        }
        isTouched = isMoved = false;
        var currentPos;
        if (s.followFinger) {
            currentPos = s._rtl ? s._translate : -s._translate;
        }
        else {
            currentPos = -currentTranslate;
        }
        if (s.freeMode) {
            if (currentPos < -swiper_utils_1.minTranslate(s)) {
                swiper_1.slideTo(s, plt, s._activeIndex);
                return;
            }
            else if (currentPos > -swiper_utils_1.maxTranslate(s)) {
                if (s._slides.length < s._snapGrid.length) {
                    swiper_1.slideTo(s, plt, s._snapGrid.length - 1);
                }
                else {
                    swiper_1.slideTo(s, plt, s._slides.length - 1);
                }
                return;
            }
            if (s.freeModeMomentum) {
                if (velocities.length > 1) {
                    var lastMoveEvent = velocities.pop(), velocityEvent = velocities.pop();
                    var distance = lastMoveEvent.position - velocityEvent.position;
                    var time = lastMoveEvent.time - velocityEvent.time;
                    s.velocity = distance / time;
                    s.velocity = s.velocity / 2;
                    if (Math.abs(s.velocity) < s.freeModeMinimumVelocity) {
                        s.velocity = 0;
                    }
                    // this implies that the user stopped moving a finger then released.
                    // There would be no events with distance zero, so the last event is stale.
                    if (time > 150 || (new Date().getTime() - lastMoveEvent.time) > 300) {
                        s.velocity = 0;
                    }
                }
                else {
                    s.velocity = 0;
                }
                s.velocity = s.velocity * s.freeModeMomentumVelocityRatio;
                velocities.length = 0;
                var momentumDuration = 1000 * s.freeModeMomentumRatio;
                var momentumDistance = s.velocity * momentumDuration;
                var newPosition = s._translate + momentumDistance;
                if (s._rtl)
                    newPosition = -newPosition;
                var doBounce = false;
                var afterBouncePosition;
                var bounceAmount = Math.abs(s.velocity) * 20 * s.freeModeMomentumBounceRatio;
                if (newPosition < swiper_utils_1.maxTranslate(s)) {
                    if (s.freeModeMomentumBounce) {
                        if (newPosition + swiper_utils_1.maxTranslate(s) < -bounceAmount) {
                            newPosition = swiper_utils_1.maxTranslate(s) - bounceAmount;
                        }
                        afterBouncePosition = swiper_utils_1.maxTranslate(s);
                        doBounce = true;
                        allowMomentumBounce = true;
                    }
                    else {
                        newPosition = swiper_utils_1.maxTranslate(s);
                    }
                }
                else if (newPosition > swiper_utils_1.minTranslate(s)) {
                    if (s.freeModeMomentumBounce) {
                        if (newPosition - swiper_utils_1.minTranslate(s) > bounceAmount) {
                            newPosition = swiper_utils_1.minTranslate(s) + bounceAmount;
                        }
                        afterBouncePosition = swiper_utils_1.minTranslate(s);
                        doBounce = true;
                        allowMomentumBounce = true;
                    }
                    else {
                        newPosition = swiper_utils_1.minTranslate(s);
                    }
                }
                else if (s.freeModeSticky) {
                    var j = 0;
                    var nextSlide;
                    for (j = 0; j < s._snapGrid.length; j += 1) {
                        if (s._snapGrid[j] > -newPosition) {
                            nextSlide = j;
                            break;
                        }
                    }
                    if (Math.abs(s._snapGrid[nextSlide] - newPosition) < Math.abs(s._snapGrid[nextSlide - 1] - newPosition) || s.swipeDirection === 'next') {
                        newPosition = s._snapGrid[nextSlide];
                    }
                    else {
                        newPosition = s._snapGrid[nextSlide - 1];
                    }
                    if (!s._rtl)
                        newPosition = -newPosition;
                }
                // Fix duration
                if (s.velocity !== 0) {
                    if (s._rtl) {
                        momentumDuration = Math.abs((-newPosition - s._translate) / s.velocity);
                    }
                    else {
                        momentumDuration = Math.abs((newPosition - s._translate) / s.velocity);
                    }
                }
                else if (s.freeModeSticky) {
                    swiper_1.slideReset(s, plt);
                    return;
                }
                if (s.freeModeMomentumBounce && doBounce) {
                    swiper_progress_1.updateProgress(s, afterBouncePosition);
                    swiper_transition_1.setWrapperTransition(s, plt, momentumDuration);
                    swiper_transition_1.setWrapperTranslate(s, plt, newPosition);
                    swiper_1.onTransitionStart(s);
                    s._animating = true;
                    plt.transitionEnd(s._wrapper, function () {
                        if (!s || !allowMomentumBounce)
                            return;
                        swiper_transition_1.setWrapperTransition(s, plt, s.speed);
                        swiper_transition_1.setWrapperTranslate(s, plt, afterBouncePosition);
                        plt.transitionEnd(s._wrapper, function () {
                            if (!s)
                                return;
                            swiper_1.onTransitionEnd(s, plt);
                        });
                    });
                }
                else if (s.velocity) {
                    swiper_progress_1.updateProgress(s, newPosition);
                    swiper_transition_1.setWrapperTransition(s, plt, momentumDuration);
                    swiper_transition_1.setWrapperTranslate(s, plt, newPosition);
                    swiper_1.onTransitionStart(s);
                    if (!s._animating) {
                        s._animating = true;
                        plt.transitionEnd(s._wrapper, function () {
                            if (!s)
                                return;
                            swiper_1.onTransitionEnd(s, plt);
                        });
                    }
                }
                else {
                    swiper_progress_1.updateProgress(s, newPosition);
                }
                swiper_index_1.updateActiveIndex(s);
            }
            if (!s.freeModeMomentum || timeDiff >= s.longSwipesMs) {
                swiper_progress_1.updateProgress(s);
                swiper_index_1.updateActiveIndex(s);
            }
            return;
        }
        // Find current slide
        var stopIndex = 0;
        var groupSize = s._slidesSizesGrid[0];
        for (var i = 0; i < s._slidesGrid.length; i += s.slidesPerGroup) {
            if (typeof s._slidesGrid[i + s.slidesPerGroup] !== 'undefined') {
                if (currentPos >= s._slidesGrid[i] && currentPos < s._slidesGrid[i + s.slidesPerGroup]) {
                    stopIndex = i;
                    groupSize = s._slidesGrid[i + s.slidesPerGroup] - s._slidesGrid[i];
                }
            }
            else {
                if (currentPos >= s._slidesGrid[i]) {
                    stopIndex = i;
                    groupSize = s._slidesGrid[s._slidesGrid.length - 1] - s._slidesGrid[s._slidesGrid.length - 2];
                }
            }
        }
        // Find current slide size
        var ratio = (currentPos - s._slidesGrid[stopIndex]) / groupSize;
        if (timeDiff > s.longSwipesMs) {
            // Long touches
            if (!s.longSwipes) {
                swiper_1.slideTo(s, plt, s._activeIndex);
                return;
            }
            if (s.swipeDirection === 'next') {
                if (ratio >= s.longSwipesRatio) {
                    swiper_1.slideTo(s, plt, stopIndex + s.slidesPerGroup);
                }
                else {
                    swiper_1.slideTo(s, plt, stopIndex);
                }
            }
            if (s.swipeDirection === 'prev') {
                if (ratio > (1 - s.longSwipesRatio)) {
                    swiper_1.slideTo(s, plt, stopIndex + s.slidesPerGroup);
                }
                else {
                    swiper_1.slideTo(s, plt, stopIndex);
                }
            }
        }
        else {
            // Short swipes
            if (!s.shortSwipes) {
                swiper_1.slideTo(s, plt, s._activeIndex);
                return;
            }
            if (s.swipeDirection === 'next') {
                swiper_1.slideTo(s, plt, stopIndex + s.slidesPerGroup);
            }
            if (s.swipeDirection === 'prev') {
                swiper_1.slideTo(s, plt, stopIndex);
            }
        }
    }
    /*=========================
      Resize Handler
      ===========================*/
    var resizeId;
    function onResize(s, plt, forceUpdatePagination) {
        // TODO: hacky, we should use Resize Observer in the future
        if (resizeId) {
            plt.cancelTimeout(resizeId);
            resizeId = null;
        }
        resizeId = plt.timeout(function () { return doResize(s, plt, forceUpdatePagination); }, 200);
    }
    function doResize(s, plt, forceUpdatePagination) {
        resizeId = null;
        // Disable locks on resize
        var allowSwipeToPrev = s._allowSwipeToPrev;
        var allowSwipeToNext = s._allowSwipeToNext;
        s._allowSwipeToPrev = s._allowSwipeToNext = true;
        swiper_1.updateContainerSize(s, plt);
        swiper_1.updateSlidesSize(s, plt);
        if (s.slidesPerView === 'auto' || s.freeMode || forceUpdatePagination) {
            swiper_pagination_1.updatePagination(s);
        }
        if (s._spline) {
            s._spline = undefined;
        }
        var slideChangedBySlideTo = false;
        if (s.freeMode) {
            var newTranslate = Math.min(Math.max(s._translate, swiper_utils_1.maxTranslate(s)), swiper_utils_1.minTranslate(s));
            swiper_transition_1.setWrapperTranslate(s, plt, newTranslate);
            swiper_index_1.updateActiveIndex(s);
            swiper_classes_1.updateClasses(s);
            if (s.autoHeight) {
                swiper_1.updateAutoHeight(s);
            }
        }
        else {
            swiper_classes_1.updateClasses(s);
            if ((s.slidesPerView === 'auto' || s.slidesPerView > 1) && s._isEnd && !s.centeredSlides) {
                slideChangedBySlideTo = swiper_1.slideTo(s, plt, s._slides.length - 1, 0, false, true);
            }
            else {
                slideChangedBySlideTo = swiper_1.slideTo(s, plt, s._activeIndex, 0, false, true);
            }
        }
        // Return locks after resize
        s._allowSwipeToPrev = allowSwipeToPrev;
        s._allowSwipeToNext = allowSwipeToNext;
    }
});
//# sourceMappingURL=swiper-events.js.map