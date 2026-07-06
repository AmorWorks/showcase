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

const clampProgress = (value) => Math.min(Math.max(value, 0), 1);
const smoothProgress = (value) => value * value * (3 - 2 * value);
const popupProgress = (progress, start, end) => {
  const fadeIn = smoothProgress(clampProgress((progress - start) / 0.08));
  const fadeOut = 1 - smoothProgress(clampProgress((progress - end) / 0.12));
  return Math.min(fadeIn, fadeOut);
};

const setHeroPopup = (index, value) => {
  const opacity = value.toFixed(3);
  heroStage.style.setProperty(`--hero-pop-${index}`, opacity);
  heroStage.style.setProperty(`--hero-pop-${index}-y`, `${((1 - value) * 18).toFixed(2)}px`);
  heroStage.style.setProperty(`--hero-pop-${index}-scale`, (0.96 + value * 0.04).toFixed(3));
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
      heroStage.style.setProperty("--hero-mobile-shift", "0px");
      heroStage.style.setProperty("--hero-mobile-scale", "1.02");
      for (let index = 1; index <= 3; index += 1) {
        heroStage.style.setProperty(`--hero-pop-${index}`, "0");
        heroStage.style.setProperty(`--hero-pop-${index}-y`, "18px");
        heroStage.style.setProperty(`--hero-pop-${index}-scale`, "0.96");
      }
    }
    return;
  }

  const rect = heroStage.getBoundingClientRect();
  const visualHeight = Math.max(heroVisual.getBoundingClientRect().height, window.innerHeight * 0.62, 1);
  const travel = Math.max(visualHeight * 0.96, window.innerHeight * 0.58, 1);
  const progress = Math.min(Math.max(-rect.top / travel, 0), 1);
  const eased = smoothProgress(progress);
  const mobileLiftProgress = smoothProgress(clampProgress(progress * 1.2));
  const firstPopup = popupProgress(progress, 0.08, 0.28);
  const secondPopup = popupProgress(progress, 0.34, 0.54);
  const thirdPopup = popupProgress(progress, 0.6, 0.88);

  heroStage.style.setProperty("--hero-night-opacity", eased.toFixed(3));
  heroStage.style.setProperty("--hero-veil-opacity", (0.94 - eased * 0.18).toFixed(3));
  heroStage.style.setProperty("--hero-pan-x", `${(-26 * eased).toFixed(2)}px`);
  heroStage.style.setProperty("--hero-pan-y", `${(22 * eased).toFixed(2)}px`);
  heroStage.style.setProperty("--hero-scale", (1.035 + eased * 0.045).toFixed(3));
  heroStage.style.setProperty("--hero-mobile-shift", `${(-34 * mobileLiftProgress).toFixed(2)}px`);
  heroStage.style.setProperty("--hero-mobile-scale", (1.02 + mobileLiftProgress * 0.035).toFixed(3));
  setHeroPopup(1, firstPopup);
  setHeroPopup(2, secondPopup);
  setHeroPopup(3, thirdPopup);
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
