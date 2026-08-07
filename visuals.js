(() => {
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  const isReduced = motionQuery.matches;
  const heroStage = document.querySelector("[data-hero-stage]");
  const heroVisual = document.querySelector("[data-hero-visual]");
  const progressBar = document.querySelector("[data-site-progress]");
  const revealTargets = document.querySelectorAll("[data-reveal]");
  const depthTargets = document.querySelectorAll("[data-depth]");
  let scrollFrame = 0;

  const clamp = (value, min = 0, max = 1) => Math.min(Math.max(value, min), max);
  const smooth = (value) => value * value * (3 - 2 * value);

  if (revealTargets.length && "IntersectionObserver" in window && !isReduced) {
    document.body.classList.add("has-reveal");
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.1 },
    );
    revealTargets.forEach((target) => revealObserver.observe(target));
  }

  const syncScrollEffects = () => {
    scrollFrame = 0;
    const pageTravel = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const pageProgress = clamp(window.scrollY / pageTravel);
    if (progressBar) {
      progressBar.style.setProperty("--page-progress", pageProgress.toFixed(4));
    }

    if (isReduced) return;

    const desktop = window.innerWidth > 820;
    if (desktop) {
      const center = window.innerHeight * 0.5;
      depthTargets.forEach((target) => {
        const depth = Number(target.dataset.depth || "0");
        const rect = target.getBoundingClientRect();
        const distance = rect.top + rect.height * 0.5 - center;
        const offset = clamp(distance * depth * -0.18, -34, 34);
        target.style.setProperty("--parallax-y", `${offset.toFixed(2)}px`);
      });
    } else {
      depthTargets.forEach((target) => target.style.setProperty("--parallax-y", "0px"));
    }

    if (!heroStage || !heroVisual) return;
    const rect = heroStage.getBoundingClientRect();
    const travel = Math.max(rect.height - window.innerHeight * 0.45, window.innerHeight * 0.8, 1);
    const rawProgress = clamp(-rect.top / travel);
    const heroProgress = smooth(rawProgress);
    const direction = desktop ? 1 : 0.45;
    heroStage.style.setProperty("--hero-night-opacity", clamp(heroProgress * 1.08).toFixed(3));
    heroStage.style.setProperty("--hero-pan-x", `${(-18 * heroProgress * direction).toFixed(2)}px`);
    heroStage.style.setProperty("--hero-pan-y", `${(14 * heroProgress * direction).toFixed(2)}px`);
    heroStage.style.setProperty("--hero-scale", (1.02 + heroProgress * 0.05 * direction).toFixed(3));
  };

  const requestScrollSync = () => {
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(syncScrollEffects);
  };

  window.addEventListener("scroll", requestScrollSync, { passive: true });
  window.addEventListener("resize", requestScrollSync);
  syncScrollEffects();

  const canvas = document.querySelector("[data-signal-canvas]");
  if (!(canvas instanceof HTMLCanvasElement) || !heroStage) return;
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return;

  let width = 0;
  let height = 0;
  let ratio = 1;
  let animationFrame = 0;
  let heroIsVisible = true;
  let pointerActive = false;
  let pointerX = 0;
  let pointerY = 0;
  let nodes = [];

  const seeded = (index) => {
    const value = Math.sin(index * 9283.17 + 41.73) * 43758.5453;
    return value - Math.floor(value);
  };

  const createNodes = () => {
    const count = width < 680 ? 20 : Math.min(46, Math.max(30, Math.round(width / 34)));
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

  const resizeCanvas = () => {
    const bounds = heroStage.getBoundingClientRect();
    width = Math.max(Math.round(bounds.width), 1);
    height = Math.max(Math.round(heroStage.offsetHeight), 1);
    ratio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    createNodes();
    if (isReduced || width < 560) drawSignals(0, true);
  };

  const pointFor = (node, time, still) => {
    if (still) return { x: node.x, y: node.y };
    const t = time * 0.00016 * node.speed + node.phase;
    let x = node.x + Math.cos(t) * node.drift;
    let y = node.y + Math.sin(t * 0.86) * node.drift;
    if (pointerActive) {
      const dx = pointerX - x;
      const dy = pointerY - y;
      const distance = Math.hypot(dx, dy);
      if (distance < 240 && distance > 0) {
        const force = (1 - distance / 240) * 20;
        x += (dx / distance) * force;
        y += (dy / distance) * force;
      }
    }
    return { x, y };
  };

  function drawSignals(time, still = false) {
    context.clearRect(0, 0, width, height);
    const points = nodes.map((node) => pointFor(node, time, still));
    const connectionDistance = width < 680 ? 132 : 178;

    for (let first = 0; first < points.length; first += 1) {
      for (let second = first + 1; second < points.length; second += 1) {
        const dx = points[first].x - points[second].x;
        const dy = points[first].y - points[second].y;
        const distance = Math.hypot(dx, dy);
        if (distance > connectionDistance) continue;
        const strength = (1 - distance / connectionDistance) * 0.25;
        const gradient = context.createLinearGradient(
          points[first].x,
          points[first].y,
          points[second].x,
          points[second].y,
        );
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

  const animateSignals = (time) => {
    animationFrame = 0;
    if (!heroIsVisible || document.hidden || isReduced || width < 560) return;
    drawSignals(time);
    animationFrame = window.requestAnimationFrame(animateSignals);
  };

  const startSignals = () => {
    if (animationFrame || isReduced || width < 560 || !heroIsVisible || document.hidden) return;
    animationFrame = window.requestAnimationFrame(animateSignals);
  };

  const stopSignals = () => {
    if (!animationFrame) return;
    window.cancelAnimationFrame(animationFrame);
    animationFrame = 0;
  };

  heroStage.addEventListener("pointermove", (event) => {
    const bounds = heroStage.getBoundingClientRect();
    pointerX = event.clientX - bounds.left;
    pointerY = event.clientY - bounds.top;
    pointerActive = true;
  }, { passive: true });

  heroStage.addEventListener("pointerleave", () => {
    pointerActive = false;
  }, { passive: true });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopSignals();
    else startSignals();
  });

  if ("IntersectionObserver" in window) {
    const heroObserver = new IntersectionObserver((entries) => {
      heroIsVisible = entries[0]?.isIntersecting ?? true;
      if (heroIsVisible) startSignals();
      else stopSignals();
    }, { rootMargin: "160px 0px" });
    heroObserver.observe(heroStage);
  }

  if ("ResizeObserver" in window) {
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(heroStage);
  } else {
    window.addEventListener("resize", resizeCanvas);
  }

  resizeCanvas();
  startSignals();
})();
