(() => {
  const body = document.body;
  const header = document.querySelector("[data-header]");
  const nav = document.querySelector("[data-nav]");
  const navToggle = document.querySelector("[data-nav-toggle]");
  const year = document.querySelector("[data-year]");
  const filterButtons = document.querySelectorAll("[data-filter]");
  const workCards = document.querySelectorAll("[data-category]");
  const copyConsultButton = document.querySelector("[data-copy-consult]");
  const copyStatus = document.querySelector("[data-copy-status]");
  const consultTemplate = document.querySelector("[data-consult-template]");

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  const syncHeader = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };

  syncHeader();
  window.addEventListener("scroll", syncHeader, { passive: true });

  if (navToggle && nav && header) {
    navToggle.addEventListener("click", () => {
      const isOpen = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!isOpen));
      nav.classList.toggle("is-open", !isOpen);
      header.classList.toggle("is-open", !isOpen);
      body.classList.toggle("nav-open", !isOpen);
    });

    nav.addEventListener("click", (event) => {
      if (!(event.target instanceof HTMLAnchorElement)) return;
      navToggle.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
      header.classList.remove("is-open");
      body.classList.remove("nav-open");
    });
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter || "all";

      filterButtons.forEach((item) => {
        item.classList.toggle("is-active", item === button);
      });

      workCards.forEach((card) => {
        const categories = (card.dataset.category || "").split(" ");
        const isVisible = filter === "all" || categories.includes(filter);
        card.classList.toggle("is-hidden", !isVisible);
      });
    });
  });

  if (copyConsultButton && consultTemplate) {
    copyConsultButton.addEventListener("click", async () => {
      const text = [...consultTemplate.querySelectorAll("p")]
        .map((item) => item.textContent.trim())
        .join("\n");

      try {
        let copied = false;
        if (navigator.clipboard && window.isSecureContext) {
          try {
            await navigator.clipboard.writeText(text);
            copied = true;
          } catch {
            copied = false;
          }
        }

        if (!copied) {
          const field = document.createElement("textarea");
          field.value = text;
          field.setAttribute("readonly", "");
          field.style.position = "fixed";
          field.style.top = "0";
          field.style.left = "-9999px";
          document.body.appendChild(field);
          field.focus();
          field.select();
          copied = document.execCommand("copy");
          field.remove();
          if (!copied) {
            throw new Error("copy failed");
          }
        }
        if (copyStatus) {
          copyStatus.textContent = "相談メモをコピーしました。LINEやメールに貼り付けて使えます。";
        }
      } catch {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(consultTemplate);
        selection.removeAllRanges();
        selection.addRange(range);
        if (copyStatus) {
          copyStatus.textContent = "相談メモを選択しました。Ctrl+CでコピーしてLINEやメールに貼り付けてください。";
        }
      }
    });
  }
})();
