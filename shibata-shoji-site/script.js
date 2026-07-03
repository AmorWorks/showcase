const followingHeader = document.querySelector("#following-header");
const pageTop = document.querySelector(".pagetop");
const menuButton = document.querySelector("[data-menu-button]");
const spNav = document.querySelector("[data-sp-nav]");

const syncScrollState = () => {
  const isScrolled = window.scrollY > 800;
  followingHeader?.classList.toggle("is-show", window.scrollY > 360);
  pageTop?.classList.toggle("is-visible", isScrolled);
};

window.addEventListener("scroll", syncScrollState, { passive: true });
syncScrollState();

menuButton?.addEventListener("click", () => {
  menuButton.classList.toggle("active");
  spNav?.classList.toggle("panelactive");
  document.body.classList.toggle("fixed");
});

spNav?.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    menuButton?.classList.remove("active");
    spNav.classList.remove("panelactive");
    document.body.classList.remove("fixed");
  }
});
