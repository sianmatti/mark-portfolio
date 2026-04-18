const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");

if (menuToggle && siteNav) {
  const navLinks = Array.from(siteNav.querySelectorAll("a"));
  const firstNavLink = navLinks[0];
  const lastNavLink = navLinks[navLinks.length - 1];
  let previousFocused = null;

  const isDesktop = () => window.innerWidth >= 900;
  const isMenuOpen = () => siteNav.classList.contains("is-open");

  const setMenuState = (open, restoreFocus = true) => {
    siteNav.classList.toggle("is-open", open);
    menuToggle.classList.toggle("is-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute(
      "aria-label",
      open ? "Close navigation menu" : "Open navigation menu"
    );
    document.body.classList.toggle("nav-open", open);

    if (open && firstNavLink && !isDesktop()) {
      previousFocused = document.activeElement;
      firstNavLink.focus();
    } else if (!open && restoreFocus && previousFocused instanceof HTMLElement) {
      previousFocused.focus();
    }
  };

  const closeMenu = (restoreFocus = true) => setMenuState(false, restoreFocus);
  const openMenu = () => setMenuState(true, true);

  menuToggle.addEventListener("click", () => {
    isMenuOpen() ? closeMenu(true) : openMenu();
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      if (!isDesktop()) {
        closeMenu(false);
      }
    });
  });

  document.addEventListener("keydown", (event) => {
    if (!isMenuOpen() || isDesktop()) return;

    if (event.key === "Escape") {
      closeMenu(true);
      return;
    }

    if (event.key === "Tab" && firstNavLink && lastNavLink) {
      if (event.shiftKey && document.activeElement === firstNavLink) {
        event.preventDefault();
        lastNavLink.focus();
      } else if (!event.shiftKey && document.activeElement === lastNavLink) {
        event.preventDefault();
        firstNavLink.focus();
      }
    }
  });

  document.addEventListener("click", (event) => {
    if (!isMenuOpen() || isDesktop()) return;

    const clickedInsideNav = siteNav.contains(event.target);
    const clickedToggle = menuToggle.contains(event.target);

    if (!clickedInsideNav && !clickedToggle) {
      closeMenu(false);
    }
  });

  window.addEventListener("resize", () => {
    if (isDesktop()) {
      closeMenu(false);
      menuToggle.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open navigation menu");
      document.body.classList.remove("nav-open");
    }
  });
}

document.querySelectorAll("[data-cta]").forEach((element) => {
  element.addEventListener("click", () => {
    const payload = {
      cta_name: element.getAttribute("data-cta"),
      cta_text: element.textContent.trim(),
      cta_href: element.getAttribute("href") || "",
      cta_location: element.closest("section")?.id || "global",
      page_path: window.location.pathname,
    };

    if (typeof window.gtag === "function") {
      window.gtag("event", "cta_click", payload);
    }

    if (window.dataLayer && Array.isArray(window.dataLayer)) {
      window.dataLayer.push({
        event: "cta_click",
        ...payload,
      });
    }
  });
});

const scrollDepthThresholds = [25, 50, 75, 90];
const triggeredScrollThresholds = new Set();

const trackScrollDepth = () => {
  const scrollPercent = Math.round(
    ((window.scrollY + window.innerHeight) /
      document.documentElement.scrollHeight) *
      100
  );

  scrollDepthThresholds.forEach((threshold) => {
    if (scrollPercent >= threshold && !triggeredScrollThresholds.has(threshold)) {
      triggeredScrollThresholds.add(threshold);

      const payload = {
        event_category: "engagement",
        event_label: `${threshold}%`,
        scroll_threshold: threshold,
        page_path: window.location.pathname,
      };

      if (typeof window.gtag === "function") {
        window.gtag("event", "scroll_depth", payload);
      }

      if (window.dataLayer && Array.isArray(window.dataLayer)) {
        window.dataLayer.push({
          event: "scroll_depth",
          ...payload,
        });
      }
    }
  });
};

window.addEventListener("scroll", trackScrollDepth, { passive: true });

const leadForm = document.getElementById("lead-form");
const formStatus = document.getElementById("form-status");
const submitButton = leadForm?.querySelector(".lead-submit");

if (leadForm && formStatus && submitButton) {
  leadForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    formStatus.className = "form-status";
    formStatus.textContent = "Submitting...";
    submitButton.disabled = true;
    submitButton.textContent = "Submitting...";

    const formData = new FormData(leadForm);

    try {
      const response = await fetch(leadForm.action, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        formStatus.className = "form-status success";
        formStatus.textContent =
          "Thanks — your inquiry has been sent. I’ll review it and get back to you within 24 hours.";
        leadForm.reset();

        const payload = {
          form_name: "paid_media_audit_form",
          page_path: window.location.pathname,
        };

        if (typeof window.gtag === "function") {
          window.gtag("event", "generate_lead", payload);
        }

        if (window.dataLayer && Array.isArray(window.dataLayer)) {
          window.dataLayer.push({
            event: "generate_lead",
            ...payload,
          });
        }
      } else {
        formStatus.className = "form-status error";
        formStatus.textContent =
          "Something went wrong. Please try again or email me directly.";
      }
    } catch (error) {
      formStatus.className = "form-status error";
      formStatus.textContent =
        "Something went wrong. Please try again or email me directly.";
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Get My Free Audit";
    }
  });
}
