const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const revealTargets = document.querySelectorAll("[data-reveal]");
if (revealTargets.length && "IntersectionObserver" in window) {
  document.body.classList.add("has-reveal");

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.16 },
  );

  revealTargets.forEach((target) => revealObserver.observe(target));
}

const depthTargets = document.querySelectorAll("[data-depth]");
let depthFrame = 0;

const syncDepth = () => {
  depthFrame = 0;
  if (prefersReducedMotion || window.innerWidth < 821) {
    depthTargets.forEach((target) => target.style.setProperty("--parallax-y", "0px"));
    return;
  }

  const center = window.innerHeight * 0.5;
  depthTargets.forEach((target) => {
    const depth = Number(target.dataset.depth || "0");
    const rect = target.getBoundingClientRect();
    const offset = (rect.top + rect.height * 0.5 - center) * depth * -0.16;
    target.style.setProperty("--parallax-y", `${offset.toFixed(2)}px`);
  });
};

const requestDepthSync = () => {
  if (depthFrame) return;
  depthFrame = window.requestAnimationFrame(syncDepth);
};

window.addEventListener("scroll", requestDepthSync, { passive: true });
window.addEventListener("resize", requestDepthSync);
requestDepthSync();

const heroStage = document.querySelector("[data-hero-stage]");
const heroVisual = document.querySelector("[data-hero-visual]");
const heroSequence = document.querySelector("[data-hero-sequence]");
const heroSequenceFrame = document.querySelector("[data-hero-sequence-frame]");
const heroSequenceCount = Number(heroSequence?.dataset.frameCount || "0");
const heroSequenceFrames = Array.from({ length: heroSequenceCount }, (_, index) => (
  `assets/sc-hero-transition-${String(index).padStart(2, "0")}.webp`
));
let heroSequenceCurrentFrame = -1;
let heroVisualFrame = 0;

const clampProgress = (value) => Math.min(Math.max(value, 0), 1);
const smoothProgress = (value) => value * value * (3 - 2 * value);

const setHeroSequenceFrame = (progress) => {
  if (!heroSequenceFrame || !heroSequenceFrames.length) return;

  const frameIndex = Math.min(
    heroSequenceFrames.length - 1,
    Math.max(0, Math.round(progress * (heroSequenceFrames.length - 1))),
  );

  if (frameIndex !== heroSequenceCurrentFrame) {
    heroSequenceFrame.src = heroSequenceFrames[frameIndex];
    heroSequenceCurrentFrame = frameIndex;
  }
};

const syncHeroVisual = () => {
  heroVisualFrame = 0;
  if (!heroStage || !heroVisual || prefersReducedMotion) {
    if (heroStage) {
      heroStage.style.setProperty("--hero-night-opacity", "0");
      heroStage.style.setProperty("--hero-veil-opacity", "0.94");
      heroStage.style.setProperty("--hero-pan-x", "0px");
      heroStage.style.setProperty("--hero-pan-y", "0px");
      heroStage.style.setProperty("--hero-scale", "1.035");
      heroStage.style.setProperty("--hero-sequence-tilt-x", "0deg");
      heroStage.style.setProperty("--hero-sequence-tilt-y", "0deg");
      heroStage.style.setProperty("--hero-sequence-lift", "0px");
      heroStage.style.setProperty("--hero-sequence-scale", "1.01");
      heroStage.style.setProperty("--hero-sequence-blur", "0px");
    }
    setHeroSequenceFrame(0);
    return;
  }

  const rect = heroStage.getBoundingClientRect();
  const travel = Math.max(rect.height - window.innerHeight, rect.height * 0.34, 1);
  const progress = Math.min(Math.max(-rect.top / travel, 0), 1);
  const eased = smoothProgress(progress);
  let sequenceProgress = eased;

  if (heroSequence && window.innerWidth <= 620) {
    const sequenceRect = heroSequence.getBoundingClientRect();
    const start = window.innerHeight * 0.43;
    const end = window.innerHeight * -0.08;
    sequenceProgress = smoothProgress(clampProgress((start - sequenceRect.top) / (start - end)));
  }

  heroStage.style.setProperty("--hero-night-opacity", eased.toFixed(3));
  heroStage.style.setProperty("--hero-veil-opacity", (0.94 - eased * 0.18).toFixed(3));
  heroStage.style.setProperty("--hero-pan-x", `${(-26 * eased).toFixed(2)}px`);
  heroStage.style.setProperty("--hero-pan-y", `${(22 * eased).toFixed(2)}px`);
  heroStage.style.setProperty("--hero-scale", (1.035 + eased * 0.045).toFixed(3));
  heroStage.style.setProperty("--hero-sequence-tilt-x", `${(2.8 - sequenceProgress * 5.6).toFixed(2)}deg`);
  heroStage.style.setProperty("--hero-sequence-tilt-y", `${(-4.6 + sequenceProgress * 9.2).toFixed(2)}deg`);
  heroStage.style.setProperty("--hero-sequence-lift", `${(-10 * sequenceProgress).toFixed(2)}px`);
  heroStage.style.setProperty("--hero-sequence-scale", (1.01 + sequenceProgress * 0.025).toFixed(3));
  heroStage.style.setProperty("--hero-sequence-blur", `${(Math.sin(sequenceProgress * Math.PI) * 1.15).toFixed(2)}px`);
  setHeroSequenceFrame(sequenceProgress);
};

const requestHeroVisualSync = () => {
  if (!heroVisual || heroVisualFrame) return;
  heroVisualFrame = window.requestAnimationFrame(syncHeroVisual);
};

if (heroVisual) {
  heroSequenceFrames.slice(1).forEach((src) => {
    const img = new Image();
    img.src = src;
  });

  window.addEventListener("scroll", requestHeroVisualSync, { passive: true });
  window.addEventListener("resize", requestHeroVisualSync);
  requestHeroVisualSync();
}
