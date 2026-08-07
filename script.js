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
  };

  const openNavigation = () => {
    if (!navToggle || !nav || !header) return;
    lastFocusedElement = document.activeElement;
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "メニューを閉じる");
    nav.classList.add("is-open");
    header.classList.add("is-open");
    body.classList.add("nav-open");
    window.requestAnimationFrame(() => nav.querySelector("a")?.focus());
  };

  if (navToggle && nav && header) {
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
    });

    document.addEventListener("click", (event) => {
      if (!nav.classList.contains("is-open")) return;
      if (header.contains(event.target)) return;
      closeNavigation();
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 820) closeNavigation();
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
  });
  window.addEventListener("hashchange", () => window.setTimeout(realignHashTarget, 40));

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

  if (!body.classList.contains("home-page") && !motionQuery.matches && "IntersectionObserver" in window) {
    const targets = document.querySelectorAll(revealSelectors.join(","));
    if (targets.length) {
      body.classList.add("has-reveal");
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      }, { rootMargin: "0px 0px -9% 0px", threshold: 0.08 });
      targets.forEach((target) => {
        target.dataset.reveal = "";
        observer.observe(target);
      });
    }
  }

  const params = new URLSearchParams(window.location.search);
  if (applicationForm) {
    const requestedPlan = params.get("plan");
    const requestedService = params.get("service");
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
