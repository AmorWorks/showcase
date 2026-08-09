(() => {
  const body = document.body;
  const header = document.querySelector("[data-header]");
  const nav = document.querySelector("[data-nav]");
  const navToggle = document.querySelector("[data-nav-toggle], .nav-toggle");
  const applicationForm = document.querySelector("[data-application-form]");
  const applicationStatus = document.querySelector("[data-application-status]");
  const applicationOutput = document.querySelector("[data-application-output]");
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let lastFocusedElement = null;
  let headerFrame = 0;

  const syncNavigationAccessibility = (isOpen = false) => {
    if (!nav) return;
    const shouldHide = window.innerWidth <= 820 && !isOpen;
    nav.toggleAttribute("inert", shouldHide);
    if (shouldHide) nav.setAttribute("aria-hidden", "true");
    else nav.removeAttribute("aria-hidden");
  };

  document.querySelectorAll("[data-year]").forEach((year) => {
    year.textContent = new Date().getFullYear();
  });

  const progressBar = document.querySelector("[data-site-progress]") || (() => {
    const wrapper = document.createElement("div");
    const bar = document.createElement("span");
    wrapper.className = "site-progress";
    wrapper.setAttribute("aria-hidden", "true");
    bar.dataset.siteProgress = "";
    wrapper.appendChild(bar);
    body.prepend(wrapper);
    return bar;
  })();

  const syncHeaderAndProgress = () => {
    headerFrame = 0;
    header?.classList.toggle("is-scrolled", window.scrollY > 12);
    const travel = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    progressBar.style.setProperty("--page-progress", Math.min(Math.max(window.scrollY / travel, 0), 1).toFixed(4));
  };

  const requestHeaderSync = () => {
    if (headerFrame) return;
    headerFrame = window.requestAnimationFrame(syncHeaderAndProgress);
  };

  syncHeaderAndProgress();
  window.addEventListener("scroll", requestHeaderSync, { passive: true });
  window.addEventListener("resize", requestHeaderSync);

  const closeNavigation = ({ restoreFocus = false } = {}) => {
    if (!navToggle || !nav || !header) return;
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "メニューを開く");
    nav.classList.remove("is-open");
    header.classList.remove("is-open");
    body.classList.remove("nav-open");
    if (restoreFocus && lastFocusedElement instanceof HTMLElement) {
      lastFocusedElement.focus();
    }
    syncNavigationAccessibility(false);
  };

  const openNavigation = () => {
    if (!navToggle || !nav || !header) return;
    lastFocusedElement = document.activeElement;
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "メニューを閉じる");
    nav.classList.add("is-open");
    header.classList.add("is-open");
    body.classList.add("nav-open");
    syncNavigationAccessibility(true);
    window.requestAnimationFrame(() => nav.querySelector("a")?.focus());
  };

  if (navToggle && nav && header) {
    syncNavigationAccessibility(false);

    navToggle.addEventListener("click", () => {
      const isOpen = navToggle.getAttribute("aria-expanded") === "true";
      if (isOpen) closeNavigation({ restoreFocus: true });
      else openNavigation();
    });

    nav.addEventListener("click", (event) => {
      if (event.target instanceof HTMLAnchorElement) closeNavigation();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("is-open")) {
        closeNavigation({ restoreFocus: true });
      }

      if (event.key === "Tab" && nav.classList.contains("is-open")) {
        const focusable = [navToggle, ...nav.querySelectorAll("a[href], button:not([disabled])")]
          .filter((element) => element instanceof HTMLElement && !element.hasAttribute("inert"));
        const first = focusable[0];
        const last = focusable.at(-1);
        if (!first || !last) return;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    });

    document.addEventListener("click", (event) => {
      if (!nav.classList.contains("is-open")) return;
      if (header.contains(event.target)) return;
      closeNavigation();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 820) closeNavigation();
      else syncNavigationAccessibility(nav.classList.contains("is-open"));
    });
  }

  document.querySelectorAll(".site-nav a").forEach((link) => {
    try {
      const url = new URL(link.href, window.location.href);
      const currentPath = window.location.pathname.replace(/index\.html$/, "");
      const linkPath = url.pathname.replace(/index\.html$/, "");
      if (url.origin === window.location.origin && linkPath === currentPath && !url.hash) {
        link.setAttribute("aria-current", "page");
      }
    } catch {
      // Keep navigation usable even when a malformed optional URL is supplied.
    }
  });

  const realignHashTarget = () => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    window.requestAnimationFrame(() => {
      target.scrollIntoView({ block: "start", behavior: "auto" });
    });
  };

  window.addEventListener("load", () => {
    realignHashTarget();
    window.setTimeout(realignHashTarget, 260);
    if (document.fonts?.ready) {
      document.fonts.ready.then(realignHashTarget).catch(() => {
        // Font loading must never block normal navigation.
      });
    }
  });
  window.addEventListener("hashchange", () => window.setTimeout(realignHashTarget, 40));

  const mobileCta = document.querySelector(".aw-mobile-cta");
  const contactSection = document.querySelector("#contact");
  const heroSection = document.querySelector(".aw-hero");
  if (mobileCta && "IntersectionObserver" in window) {
    if (contactSection) {
      const contactObserver = new IntersectionObserver(([entry]) => {
        body.classList.toggle("contact-in-view", entry.isIntersecting);
      }, { rootMargin: "0px 0px -35% 0px", threshold: 0.05 });
      contactObserver.observe(contactSection);
    }
    if (heroSection) {
      const heroObserver = new IntersectionObserver(([entry]) => {
        body.classList.toggle("hero-in-view", entry.isIntersecting);
      }, { rootMargin: "0px 0px -45% 0px", threshold: 0.05 });
      heroObserver.observe(heroSection);
    }
  }

  const revealSelectors = [
    ".subpage-hero-grid > *",
    ".section-heading",
    ".detail-panel",
    ".principle-card",
    ".subpage-mini-card",
    ".case-detail-card",
    ".plan-card",
    ".dx-problem-grid > span",
    ".dx-concept-card",
    ".dx-step-grid > article",
    ".dx-premium-benefit",
    ".process-list > li",
    ".delivery-note",
    ".cta-band",
  ];

  const revealTargets = body.classList.contains("home-page")
    ? [...document.querySelectorAll("[data-reveal]")]
    : [...document.querySelectorAll(revealSelectors.join(","))];
  let revealObserver = null;

  const revealAll = () => {
    revealObserver?.disconnect();
    revealObserver = null;
    revealTargets.forEach((target) => target.classList.add("is-visible"));
  };

  const setupReveal = () => {
    revealObserver?.disconnect();
    revealObserver = null;
    if (!revealTargets.length) return;
    revealTargets.forEach((target, index) => {
      target.dataset.reveal = "";
      target.style.setProperty("--reveal-delay", `${(index % 3) * 70}ms`);
    });
    if (motionQuery.matches || !("IntersectionObserver" in window)) {
      revealAll();
      return;
    }
    body.classList.add("has-reveal");
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver?.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -9% 0px", threshold: 0.08 });
    revealTargets.forEach((target) => revealObserver.observe(target));
  };

  setupReveal();

  const finePointerQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
  const motionToggle = document.createElement("button");
  const motionStorageKey = "aw-motion-paused";
  let manualMotionPaused = false;
  try {
    manualMotionPaused = window.sessionStorage.getItem(motionStorageKey) === "true";
  } catch {
    // Motion preference still works for this page when storage is unavailable.
  }
  let pointerFrame = 0;
  let pointerX = 0;
  let pointerY = 0;
  let pointerTarget = null;
  let activeMagnet = null;
  let activeSpotlight = null;
  let activeTilt = null;

  motionToggle.className = "aw-motion-toggle";
  motionToggle.type = "button";
  motionToggle.setAttribute("aria-pressed", "false");
  motionToggle.setAttribute("aria-label", "ページの動きを止める");
  motionToggle.innerHTML = "<span>Motion on</span>";
  if (header) header.insertAdjacentElement("afterend", motionToggle);
  else body.append(motionToggle);
  body.classList.add("play-ready");

  const motionAllowed = () => !motionQuery.matches && !manualMotionPaused;

  const resetElementMotion = () => {
    if (activeMagnet) {
      activeMagnet.style.removeProperty("--magnet-x");
      activeMagnet.style.removeProperty("--magnet-y");
      activeMagnet = null;
    }
    if (activeSpotlight) {
      activeSpotlight.style.removeProperty("--spot-x");
      activeSpotlight.style.removeProperty("--spot-y");
      activeSpotlight = null;
    }
    if (activeTilt) {
      activeTilt.style.removeProperty("--tilt-x");
      activeTilt.style.removeProperty("--tilt-y");
      activeTilt = null;
    }
  };

  const resetPointer = () => {
    if (pointerFrame) window.cancelAnimationFrame(pointerFrame);
    pointerFrame = 0;
    pointerTarget = null;
    resetElementMotion();
  };

  const updateMotionState = () => {
    body.classList.toggle("motion-paused", manualMotionPaused);
    document.documentElement.classList.toggle("motion-paused", manualMotionPaused);
    motionToggle.setAttribute("aria-pressed", String(manualMotionPaused));
    motionToggle.setAttribute("aria-label", manualMotionPaused ? "ページの動きを再開する" : "ページの動きを止める");
    motionToggle.querySelector("span").textContent = manualMotionPaused ? "Motion off" : "Motion on";
    if (!motionAllowed()) {
      resetPointer();
      revealAll();
    }
    document.dispatchEvent(new CustomEvent("aw:motion-toggle", {
      detail: { paused: !motionAllowed() },
    }));
  };

  motionToggle.addEventListener("click", () => {
    manualMotionPaused = !manualMotionPaused;
    try {
      window.sessionStorage.setItem(motionStorageKey, String(manualMotionPaused));
    } catch {
      // Keep the in-page control usable even when storage is unavailable.
    }
    updateMotionState();
  });

  const resetPrevious = (current, previous, properties) => {
    if (previous && previous !== current) {
      properties.forEach((property) => previous.style.removeProperty(property));
    }
  };

  const flushPointer = () => {
    pointerFrame = 0;
    const target = pointerTarget;
    if (!(target instanceof Element) || !motionAllowed() || !finePointerQuery.matches) return;

    const magnet = target.closest(".button, .nav-contact");
    resetPrevious(magnet, activeMagnet, ["--magnet-x", "--magnet-y"]);
    activeMagnet = magnet;
    if (magnet instanceof HTMLElement && !(magnet instanceof HTMLButtonElement && magnet.disabled)) {
      const rect = magnet.getBoundingClientRect();
      const x = ((pointerX - rect.left) / Math.max(rect.width, 1) - 0.5) * 10;
      const y = ((pointerY - rect.top) / Math.max(rect.height, 1) - 0.5) * 8;
      magnet.style.setProperty("--magnet-x", `${x.toFixed(2)}px`);
      magnet.style.setProperty("--magnet-y", `${y.toFixed(2)}px`);
    }

    const spotlight = target.closest(".aw-capability-dock a, .gateway-card, .plan-card, .aw-friction-card");
    resetPrevious(spotlight, activeSpotlight, ["--spot-x", "--spot-y"]);
    activeSpotlight = spotlight;
    if (spotlight instanceof HTMLElement) {
      const rect = spotlight.getBoundingClientRect();
      spotlight.style.setProperty("--spot-x", `${(pointerX - rect.left).toFixed(1)}px`);
      spotlight.style.setProperty("--spot-y", `${(pointerY - rect.top).toFixed(1)}px`);
    }

    const tilt = target.closest("[data-tilt]");
    resetPrevious(tilt, activeTilt, ["--tilt-x", "--tilt-y"]);
    activeTilt = tilt;
    if (tilt instanceof HTMLElement) {
      const rect = tilt.getBoundingClientRect();
      const tiltX = (((pointerY - rect.top) / Math.max(rect.height, 1)) - 0.5) * -1.6;
      const tiltY = (((pointerX - rect.left) / Math.max(rect.width, 1)) - 0.5) * 1.8;
      tilt.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
      tilt.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);
    }
  };

  document.addEventListener("pointermove", (event) => {
    if (!motionAllowed() || !finePointerQuery.matches) return;
    if (!(event.target instanceof Element)) return;
    pointerX = event.clientX;
    pointerY = event.clientY;
    pointerTarget = event.target;
    if (!pointerFrame) pointerFrame = window.requestAnimationFrame(flushPointer);
  }, { passive: true });

  document.addEventListener("pointerout", (event) => {
    if (event.relatedTarget) return;
    resetPointer();
  }, { passive: true });
  window.addEventListener("scroll", resetPointer, { passive: true });
  window.addEventListener("blur", resetPointer);

  document.addEventListener("pointerdown", (event) => {
    if (!motionAllowed() || !finePointerQuery.matches || !(event.target instanceof Element)) return;
    const trigger = event.target.closest(".button, .nav-contact, .aw-friction-card, .gateway-card, .plan-link, .aw-mobile-cta");
    if (!trigger || (trigger instanceof HTMLButtonElement && trigger.disabled)) return;
    const bloom = document.createElement("span");
    bloom.className = "aw-click-bloom";
    bloom.style.left = `${event.clientX}px`;
    bloom.style.top = `${event.clientY}px`;
    bloom.setAttribute("aria-hidden", "true");
    body.appendChild(bloom);
    bloom.addEventListener("animationend", () => bloom.remove(), { once: true });
    window.setTimeout(() => bloom.remove(), 900);
  }, { passive: true });

  const frictionStatus = document.querySelector("[data-friction-status]");
  const frictionConsult = document.querySelector("[data-friction-consult]");
  const frictionStatusDefault = frictionStatus?.textContent?.trim() || "";
  document.querySelectorAll("[data-friction-card]").forEach((card) => {
    card.addEventListener("click", () => {
      const willActivate = card.getAttribute("aria-pressed") !== "true";
      const friction = card.querySelector(".aw-friction-before")?.textContent?.trim() || "";
      const smallShift = card.querySelector("strong")?.textContent?.trim() || "";
      document.querySelectorAll("[data-friction-card]").forEach((item) => item.setAttribute("aria-pressed", "false"));
      card.setAttribute("aria-pressed", String(willActivate));
      if (frictionStatus) {
        frictionStatus.textContent = willActivate
          ? `選択中：「${friction}」→ ${smallShift}。この困りごとから相談できます。`
          : frictionStatusDefault;
      }
      if (frictionConsult instanceof HTMLAnchorElement) {
        const service = card.dataset.service?.trim() || "";
        const query = new URLSearchParams();
        if (service) query.set("service", service);
        if (friction) query.set("issue", friction);
        frictionConsult.hidden = !willActivate;
        frictionConsult.href = willActivate && query.toString()
          ? `?${query.toString()}#contact`
          : "#contact";
      }
    });
  });

  const growthPath = document.querySelector(".aw-growth-path");
  const growthSteps = growthPath ? [...growthPath.querySelectorAll("[data-play-step]")] : [];
  const setGrowthStep = (step) => {
    const index = growthSteps.indexOf(step);
    if (index < 0) return;
    growthSteps.forEach((item, itemIndex) => item.classList.toggle("is-current", itemIndex === index));
    growthPath.style.setProperty("--path-progress", ((index + 1) / growthSteps.length).toFixed(3));
  };

  growthSteps.forEach((step) => {
    step.addEventListener("pointerenter", () => {
      if (finePointerQuery.matches && motionAllowed()) setGrowthStep(step);
    });
    step.addEventListener("focusin", () => setGrowthStep(step));
  });

  if (growthSteps.length && "IntersectionObserver" in window && !motionQuery.matches) {
    const growthObserver = new IntersectionObserver((entries) => {
      if (!motionAllowed()) return;
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setGrowthStep(visible.target);
    }, { rootMargin: "-26% 0px -46% 0px", threshold: [0.25, 0.55, 0.8] });
    growthSteps.forEach((step) => growthObserver.observe(step));
  } else if (growthSteps.length) {
    growthPath.style.setProperty("--path-progress", "1");
  }

  const onMotionPreferenceChange = () => {
    if (motionQuery.matches) revealAll();
    updateMotionState();
  };
  if (typeof motionQuery.addEventListener === "function") {
    motionQuery.addEventListener("change", onMotionPreferenceChange);
    finePointerQuery.addEventListener("change", resetPointer);
  } else {
    motionQuery.addListener(onMotionPreferenceChange);
    finePointerQuery.addListener(resetPointer);
  }
  updateMotionState();

  const params = new URLSearchParams(window.location.search);
  if (applicationForm) {
    const requestedPlan = params.get("plan");
    const requestedService = params.get("service");
    const requestedIssue = params.get("issue")?.trim();
    if (requestedPlan) {
      const planSelect = applicationForm.elements.namedItem("plan");
      if (planSelect instanceof HTMLSelectElement) {
        const match = [...planSelect.options].find((option) => option.text.startsWith(requestedPlan));
        if (match) planSelect.value = match.value;
      }
    }
    if (requestedService) {
      const serviceFields = applicationForm.querySelectorAll('input[name="service"]');
      serviceFields.forEach((field) => {
        if (field instanceof HTMLInputElement && field.value === requestedService) field.checked = true;
      });
    }
    if (requestedIssue) {
      const messageField = applicationForm.elements.namedItem("message");
      if (messageField instanceof HTMLTextAreaElement && !messageField.value) {
        messageField.value = requestedIssue.slice(0, 300);
      }
    }
  }

  const copyText = async (text) => {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.left = "-9999px";
    document.body.appendChild(field);
    field.select();
    const copied = document.execCommand("copy");
    field.remove();
    return copied;
  };

  if (applicationForm) {
    applicationForm.addEventListener("submit", async (event) => {
      const endpoint = applicationForm.dataset.formEndpoint?.trim();
      if (!endpoint || typeof window.fetch !== "function") return;
      event.preventDefault();

      if (!applicationForm.reportValidity()) return;
      const submitButton = applicationForm.querySelector('button[type="submit"]');
      const formData = new FormData(applicationForm);
      const value = (name) => String(formData.get(name) || "").trim();
      const services = formData.getAll("service").map(String).join("、") || "未選択";
      const text = [
        "【依頼相談フォーム】",
        `【お名前・ご担当者名】${value("name") || "未入力"}`,
        `【事業名・屋号】${value("business") || "未入力"}`,
        `【メールアドレス】${value("email") || "未入力"}`,
        `【電話番号】${value("tel") || "未入力"}`,
        `【相談したい内容】${services}`,
        `【気になるHPプラン】${value("plan") || "未定・相談したい"}`,
        `【希望時期】${value("timing") || "未定"}`,
        `【相談内容・困っていること】${value("message") || "未入力"}`,
        `【参考サイト・SNS URL】${value("reference") || "未入力"}`,
      ].join("\n");

      formData.set("_replyto", value("email"));
      formData.set("相談内容まとめ", text);
      applicationForm.setAttribute("aria-busy", "true");
      if (submitButton instanceof HTMLButtonElement) submitButton.disabled = true;
      if (applicationStatus) applicationStatus.textContent = "送信しています…";

      if (applicationOutput) {
        applicationOutput.value = text;
        applicationOutput.hidden = false;
      }

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { Accept: "application/json" },
          body: formData,
        });
        if (!response.ok) throw new Error("form submit failed");
        if (applicationStatus) {
          applicationStatus.textContent = "送信しました。内容を確認して、最初に整理すべきことから返信します。";
        }
        if (applicationOutput) {
          applicationOutput.value = "";
          applicationOutput.hidden = true;
        }
        applicationForm.reset();
      } catch {
        let copied = false;
        try {
          copied = await copyText(text);
        } catch {
          copied = false;
        }
        if (applicationStatus) {
          applicationStatus.textContent = copied
            ? "送信できなかったため入力内容をコピーしました。時間を置いて、もう一度お試しください。"
            : "送信できませんでした。下に表示した入力内容を保存し、時間を置いてもう一度お試しください。";
        }
      } finally {
        applicationForm.removeAttribute("aria-busy");
        if (submitButton instanceof HTMLButtonElement) submitButton.disabled = false;
      }
    });
  }
})();
