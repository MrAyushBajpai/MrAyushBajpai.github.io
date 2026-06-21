/* ════════════════════════════════════════════════════════
   AYUSH BAJPAI — PORTFOLIO SCRIPT
   Modules: ParticleSystem · CursorTrail · TypeWriter ·
            ScrollAnimator · NavController · LCBars
   ════════════════════════════════════════════════════════ */

'use strict';

/* ════════════════════════════════════════════════════════
   1. PARTICLE / CONSTELLATION SYSTEM
   ════════════════════════════════════════════════════════ */
class Particle {
  constructor(w, h) {
    this.w = w; this.h = h;
    this.init();
  }

  init() {
    this.x  = Math.random() * this.w;
    this.y  = Math.random() * this.h;
    this.vx = (Math.random() - 0.5) * 0.45;
    this.vy = (Math.random() - 0.5) * 0.45;
    this.r  = Math.random() * 1.6 + 0.6;
    this.alpha   = Math.random() * 0.45 + 0.15;
    this.phase   = Math.random() * Math.PI * 2;
    this.pSpeed  = Math.random() * 0.018 + 0.008;
  }

  update(mx, my) {
    this.phase += this.pSpeed;
    this.x += this.vx;
    this.y += this.vy;

    /* Mouse repulsion */
    if (mx !== null) {
      const dx = this.x - mx, dy = this.y - my;
      const d2 = dx * dx + dy * dy;
      if (d2 < 14400) { /* 120px */
        const d    = Math.sqrt(d2);
        const f    = (120 - d) / 120 * 0.04;
        this.vx   += (dx / d) * f;
        this.vy   += (dy / d) * f;
      }
    }

    /* Dampen & drift */
    this.vx *= 0.992;
    this.vy *= 0.992;
    if (Math.abs(this.vx) < 0.08) this.vx += (Math.random() - 0.5) * 0.08;
    if (Math.abs(this.vy) < 0.08) this.vy += (Math.random() - 0.5) * 0.08;

    /* Wrap edges */
    if (this.x < -10) this.x = this.w + 10;
    if (this.x > this.w + 10) this.x = -10;
    if (this.y < -10) this.y = this.h + 10;
    if (this.y > this.h + 10) this.y = -10;
  }

  draw(ctx) {
    const pulse = Math.sin(this.phase) * 0.28 + 0.72;
    const a     = this.alpha * pulse;

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r * pulse, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(0,212,255,${a})`;
    ctx.fill();

    if (this.r > 1.4) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * 3 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,212,255,${a * 0.12})`;
      ctx.fill();
    }
  }
}

class ParticleSystem {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx    = this.canvas.getContext('2d');
    this.particles = [];
    this.mouse  = { x: null, y: null };
    this.raf    = null;
    this.active = true;

    this.resize();
    this.populate();
    this.bindEvents();
    this.loop();
  }

  resize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  populate() {
    const area  = this.canvas.width * this.canvas.height;
    const count = Math.min(Math.floor(area / 7800), 160);
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(this.canvas.width, this.canvas.height));
    }
  }

  bindEvents() {
    const ro = new ResizeObserver(() => { this.resize(); this.populate(); });
    ro.observe(document.body);

    window.addEventListener('mousemove', e => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
    window.addEventListener('mouseleave', () => {
      this.mouse.x = null;
      this.mouse.y = null;
    });

    /* Pause when tab hidden */
    document.addEventListener('visibilitychange', () => {
      this.active = !document.hidden;
      if (this.active) this.loop();
    });
  }

  connectParticles() {
    const MAX = 130, MAX2 = MAX * MAX;
    const pts = this.particles;
    const ctx = this.ctx;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x;
        const dy = pts[i].y - pts[j].y;
        const d2 = dx * dx + dy * dy;
        if (d2 < MAX2) {
          const alpha = (1 - Math.sqrt(d2) / MAX) * 0.38;
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.strokeStyle = `rgba(0,212,255,${alpha})`;
          ctx.lineWidth   = 0.6;
          ctx.stroke();
        }
      }
    }
  }

  loop() {
    if (!this.active) return;
    const { ctx, canvas } = this;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.particles.forEach(p => { p.update(this.mouse.x, this.mouse.y); p.draw(ctx); });
    this.connectParticles();
    this.raf = requestAnimationFrame(() => this.loop());
  }
}

