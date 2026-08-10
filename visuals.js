(() => {
  const root = document.documentElement;
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
  let isReduced = motionQuery.matches;
  let manualPaused = false;

  try {
    manualPaused = window.sessionStorage.getItem("aw-motion-paused") === "true";
  } catch {
    // The static page is the fallback when storage is unavailable.
  }

  const heroStage = document.querySelector("[data-hero-stage]");
  const heroFrame = heroStage?.querySelector(".aw-hero-art-frame");
  const heroVisual = document.querySelector("[data-hero-visual]");
  const opening = document.querySelector("[data-aw-opening]");
  const openingPicture = document.querySelector("[data-aw-opening-picture]");
  const openingDay = document.querySelector("[data-aw-opening-day]");
  const openingMaterial = document.querySelector("[data-aw-opening-material]");
  const openingMaterialA = openingMaterial?.querySelector(".aw-opening-material-a");
  const openingMaterialW = openingMaterial?.querySelector(".aw-opening-material-w");
  const openingMaterialSource = document.querySelector("[data-aw-opening-material-source]");
  const openingNight = document.querySelector("[data-aw-opening-night]");
  const openingAtmosphere = opening?.querySelector(".aw-opening-atmosphere");
  const openingBrand = opening?.querySelector(".aw-opening-brand");
  const openingSkip = document.querySelector("[data-aw-opening-skip]");
  const signalCanvas = document.querySelector("[data-signal-canvas]");
  const depthTargets = document.querySelectorAll("[data-depth]");
  const openingContentTargets = [
    document.querySelector(".site-header"),
    document.querySelector("main"),
    document.querySelector(".site-footer"),
    document.querySelector(".aw-mobile-cta"),
  ].filter((target) => target instanceof HTMLElement);

  const motionPaused = () => isReduced || manualPaused;
  const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);
  const smooth = (value) => value * value * (3 - 2 * value);
  const openingAnimations = [];
  let openingDone = !root.classList.contains("aw-opening-pending");
  let openingHardTimer = 0;
  let openingUiTimer = 0;
  let openingNightTimer = 0;
  let openingToken = 0;
  let openingNightReady = false;
  let signalsReadyAt = 0;
  let scrollFrame = 0;
  let animationFrame = 0;
  let pointerFrame = 0;
  let heroIsVisible = true;
  let context = null;
  let width = 0;
  let height = 0;
  let ratio = 1;
  let nodes = [];
  let pointerActive = false;
  let pointerClientX = 0;
  let pointerClientY = 0;
  let pointerX = 0;
  let pointerY = 0;

  try {
    context = signalCanvas instanceof HTMLCanvasElement
      ? signalCanvas.getContext("2d", { alpha: true })
      : null;
  } catch {
    // Canvas signals are decorative; the opening and content do not depend on them.
  }

  const cancelOpeningAnimations = () => {
    openingAnimations.splice(0).forEach((animation) => {
      try {
        animation.cancel();
      } catch {
        // An already-finished animation needs no further cleanup.
      }
    });
  };

  const clearOpeningTimers = () => {
    window.clearTimeout(openingHardTimer);
    window.clearTimeout(openingUiTimer);
    window.clearTimeout(openingNightTimer);
    openingHardTimer = 0;
    openingUiTimer = 0;
    openingNightTimer = 0;
  };

  const setOpeningContentInert = (inert) => {
    openingContentTargets.forEach((target) => {
      target.inert = inert;
    });
  };

  const stopSignals = () => {
    if (animationFrame) window.cancelAnimationFrame(animationFrame);
    animationFrame = 0;
  };

  const startSignals = () => {
    if (
      !context
      || !openingDone
      || motionPaused()
      || !heroIsVisible
      || document.hidden
      || window.innerWidth <= 960
      || width < 560
    ) return;
    stopSignals();
    drawSignals(0, true);
  };

  const finishOpening = (reason = "complete", options = {}) => {
    if (openingDone && !root.classList.contains("aw-opening-pending")) return;
    const showNight = options.showNight ?? !motionPaused();
    const completedNormally = reason === "complete";
    openingDone = true;
    openingToken += 1;
    clearOpeningTimers();
    cancelOpeningAnimations();
    setOpeningContentInert(false);
    root.classList.toggle("aw-opening-bypassed", !completedNormally);
    root.classList.add("aw-opening-ui");

    if (showNight) heroStage?.classList.add("is-cinema-arrived");
    else heroStage?.classList.remove("is-cinema-arrived");

    openingPicture?.style.removeProperty("will-change");
    openingMaterial?.style.removeProperty("will-change");
    openingNight?.style.removeProperty("will-change");
    window.__awOpeningGate?.release(reason);
    root.classList.remove("aw-opening-running", "aw-opening-ui");
    root.dataset.awOpeningState = "done";
    root.dataset.awOpeningReason = reason;
    signalsReadyAt = completedNormally ? window.performance.now() + 420 : 0;
    window.setTimeout(startSignals, completedNormally ? 420 : 0);
  };

  window.__awFinishOpening = (reason = "skip") => finishOpening(reason, { showNight: openingNightReady && !motionPaused() });

  const imageReady = async (image, timeoutMs) => {
    if (!(image instanceof HTMLImageElement)) return false;
    if (image.complete) return image.naturalWidth > 0;
    let timeoutId = 0;
    try {
      const decoded = typeof image.decode === "function"
        ? Promise.resolve().then(() => image.decode()).then(() => true).catch(() => false)
        : new Promise((resolve) => {
          image.addEventListener("load", () => resolve(true), { once: true });
          image.addEventListener("error", () => resolve(false), { once: true });
        });
      const timedOut = new Promise((resolve) => {
        timeoutId = window.setTimeout(() => resolve(false), timeoutMs);
      });
      return Boolean(await Promise.race([decoded, timedOut]));
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const animateElement = (element, keyframes, options) => {
    if (!(element instanceof Element) || typeof element.animate !== "function") return null;
    const animation = element.animate(keyframes, options);
    openingAnimations.push(animation);
    return animation;
  };

  const playOpening = async () => {
    const mobile = window.innerWidth <= 620;
    const hardBudget = mobile ? 3000 : 3380;
    const remainingAtStart = hardBudget - window.performance.now();
    if (
      openingDone
      || motionPaused()
      || document.hidden
      || !(opening instanceof HTMLElement)
      || !(openingPicture instanceof HTMLElement)
      || !(heroFrame instanceof HTMLElement)
      || remainingAtStart < 1500
    ) {
      finishOpening("not-eligible", { showNight: false });
      return;
    }

    const token = openingToken;
    setOpeningContentInert(true);
    root.dataset.awOpeningState = "preflight";
    const decodeBudget = clamp(remainingAtStart - 1350, 180, 650);
    const [dayReady, nightReady, materialSourceReady] = await Promise.all([
      imageReady(openingDay, decodeBudget),
      imageReady(openingNight, decodeBudget),
      imageReady(openingMaterialSource, decodeBudget),
    ]);
    openingNightReady = nightReady;
    if (token !== openingToken || openingDone) return;
    const remainingAfterDecode = hardBudget - window.performance.now();
    const minimumDuration = mobile ? 2100 : 2400;
    if (!dayReady || motionPaused() || document.hidden || remainingAfterDecode < minimumDuration + 100) {
      finishOpening(dayReady ? "late-start" : "day-image-unavailable", { showNight: false });
      return;
    }

    const preferredDuration = mobile ? 2520 : 3040;
    const duration = Math.min(preferredDuration, remainingAfterDecode - 100);
    const backgroundRiseEnd = mobile ? 0.48 : 0.5;
    const dayHoldEnd = mobile ? 0.52 : 0.54;
    const nightEnd = mobile ? 0.78 : 0.8;
    const nightHoldEnd = mobile ? 0.86 : 0.88;
    const uiAt = duration * (mobile ? 0.64 : 0.65);
    const nightAt = duration * (mobile ? 0.58 : 0.6);
    root.classList.add("aw-opening-running");
    root.dataset.awOpeningState = "playing";
    openingPicture.style.willChange = "opacity";
    if (openingMaterial instanceof HTMLElement) openingMaterial.style.willChange = "opacity";
    if (openingNight instanceof HTMLElement) openingNight.style.willChange = "opacity";

    const pictureAnimation = animateElement(openingPicture, [
      { opacity: 1, offset: 0 },
      { opacity: 1, offset: nightHoldEnd },
      { opacity: 1, offset: 0.9 },
      { opacity: 0, offset: 1 },
    ], {
      duration,
      easing: "cubic-bezier(.22, .61, .36, 1)",
      fill: "forwards",
    });

    animateElement(openingDay, [
      { opacity: 0.08, offset: 0 },
      { opacity: 0.18, offset: 0.08 },
      { opacity: 0.96, offset: backgroundRiseEnd },
      { opacity: 1, offset: 1 },
    ], {
      duration,
      easing: "cubic-bezier(.22, .61, .36, 1)",
      fill: "forwards",
    });

    const materialReady = materialSourceReady
      && openingMaterialSource instanceof HTMLImageElement
      && openingMaterialSource.naturalWidth > 0;
    const maskSupported = typeof CSS !== "undefined" && typeof CSS.supports === "function"
      && (CSS.supports("mask-image", "url(\"assets/brand/amorworks/source/amorworks-wordmark-official-native.png\")")
        || CSS.supports("-webkit-mask-image", "url(\"assets/brand/amorworks/source/amorworks-wordmark-official-native.png\")"));
    if (materialReady && maskSupported) {
      const logoDuration = duration * (mobile ? 0.42 : 0.44);
      animateElement(openingMaterial, [
        { opacity: 0, offset: 0 },
        { opacity: 1, offset: 0.1 },
        { opacity: 1, offset: 0.72 },
        { opacity: 0, offset: 1 },
      ], {
        duration: logoDuration,
        easing: "cubic-bezier(.2, .72, .2, 1)",
        fill: "forwards",
      });
      animateElement(openingMaterialA, [
        { opacity: 0.12, transform: "translate3d(-8px, -16px, 0) scale(1.16)", offset: 0 },
        { opacity: 1, transform: "translate3d(-3px, -5px, 0) scale(1.055)", offset: 0.36 },
        { opacity: 0.92, transform: "translate3d(0, 0, 0) scale(1)", offset: 0.7 },
        { opacity: 0, transform: "translate3d(0, 0, 0) scale(0.995)", offset: 1 },
      ], {
        duration: logoDuration,
        easing: "cubic-bezier(.16, 1, .3, 1)",
        fill: "forwards",
      });
      animateElement(openingMaterialW, [
        { opacity: 0, transform: "translate3d(10px, 14px, 0) scale(0.88)", offset: 0 },
        { opacity: 0.18, transform: "translate3d(8px, 10px, 0) scale(0.92)", offset: 0.1 },
        { opacity: 1, transform: "translate3d(3px, 4px, 0) scale(1.07)", offset: 0.44 },
        { opacity: 0.9, transform: "translate3d(0, 0, 0) scale(1)", offset: 0.74 },
        { opacity: 0, transform: "translate3d(0, 0, 0) scale(0.995)", offset: 1 },
      ], {
        duration: logoDuration,
        easing: "cubic-bezier(.16, 1, .3, 1)",
        fill: "forwards",
      });
    }

    if (nightReady) {
      animateElement(openingNight, [
        { opacity: 0, offset: 0 },
        { opacity: 0, offset: dayHoldEnd },
        { opacity: 1, offset: nightEnd },
        { opacity: 1, offset: 1 },
      ], { duration, easing: "cubic-bezier(.22, .72, .2, 1)", fill: "forwards" });
    }

    animateElement(openingAtmosphere, [
      { opacity: 0.92, offset: 0 },
      { opacity: 0.72, offset: backgroundRiseEnd },
      { opacity: 0.34, offset: 0.88 },
      { opacity: 0, offset: 1 },
    ], { duration, easing: "ease", fill: "forwards" });

    animateElement(openingBrand, [
      { opacity: 0, offset: 0 },
      { opacity: 0, offset: 0.3 },
      { opacity: 0.72, offset: 0.44 },
      { opacity: 0.72, offset: 0.66 },
      { opacity: 0, offset: 0.78 },
      { opacity: 0, offset: 1 },
    ], { duration, easing: "ease", fill: "forwards" });

    animateElement(openingSkip, [
      { opacity: 1, offset: 0 },
      { opacity: 1, offset: 0.92 },
      { opacity: 0, offset: 1 },
    ], { duration, easing: "ease", fill: "forwards" });

    openingNightTimer = window.setTimeout(() => {
      if (nightReady && token === openingToken && !openingDone) heroStage.classList.add("is-cinema-arrived");
    }, nightAt);
    openingUiTimer = window.setTimeout(() => {
      if (token !== openingToken || openingDone) return;
      setOpeningContentInert(false);
      root.classList.add("aw-opening-ui");
      root.dataset.awOpeningState = "revealing-ui";
    }, uiAt);
    openingHardTimer = window.setTimeout(() => {
      finishOpening("hard-timeout", { showNight: nightReady && !motionPaused() });
    }, Math.max(200, hardBudget - window.performance.now()));

    if (!pictureAnimation) {
      finishOpening("animation-api-unavailable", { showNight: nightReady && !motionPaused() });
      return;
    }

    pictureAnimation.finished
      .then(() => finishOpening("complete", { showNight: nightReady && !motionPaused() }))
      .catch(() => {
        if (!openingDone) finishOpening("animation-cancelled", { showNight: false });
      });
  };

  openingSkip?.addEventListener("click", () => finishOpening("skip", { showNight: openingNightReady && !motionPaused() }));
  window.addEventListener("hashchange", () => finishOpening("hashchange", { showNight: false }));
  window.addEventListener("pagehide", () => finishOpening("pagehide", { showNight: false }), { once: true });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) finishOpening("bfcache", { showNight: false });
  });
  window.addEventListener("resize", () => {
    requestParallaxSync();
    resizeCanvas();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      finishOpening("hidden", { showNight: false });
      stopSignals();
    } else {
      startSignals();
    }
  });

  const syncParallax = () => {
    scrollFrame = 0;
    if (motionPaused() || window.innerWidth <= 960) {
      depthTargets.forEach((target) => target.style.setProperty("--parallax-y", "0px"));
      return;
    }
    const center = window.innerHeight * 0.5;
    depthTargets.forEach((target) => {
      const depth = Number(target.dataset.depth || "0");
      const rect = target.getBoundingClientRect();
      const distance = rect.top + rect.height * 0.5 - center;
      const offset = clamp(distance * depth * -0.18, -34, 34);
      target.style.setProperty("--parallax-y", `${offset.toFixed(2)}px`);
    });
  };

  function requestParallaxSync() {
    if (!scrollFrame) scrollFrame = window.requestAnimationFrame(syncParallax);
  }

  window.addEventListener("scroll", requestParallaxSync, { passive: true });

  const seeded = (index) => {
    const value = Math.sin(index * 9283.17 + 41.73) * 43758.5453;
    return value - Math.floor(value);
  };

  const createNodes = () => {
    const count = width < 680 ? 9 : 14;
    nodes = Array.from({ length: count }, (_, index) => ({
      x: seeded(index + 1) * width,
      y: seeded(index + 51) * height,
      radius: 0.7 + seeded(index + 101) * 1.7,
      phase: seeded(index + 151) * Math.PI * 2,
      speed: 0.2 + seeded(index + 201) * 0.55,
      drift: 7 + seeded(index + 251) * 18,
      warm: seeded(index + 301) > 0.72,
    }));
  };

  const pointFor = (node, time, still) => {
    if (still) return { x: node.x, y: node.y };
    const phase = time * 0.00016 * node.speed + node.phase;
    let x = node.x + Math.cos(phase) * node.drift;
    let y = node.y + Math.sin(phase * 0.86) * node.drift;
    if (pointerActive) {
      const dx = pointerX - x;
      const dy = pointerY - y;
      const distance = Math.hypot(dx, dy);
      if (distance < 200 && distance > 0) {
        const force = (1 - distance / 200) * 14;
        x += (dx / distance) * force;
        y += (dy / distance) * force;
      }
    }
    return { x, y };
  };

  function drawSignals(time, still = false) {
    if (!context) return;
    context.clearRect(0, 0, width, height);
    const points = nodes.map((node) => pointFor(node, time, still));
    const connectionDistance = width < 680 ? 170 : 300;

    for (let first = 0; first < points.length; first += 1) {
      for (let second = first + 1; second < points.length; second += 1) {
        const dx = points[first].x - points[second].x;
        const dy = points[first].y - points[second].y;
        const distance = Math.hypot(dx, dy);
        if (distance > connectionDistance) continue;
        const strength = (1 - distance / connectionDistance) * 0.25;
        const gradient = context.createLinearGradient(points[first].x, points[first].y, points[second].x, points[second].y);
        gradient.addColorStop(0, `rgba(115, 200, 207, ${strength})`);
        gradient.addColorStop(1, `rgba(224, 194, 124, ${strength * 0.8})`);
        context.beginPath();
        context.moveTo(points[first].x, points[first].y);
        context.lineTo(points[second].x, points[second].y);
        context.strokeStyle = gradient;
        context.lineWidth = 0.7;
        context.stroke();
      }
    }

    nodes.forEach((node, index) => {
      const point = points[index];
      context.beginPath();
      context.arc(point.x, point.y, node.radius, 0, Math.PI * 2);
      context.fillStyle = node.warm ? "rgba(224, 194, 124, 0.72)" : "rgba(115, 200, 207, 0.68)";
      context.fill();
    });
  }

  function animateSignals(time) {
    animationFrame = 0;
    if (!heroIsVisible || document.hidden || motionPaused() || !openingDone || window.innerWidth <= 960 || width < 560) return;
    drawSignals(time);
    animationFrame = window.requestAnimationFrame(animateSignals);
  }

  function resizeCanvas() {
    if (!context || !(signalCanvas instanceof HTMLCanvasElement) || !heroStage) return;
    const bounds = heroStage.getBoundingClientRect();
    width = Math.max(Math.round(bounds.width), 1);
    height = Math.max(Math.round(heroStage.offsetHeight), 1);
    ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    signalCanvas.width = Math.round(width * ratio);
    signalCanvas.height = Math.round(height * ratio);
    signalCanvas.style.width = `${width}px`;
    signalCanvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    createNodes();
    if (motionPaused() || !openingDone || window.innerWidth <= 960 || width < 560) {
      stopSignals();
      drawSignals(0, true);
    } else {
      startSignals();
    }
  }

  const flushHeroPointer = () => {
    pointerFrame = 0;
    if (!heroStage || motionPaused() || !pointerActive || !openingDone) return;
    const bounds = heroStage.getBoundingClientRect();
    pointerX = pointerClientX - bounds.left;
    pointerY = pointerClientY - bounds.top;
  };

  heroStage?.addEventListener("pointermove", (event) => {
    if (motionPaused() || !openingDone || !finePointerQuery.matches || event.pointerType === "touch") return;
    pointerClientX = event.clientX;
    pointerClientY = event.clientY;
    pointerActive = true;
    if (!pointerFrame) pointerFrame = window.requestAnimationFrame(flushHeroPointer);
  }, { passive: true });

  heroStage?.addEventListener("pointerleave", () => {
    if (pointerFrame) window.cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
    pointerActive = false;
  }, { passive: true });

  const setStaticVisual = () => {
    finishOpening("motion-paused", { showNight: false });
    heroStage?.classList.remove("is-cinema-arrived");
    depthTargets.forEach((target) => target.style.setProperty("--parallax-y", "0px"));
    if (pointerFrame) window.cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
    pointerActive = false;
    stopSignals();
    drawSignals(0, true);
  };

  const syncMotionPreference = (event) => {
    isReduced = event.matches;
    if (motionPaused()) setStaticVisual();
    else {
      requestParallaxSync();
      startSignals();
    }
  };

  if (typeof motionQuery.addEventListener === "function") motionQuery.addEventListener("change", syncMotionPreference);
  else motionQuery.addListener(syncMotionPreference);

  document.addEventListener("aw:motion-toggle", (event) => {
    manualPaused = Boolean(event.detail?.paused);
    if (motionPaused()) setStaticVisual();
    else {
      requestParallaxSync();
      startSignals();
    }
  });

  if ("IntersectionObserver" in window && heroStage) {
    const observer = new IntersectionObserver((entries) => {
      heroIsVisible = entries[0]?.isIntersecting ?? true;
      if (heroIsVisible) startSignals();
      else stopSignals();
    }, { rootMargin: "160px 0px" });
    observer.observe(heroStage);
  }

  if ("ResizeObserver" in window && heroStage) {
    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(heroStage);
  }

  syncParallax();
  resizeCanvas();
  if (openingDone) {
    root.dataset.awOpeningState = root.dataset.awOpeningState || "done";
    startSignals();
  } else {
    playOpening().catch(() => finishOpening("opening-error", { showNight: false }));
  }
})();
