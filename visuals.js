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
let heroVisualFrame = 0;

const syncHeroVisual = () => {
  heroVisualFrame = 0;
  if (!heroStage || !heroVisual || prefersReducedMotion) {
    if (heroVisual) heroVisual.style.setProperty("--hero-shift", "0px");
    return;
  }

  const rect = heroStage.getBoundingClientRect();
  const progress = Math.min(Math.max(-rect.top / Math.max(rect.height, 1), 0), 1);
  heroVisual.style.setProperty("--hero-shift", `${(progress * 120).toFixed(2)}px`);
};

const requestHeroVisualSync = () => {
  if (!heroVisual || heroVisualFrame) return;
  heroVisualFrame = window.requestAnimationFrame(syncHeroVisual);
};

if (heroVisual) {
  window.addEventListener("scroll", requestHeroVisualSync, { passive: true });
  window.addEventListener("resize", requestHeroVisualSync);
  requestHeroVisualSync();
}