/* ════════════════════════════════════════════════════════
   2. CURSOR TRAIL
   ════════════════════════════════════════════════════════ */
class CursorTrail {
  constructor() {
    this.dot       = document.getElementById('cursorDot');
    this.ring      = document.getElementById('cursorRing');
    if (!this.dot || !this.ring) return;

    this.mx = 0; this.my = 0;
    this.rx = 0; this.ry = 0;
    this.lastTrail = 0;
    this.TRAIL_INTERVAL = 45; /* ms between trail dots */

    this.bindEvents();
    this.animateRing();
  }

  bindEvents() {
    document.addEventListener('mousemove', e => {
      this.mx = e.clientX;
      this.my = e.clientY;

      /* Position cursor dot instantly */
      this.dot.style.left = e.clientX + 'px';
      this.dot.style.top  = e.clientY + 'px';

      /* Throttled trail */
      const now = Date.now();
      if (now - this.lastTrail > this.TRAIL_INTERVAL) {
        this.spawnTrail(e.clientX, e.clientY);
        this.lastTrail = now;
      }
    });

    /* Hover grow */
    document.addEventListener('mouseover', e => {
      const t = e.target;
      if (t.matches('a,button,.skill-tag,.project-card,.ach-card,.social-btn,.nav-cta,.btn-primary,.btn-secondary')) {
        this.dot.classList.add('cursor-hover');
        this.ring.classList.add('cursor-hover');
      } else {
        this.dot.classList.remove('cursor-hover');
        this.ring.classList.remove('cursor-hover');
      }
    });
  }

