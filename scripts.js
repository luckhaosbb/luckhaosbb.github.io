/* ==========================================================================
   LUCAS GOMES PORTFOLIO - INTERACTIVE JAVASCRIPT
   Architecture: Modular, Event-Driven, SOLID Principles
   ========================================================================== */

/**
 * Toast Notification Service
 * Single Responsibility: Display transient accessible notifications safely (XSS-safe).
 */
const ToastService = {
  timeoutId: null,

  getOrCreateToast() {
    let toast = document.getElementById('toast-notification');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast-notification';
      toast.className = 'toast-notification';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    return toast;
  },

  show(message, duration = 3000) {
    const toast = this.getOrCreateToast();

    // DOM-based XSS Prevention: Strict textContent instead of innerHTML
    toast.textContent = message;
    toast.classList.add('show');

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      toast.classList.remove('show');
      this.timeoutId = null;
    }, duration);
  }
};

/**
 * Clipboard Manager
 * Single Responsibility: Copy text to clipboard using Event Delegation (Open/Closed).
 */
const ClipboardManager = {
  init() {
    document.addEventListener('click', (e) => {
      const copyTrigger = e.target.closest('[data-copy]');
      if (!copyTrigger) return;

      const text = copyTrigger.getAttribute('data-copy');
      const label = copyTrigger.getAttribute('data-copy-label') || 'Item';
      if (text) {
        this.copyText(text, label);
      }
    });
  },

  async copyText(text, label) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        ToastService.show(`✅ ${label} copiado com sucesso!`);
        return;
      } catch (err) {
        // Fallback if permission denied
        this.fallbackCopy(text, label);
      }
    } else {
      this.fallbackCopy(text, label);
    }
  },

  fallbackCopy(text, label) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.opacity = '0';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const success = document.execCommand('copy');
      if (success) {
        ToastService.show(`✅ ${label} copiado com sucesso!`);
      } else {
        ToastService.show(`⚠️ Não foi possível copiar automaticamente.`);
      }
    } catch (err) {
      ToastService.show(`⚠️ Não foi possível copiar automaticamente.`);
    } finally {
      document.body.removeChild(textArea);
    }
  }
};

/**
 * Skills Filter
 * Single Responsibility: Manage category filtering using CSS state classes (Decoupled from CSS).
 */
const SkillsFilter = {
  init() {
    const filterContainer = document.querySelector('.skills-filter');
    const skillCards = document.querySelectorAll('.skill-card');
    if (!filterContainer || !skillCards.length) return;

    filterContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;

      filterContainer.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-filter');

      skillCards.forEach((card) => {
        const category = card.getAttribute('data-category');
        const isMatch = filterValue === 'all' || category === filterValue;
        card.classList.toggle('is-hidden', !isMatch);
      });
    });
  }
};

/**
 * Navbar & Mobile Navigation Manager
 * Single Responsibility: Manage navbar scrolling state and mobile drawer.
 */
const NavbarManager = {
  init() {
    this.navbar = document.getElementById('navbar');
    this.mobileToggle = document.getElementById('mobile-toggle');
    this.navMenu = document.getElementById('nav-menu');
    this.navLinks = document.querySelectorAll('.nav-link');

    this.initScrollHandler();
    this.initMobileMenu();
  },

  initScrollHandler() {
    if (!this.navbar) return;

    let ticking = false;
    window.addEventListener(
      'scroll',
      () => {
        if (!ticking) {
          window.requestAnimationFrame(() => {
            if (window.scrollY > 50) {
              this.navbar.classList.add('scrolled');
            } else {
              this.navbar.classList.remove('scrolled');
            }
            ticking = false;
          });
          ticking = true;
        }
      },
      { passive: true }
    );
  },

  initMobileMenu() {
    if (!this.mobileToggle || !this.navMenu) return;

    const closeIconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>`;
    const openIconSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>`;

    this.mobileToggle.addEventListener('click', () => {
      const isOpen = this.navMenu.classList.toggle('open');
      this.mobileToggle.setAttribute('aria-expanded', String(isOpen));
      this.mobileToggle.innerHTML = isOpen ? closeIconSvg : openIconSvg;
    });

    this.navLinks.forEach((link) => {
      link.addEventListener('click', () => {
        this.navMenu.classList.remove('open');
        this.mobileToggle.setAttribute('aria-expanded', 'false');
        this.mobileToggle.innerHTML = openIconSvg;
      });
    });
  }
};

/**
 * ScrollSpy Manager
 * Single Responsibility: Update active navigation link based on viewport intersection.
 */
const ScrollSpy = {
  init() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    if (!sections.length || !navLinks.length) return;

    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach((link) => {
            const isCurrent = link.getAttribute('href') === `#${id}`;
            link.classList.toggle('active', isCurrent);
          });
        }
      });
    }, observerOptions);

    sections.forEach((section) => observer.observe(section));
  }
};

/**
 * ScrollReveal Manager
 * Single Responsibility: Trigger entrance animations when elements enter the viewport.
 */
const ScrollReveal = {
  init() {
    const revealElements = document.querySelectorAll('.reveal');
    if (!revealElements.length) return;

    // Accessibility: If user prefers reduced motion, activate immediately without waiting for scroll
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      revealElements.forEach((el) => el.classList.add('active'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('active');
            obs.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    revealElements.forEach((el) => observer.observe(el));
  }
};

/**
 * Action Manager
 * Single Responsibility: Generic UI actions (e.g. print CV).
 */
const ActionManager = {
  init() {
    document.addEventListener('click', (e) => {
      const printBtn = e.target.closest('[data-action="print"]');
      if (printBtn) {
        window.print();
      }
    });
  }
};

/**
 * Avatar Handler
 * Single Responsibility: Fallback graceful degradation for avatar images without inline handlers.
 */
const AvatarHandler = {
  init() {
    const avatarImg = document.getElementById('avatar-img');
    const avatarFrame = document.querySelector('.avatar-image-frame');
    if (!avatarImg || !avatarFrame) return;

    // Check if image already failed prior to DOMContentLoaded
    if (avatarImg.complete && avatarImg.naturalWidth === 0) {
      avatarFrame.classList.add('has-fallback');
      return;
    }

    avatarImg.addEventListener('error', () => {
      avatarFrame.classList.add('has-fallback');
    });
  }
};

// Centralized Application Bootstrap
document.addEventListener('DOMContentLoaded', () => {
  ToastService.getOrCreateToast();
  ClipboardManager.init();
  SkillsFilter.init();
  NavbarManager.init();
  ScrollSpy.init();
  ScrollReveal.init();
  ActionManager.init();
  AvatarHandler.init();
});
