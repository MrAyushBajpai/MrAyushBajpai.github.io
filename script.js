/**
 * AYUSH BAJPAI — MINIMAL PORTFOLIO ENGINE
 * - Single-click clipboard copy with feedback toast
 * - Mobile navigation drawer
 * - Scroll spy for active navigation state
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  initCopyEmail();
  initMobileNav();
  initScrollSpy();
  initTorchCursor();
});

/* ─── 1. ONE-CLICK EMAIL COPY ─── */
function initCopyEmail() {
  const copyButtons = document.querySelectorAll('.copy-email-btn');
  const toast = document.getElementById('copyToast');
  const toastMsg = document.getElementById('toastMsg');
  let toastTimer = null;

  if (!copyButtons.length || !toast) return;

  copyButtons.forEach(button => {
    button.addEventListener('click', async () => {
      const email = button.dataset.email || 'ayushbajpai1711@gmail.com';

      let copied = false;
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(email);
          copied = true;
        } catch {
          copied = fallbackCopy(email);
        }
      } else {
        copied = fallbackCopy(email);
      }

      if (copied) {
        showToast(`Copied ${email} to clipboard`);
        const label = button.querySelector('.copy-label') || button.querySelector('span');
        if (label) {
          const prev = label.textContent;
          label.textContent = 'Copied!';
          setTimeout(() => {
            label.textContent = prev;
          }, 2000);
        }
      }
    });
  });

  function fallbackCopy(text) {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.left = '-999999px';
    document.body.appendChild(el);
    el.select();
    let res = false;
    try {
      res = document.execCommand('copy');
    } catch {
      res = false;
    }
    document.body.removeChild(el);
    return res;
  }

  function showToast(msg) {
    if (toastTimer) clearTimeout(toastTimer);
    if (toastMsg) toastMsg.textContent = msg;

    toast.classList.add('show');
    toast.setAttribute('aria-hidden', 'false');

    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
      toast.setAttribute('aria-hidden', 'true');
    }, 2600);
  }
}

/* ─── 2. MOBILE DRAWER NAVIGATION ─── */
function initMobileNav() {
  const toggleBtn = document.getElementById('menuToggle');
  const drawer = document.getElementById('mobileNav');
  const links = document.querySelectorAll('.mobile-item');

  if (!toggleBtn || !drawer) return;

  function toggle(open) {
    const state = typeof open === 'boolean' ? open : !drawer.classList.contains('open');
    drawer.classList.toggle('open', state);
    toggleBtn.setAttribute('aria-expanded', state ? 'true' : 'false');
    drawer.setAttribute('aria-hidden', state ? 'false' : 'true');
  }

  toggleBtn.addEventListener('click', () => toggle());

  links.forEach(link => {
    link.addEventListener('click', () => toggle(false));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('open')) {
      toggle(false);
      toggleBtn.focus();
    }
  });
}

/* ─── 3. SCROLL SPY INTERSECTION OBSERVER ─── */
function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.desktop-nav .nav-item');

  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach(link => {
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  }, {
    rootMargin: '-20% 0px -65% 0px',
    threshold: 0
  });

  sections.forEach(sec => observer.observe(sec));
}

/* ─── 4. ATMOSPHERIC TORCH & PRECISION CURSOR FOLLOWER ─── */
function initTorchCursor() {
  // Graceful degradation: do nothing if touch device or reduced motion
  if (window.matchMedia('(hover: none) or (pointer: coarse)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const torch = document.getElementById('ambientTorch');
  const beacon = document.getElementById('cursorBeacon');
  const dot = document.getElementById('cursorDot');

  if (!torch || !beacon || !dot) return;

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight * 0.4;
  let beaconX = mouseX;
  let beaconY = mouseY;
  let isPointerActive = false;

  // Track pointer movements
  window.addEventListener('pointermove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (!isPointerActive) {
      isPointerActive = true;
      document.body.classList.add('has-cursor');
    }
  }, { passive: true });

  // Update card relative coordinates on hover
  const spotlightCards = document.querySelectorAll(
    '.project-card, .experience-panel, .skill-card, .box-card, .portrait-card, .contact-box'
  );

  spotlightCards.forEach(card => {
    card.addEventListener('pointermove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    }, { passive: true });
  });

  // Track hover on interactive elements to scale beacon smoothly
  const interactiveSelector = 'a, button, input, textarea, .btn, .social-icon-link, .project-card';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(interactiveSelector)) {
      document.body.classList.add('cursor-hover');
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(interactiveSelector)) {
      document.body.classList.remove('cursor-hover');
    }
  });

  // Click active compression
  window.addEventListener('mousedown', () => {
    document.body.classList.add('cursor-active');
  });

  window.addEventListener('mouseup', () => {
    document.body.classList.remove('cursor-active');
  });

  // Hide when pointer leaves viewport
  document.documentElement.addEventListener('pointerleave', () => {
    isPointerActive = false;
    document.body.classList.remove('has-cursor');
    document.body.classList.remove('cursor-hover');
  });

  document.documentElement.addEventListener('pointerenter', () => {
    isPointerActive = true;
    document.body.classList.add('has-cursor');
  });

  // Smooth animation loop using lerp for beacon, instant for dot & torch
  function render() {
    if (isPointerActive) {
      // Beacon follows with buttery smooth damping
      beaconX += (mouseX - beaconX) * 0.22;
      beaconY += (mouseY - beaconY) * 0.22;

      beacon.style.transform = `translate3d(${beaconX}px, ${beaconY}px, 0)`;
      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;

      // Viewport torch position
      torch.style.setProperty('--torch-x', `${mouseX}px`);
      torch.style.setProperty('--torch-y', `${mouseY}px`);
    }

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}