  spawnTrail(x, y) {
    const el  = document.createElement('div');
    el.className = 'trail-dot';
    const size   = Math.random() * 5 + 2;
    el.style.cssText = `
      left:${x}px; top:${y}px;
      width:${size}px; height:${size}px;
      background: rgba(0,${Math.floor(180 + Math.random()*75)},255,0.7);
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 650);
  }

  animateRing() {
    /* Smooth lag-follow for the ring */
    this.rx += (this.mx - this.rx) * 0.14;
    this.ry += (this.my - this.ry) * 0.14;
    this.ring.style.left = this.rx + 'px';
    this.ring.style.top  = this.ry + 'px';
    requestAnimationFrame(() => this.animateRing());
  }
}

/* ════════════════════════════════════════════════════════
   3. TYPEWRITER
   ════════════════════════════════════════════════════════ */
class TypeWriter {
  constructor(elId, words, cfg = {}) {
    this.el        = document.getElementById(elId);
    if (!this.el) return;
    this.words     = words;
    this.typeSpeed = cfg.typeSpeed   || 75;
    this.delSpeed  = cfg.delSpeed    || 42;
    this.pause     = cfg.pause       || 2200;
    this.wi = 0; this.ci = 0; this.deleting = false;
    this.tick();
  }

  tick() {
    const word = this.words[this.wi];
    if (this.deleting) {
      this.el.textContent = word.substring(0, --this.ci);
    } else {
      this.el.textContent = word.substring(0, ++this.ci);
    }

    let delay = this.deleting ? this.delSpeed : this.typeSpeed;

    if (!this.deleting && this.ci === word.length) {
      delay = this.pause;
      this.deleting = true;
    } else if (this.deleting && this.ci === 0) {
      this.deleting = false;
      this.wi = (this.wi + 1) % this.words.length;
      delay = 380;
    }
    setTimeout(() => this.tick(), delay);
  }
}

/* ════════════════════════════════════════════════════════
   4. SCROLL REVEAL ANIMATOR
   ════════════════════════════════════════════════════════ */
class ScrollAnimator {
  constructor() {
    this.io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (!e.isIntersecting) return;
        const delay = parseInt(e.target.dataset.delay || 0, 10);
        setTimeout(() => e.target.classList.add('visible'), delay);
        this.io.unobserve(e.target);
      }),
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.reveal').forEach(el => this.io.observe(el));
  }
}

/* ════════════════════════════════════════════════════════
   5. NAVBAR CONTROLLER
   ════════════════════════════════════════════════════════ */
class NavController {
  constructor() {
    this.navbar  = document.getElementById('navbar');
    this.toggle  = document.getElementById('navToggle');
    this.menu    = document.getElementById('mobileMenu');
    this.links   = document.querySelectorAll('.nav-link');
    this.mLinks  = document.querySelectorAll('.mobile-link');
    this.sections = Array.from(document.querySelectorAll('section[id]'));
    this.bind();
  }

  bind() {
    /* Scroll: add class + highlight active link */
    window.addEventListener('scroll', () => this.onScroll(), { passive: true });

    /* Mobile toggle */
    this.toggle.addEventListener('click', () => {
      const open = this.menu.classList.toggle('open');
      this.toggle.classList.toggle('open', open);
    });
    this.mLinks.forEach(l => l.addEventListener('click', () => {
      this.menu.classList.remove('open');
      this.toggle.classList.remove('open');
    }));

    /* Smooth anchor scroll */
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const target = document.querySelector(a.getAttribute('href'));
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  onScroll() {
    const y = window.scrollY;
    this.navbar.classList.toggle('scrolled', y > 60);

    /* Active section highlighting */
    let current = '';
    this.sections.forEach(s => {
      if (y >= s.offsetTop - 120) current = s.id;
    });
    this.links.forEach(l => {
      const active = l.getAttribute('href') === `#${current}`;
      l.classList.toggle('active', active);
    });
  }
}

/* ════════════════════════════════════════════════════════
   6. LEETCODE BAR ANIMATION
   ════════════════════════════════════════════════════════ */
class LCBarAnimator {
  constructor() {
    const fills = document.querySelectorAll('.lc-fill');
    if (!fills.length) return;

    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const targetW = e.target.dataset.w;
        e.target.style.width = targetW + '%';
        io.unobserve(e.target);
      });
    }, { threshold: 0.4 });

    fills.forEach(f => io.observe(f));
  }
}

/* ════════════════════════════════════════════════════════
   7. GLITCH INTERVAL TRIGGER
      (re-runs glitch CSS anim every N seconds so it feels
       alive and not just on load)
   ════════════════════════════════════════════════════════ */
function pulseGlitch() {
  const el = document.querySelector('.glitch');
  if (!el) return;
  /* force reflow to restart animation */
  setInterval(() => {
    el.style.animation = 'none';
    void el.offsetHeight;
    el.style.animation = '';
  }, 6000);
}

/* ════════════════════════════════════════════════════════
   8. SKILL TAG MAGNETIC HOVER
   ════════════════════════════════════════════════════════ */
function initMagneticTags() {
  document.querySelectorAll('.skill-tag').forEach(tag => {
    tag.addEventListener('mousemove', e => {
      const r = tag.getBoundingClientRect();
      const cx = r.left + r.width  / 2;
      const cy = r.top  + r.height / 2;
      const dx = (e.clientX - cx) * 0.22;
      const dy = (e.clientY - cy) * 0.22;
      tag.style.transform = `translate(${dx}px,${dy}px) scale(1.05)`;
    });
    tag.addEventListener('mouseleave', () => {
      tag.style.transform = '';
    });
  });
}

/* ════════════════════════════════════════════════════════
   9. PROJECT CARD TILT
   ════════════════════════════════════════════════════════ */
