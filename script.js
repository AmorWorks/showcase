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
  const applicationForm = document.querySelector("[data-application-form]");
  const applicationStatus = document.querySelector("[data-application-status]");
  const applicationOutput = document.querySelector("[data-application-output]");

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  const syncHeader = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  };

  syncHeader();
  window.addEventListener("scroll", syncHeader, { passive: true });

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
    window.setTimeout(realignHashTarget, 300);
  });

  window.addEventListener("hashchange", () => {
    window.setTimeout(realignHashTarget, 50);
  });

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
        const plan = card.dataset.plan || "";
        const isVisible = filter === "all" || categories.includes(filter) || plan === filter;
        card.classList.toggle("is-hidden", !isVisible);
      });
    });
  });

  const copyText = async (text) => {
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
    }

    if (!copied) {
      throw new Error("copy failed");
    }
  };

  if (copyConsultButton && consultTemplate) {
    copyConsultButton.addEventListener("click", async () => {
      const text = [...consultTemplate.querySelectorAll("p")]
        .map((item) => item.textContent.trim())
        .join("\n");

      try {
        await copyText(text);
        if (copyStatus) {
          copyStatus.textContent = "相談メモをコピーしました。メールなどに貼り付けて使えます。";
        }
      } catch {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(consultTemplate);
        selection.removeAllRanges();
        selection.addRange(range);
        if (copyStatus) {
          copyStatus.textContent = "相談メモを選択しました。Ctrl+Cでコピーしてメールなどに貼り付けてください。";
        }
      }
    });
  }

  if (applicationForm) {
    applicationForm.addEventListener("submit", async (event) => {
      event.preventDefault();

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
      const endpoint = applicationForm.dataset.formEndpoint?.trim();
      formData.set("_replyto", value("email"));
      formData.set("相談内容まとめ", text);

      if (applicationOutput) {
        applicationOutput.value = text;
        applicationOutput.hidden = false;
      }

      try {
        if (endpoint) {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: {
              Accept: "application/json",
            },
            body: formData,
          });
          if (!response.ok) {
            throw new Error("form submit failed");
          }
          if (applicationStatus) {
            applicationStatus.textContent = "送信しました。内容を確認して、最初に整理すべきことから返信します。";
          }
          if (applicationOutput) {
            applicationOutput.value = "";
            applicationOutput.hidden = true;
          }
          applicationForm.reset();
          return;
        }

        await copyText(text);
        if (applicationStatus) {
          applicationStatus.textContent = "入力内容をコピーしました。メールにそのまま貼り付けられます。";
        }
      } catch {
        if (applicationStatus) {
          applicationStatus.textContent = endpoint
            ? "送信できませんでした。下に表示された入力内容をコピーして、メールで送ってください。"
            : "コピーできませんでした。下に表示された入力内容を選択してコピーしてください。";
        }
      }
    });
  }
})();