function initCardTilt() {
  document.querySelectorAll('.project-card, .ach-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r   = card.getBoundingClientRect();
      const cx  = r.left + r.width  / 2;
      const cy  = r.top  + r.height / 2;
      const rx  = ((e.clientY - cy) / (r.height / 2)) * 4;
      const ry  = ((e.clientX - cx) / (r.width  / 2)) * -4;
      card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform .4s cubic-bezier(.4,0,.2,1), border-color .18s, box-shadow .18s';
    });
    card.addEventListener('mouseenter', () => {
      card.style.transition = 'transform .12s linear, border-color .18s, box-shadow .18s';
    });
  });
}

/* ════════════════════════════════════════════════════════
   10. HERO SECTION PARALLAX
   ════════════════════════════════════════════════════════ */
function initParallax() {
  const avatar = document.querySelector('.avatar-frame');
  if (!avatar) return;
  window.addEventListener('mousemove', e => {
    const cx = window.innerWidth  / 2;
    const cy = window.innerHeight / 2;
    const dx = (e.clientX - cx) / cx;
    const dy = (e.clientY - cy) / cy;
    avatar.style.transform = `translate(${dx * 8}px, ${dy * 6}px)`;
  }, { passive: true });
}

/* ════════════════════════════════════════════════════════
   11. SCROLL TO TOP
   ════════════════════════════════════════════════════════ */
window.scrollToTop = function () {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

/* ════════════════════════════════════════════════════════
   12. SECTION ENTRY COUNTER (numbers count up)
   ════════════════════════════════════════════════════════ */
function countUp(el, target, duration = 1400) {
  const start = performance.now();
  const update = now => {
    const progress = Math.min((now - start) / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3);
    const current  = Math.floor(eased * target);
    el.textContent = current.toLocaleString();
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = target.toLocaleString();
  };
  requestAnimationFrame(update);
}

function initCounters() {
  const targets = [
    { selector: '.lc-val:nth-child(1)', val: 487  },
    { selector: '.lc-val:nth-child(2)', val: 1898 },
    { selector: '.lc-val:nth-child(3)', val: null  }, /* skip % */
    { selector: '.lc-val:nth-child(4)', val: 67   },
  ];

  const lcStats = document.querySelector('.lc-stats-grid');
  if (!lcStats) return;

  const io = new IntersectionObserver(entries => {
    if (!entries[0].isIntersecting) return;
    const vals = lcStats.querySelectorAll('.lc-val');
    const nums = [487, 1898, null, 67];
    vals.forEach((el, i) => {
      if (nums[i] !== null) countUp(el, nums[i]);
    });
    io.disconnect();
  }, { threshold: 0.5 });
  io.observe(lcStats);
}

/* ════════════════════════════════════════════════════════
   INIT — DOMContentLoaded
   ════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  /* Particle background (hero) */
  new ParticleSystem('particleCanvas');

  /* Custom cursor — desktop only */
  if (window.innerWidth > 768 && !('ontouchstart' in window)) {
    new CursorTrail();
  }

  /* Typewriter */
  new TypeWriter('typewriter', [
    'AI Systems.',
    'RAG Pipelines.',
    'Backend APIs.',
    'React Apps.',
    'C++ Algorithms.',
    'Smart Solutions.',
    'Clean Code.',
  ], { typeSpeed: 72, delSpeed: 40, pause: 2000 });

  /* Scroll reveals */
  new ScrollAnimator();

  /* Navbar */
  new NavController();

  /* LeetCode bars */
  new LCBarAnimator();

  /* Count-up numbers */
  initCounters();

  /* Glitch pulse */
  pulseGlitch();

  /* Skill tag magnetic effect */
  initMagneticTags();

  /* Card 3D tilt */
  initCardTilt();

  /* Avatar parallax */
  initParallax();

  /* ── Page-load fade-in ── */
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity .6s ease';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { document.body.style.opacity = '1'; });
  });
});
