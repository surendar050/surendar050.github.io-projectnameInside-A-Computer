/* ================================================================
   INSIDE A COMPUTER — script.js
   Handles: Loading, Particles, Scroll animations, Component
   diagrams, Simulations, Theme toggle, Level toggle
================================================================ */

'use strict';

/* ---------------------------------------------------------------
   UTILITY HELPERS
--------------------------------------------------------------- */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max + 1));

/* ---------------------------------------------------------------
   1. LOADING SCREEN
--------------------------------------------------------------- */
(function initLoader() {
  const loader = $('#loader');
  const fill = $('#loaderFill');
  const pct = $('#loaderPercent');
  let progress = 0;

  const tick = () => {
    // Accelerate toward 100 with slight randomness
    const step = rand(1.5, 4.5);
    progress = Math.min(100, progress + step);
    fill.style.width = progress + '%';
    pct.textContent = Math.floor(progress) + '%';

    if (progress < 100) {
      setTimeout(tick, rand(25, 60));
    } else {
      // Small pause at 100% then hide
      setTimeout(() => {
        loader.classList.add('hide');
        document.body.classList.remove('loading');
        // Show keyboard hint after a short delay
        setTimeout(() => {
          const hint = $('#keyboardHint');
          hint.classList.add('visible');
          setTimeout(() => hint.classList.remove('visible'), 4000);
        }, 1200);
      }, 500);
    }
  };

  // Start after a short initial delay
  setTimeout(tick, 300);
})();

/* ---------------------------------------------------------------
   2. SCROLL PROGRESS BAR
--------------------------------------------------------------- */
function updateScrollProgress() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
  const bar = $('#scrollProgress');
  if (bar) {
    bar.style.width = progress + '%';
    bar.setAttribute('aria-valuenow', Math.round(progress));
  }
}

/* ---------------------------------------------------------------
   3. NAVIGATION — scroll state + active link
--------------------------------------------------------------- */
function updateNavbar() {
  const nav = $('#navbar');
  if (!nav) return;
  nav.classList.toggle('scrolled', window.scrollY > 50);

  // Active link based on current section
  const sections = $$('section[id]');
  const scrollMid = window.scrollY + window.innerHeight / 3;
  sections.forEach(sec => {
    const link = $(`a[href="#${sec.id}"]`, nav);
    if (!link) return;
    const inView = scrollMid >= sec.offsetTop && scrollMid < sec.offsetTop + sec.offsetHeight;
    link.classList.toggle('active', inView);
  });
}

// Hamburger menu
const hamburger = $('#hamburger');
const mobileMenu = $('#mobileMenu');
const mobileClose = $('#mobileMenuClose');

hamburger?.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  hamburger.setAttribute('aria-expanded', String(open));
  mobileMenu.setAttribute('aria-hidden', String(!open));
});

mobileClose?.addEventListener('click', () => {
  mobileMenu.classList.remove('open');
  mobileMenu.setAttribute('aria-hidden', 'true');
  hamburger?.setAttribute('aria-expanded', 'false');
});

$$('.mobile-link').forEach(link => {
  link.addEventListener('click', () => {
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
  });
});

/* ---------------------------------------------------------------
   4. THEME TOGGLE (dark / light)
--------------------------------------------------------------- */
const themeToggle = $('#themeToggle');
let currentTheme = localStorage.getItem('theme') || 'dark';

function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  currentTheme = theme;
  localStorage.setItem('theme', theme);
}

applyTheme(currentTheme);

themeToggle?.addEventListener('click', () => {
  applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
});

/* ---------------------------------------------------------------
   5. LEVEL TOGGLE (basic / advanced)
--------------------------------------------------------------- */
const levelToggle = $('#levelToggle');
const levelLabel = $('#levelLabel');
const levelBannerLabel = $('#levelBannerLabel');
let isAdvanced = false;

function applyLevel() {
  const basics = $$('.basic-content');
  const advances = $$('.advanced-content');
  basics.forEach(el => el.classList.toggle('hidden', isAdvanced));
  advances.forEach(el => el.classList.toggle('hidden', !isAdvanced));
  levelLabel.textContent = isAdvanced ? 'ADVANCED' : 'BASIC';
  levelBannerLabel.textContent = isAdvanced ? 'Advanced Mode' : 'Basic Mode';
}

levelToggle?.addEventListener('click', () => {
  isAdvanced = !isAdvanced;
  applyLevel();
  // Quick visual pulse on all component texts
  $$('.component-text').forEach(el => {
    el.style.transition = 'opacity 0.2s';
    el.style.opacity = '0';
    setTimeout(() => { el.style.opacity = '1'; }, 200);
  });
});

/* ---------------------------------------------------------------
   6. KEYBOARD SHORTCUTS
--------------------------------------------------------------- */
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  if (e.key === 't' || e.key === 'T') themeToggle?.click();
  if (e.key === 'l' || e.key === 'L') levelToggle?.click();
  if (e.key === 'Escape') {
    mobileMenu?.classList.remove('open');
    mobileMenu?.setAttribute('aria-hidden', 'true');
  }
});

/* ---------------------------------------------------------------
   7. SCROLL-TRIGGERED REVEAL ANIMATIONS
--------------------------------------------------------------- */
function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const delay = parseInt(el.dataset.revealDelay || '0');
      setTimeout(() => el.classList.add('revealed'), delay);
      observer.unobserve(el);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

  $$('[data-reveal]').forEach(el => observer.observe(el));
}

/* ---------------------------------------------------------------
   8. STORAGE BAR ANIMATION (trigger when in view)
--------------------------------------------------------------- */
function initStorageBars() {
  const storageSection = $('#storage');
  if (!storageSection) return;
  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      $$('.storage-type').forEach(el => el.classList.add('animate'));
      obs.disconnect();
    }
  }, { threshold: 0.3 });
  obs.observe(storageSection);
}

/* ---------------------------------------------------------------
   9. EXPAND PANELS (click-to-expand with ARIA)
--------------------------------------------------------------- */
function initExpandPanels() {
  $$('.expand-btn').forEach(btn => {
    const targetId = btn.dataset.target;
    const panel = targetId ? $(`#${targetId}`) : null;
    if (!panel) return;

    btn.addEventListener('click', () => {
      const open = panel.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
      panel.setAttribute('aria-hidden', String(!open));
    });
  });
}

/* ---------------------------------------------------------------
   10. HERO PARTICLE CANVAS
--------------------------------------------------------------- */
function initHeroCanvas() {
  const canvas = $('#heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [], animId;
  let mouseX = -9999, mouseY = -9999;

  const PARTICLE_COUNT = window.innerWidth < 600 ? 60 : 120;
  const COLORS = ['#00e5ff', '#3b82f6', '#a855f7', '#ec4899'];

  class Particle {
    constructor() { this.reset(true); }
    reset(init = false) {
      this.x = rand(0, W);
      this.y = init ? rand(0, H) : rand(-10, -100);
      this.vx = rand(-0.3, 0.3);
      this.vy = rand(0.2, 0.8);
      this.radius = rand(1, 2.5);
      this.alpha = rand(0.2, 0.7);
      this.color = COLORS[randInt(0, COLORS.length - 1)];
      this.life = 0;
      this.maxLife = rand(200, 500);
    }
    update() {
      // Repel slightly from mouse
      const dx = this.x - mouseX, dy = this.y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120) {
        this.vx += (dx / dist) * 0.08;
        this.vy += (dy / dist) * 0.08;
      }
      this.x += this.vx;
      this.y += this.vy;
      this.life++;
      if (this.life > this.maxLife || this.y > H + 20) this.reset();
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha * (1 - this.life / this.maxLife);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.shadowBlur = 6;
      ctx.shadowColor = this.color;
      ctx.fill();
      ctx.restore();
    }
  }

  // Draw connecting lines between nearby particles
  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 80) {
          ctx.save();
          ctx.globalAlpha = (1 - dist / 80) * 0.12;
          ctx.strokeStyle = '#00e5ff';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }

  function resize() {
    W = canvas.width = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  function init() {
    resize();
    particles = Array.from({ length: PARTICLE_COUNT }, () => new Particle());
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    drawConnections();
    particles.forEach(p => { p.update(); p.draw(); });
    animId = requestAnimationFrame(loop);
  }

  // Pause when hero is not visible
  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      if (!animId) loop();
    } else {
      cancelAnimationFrame(animId);
      animId = null;
    }
  });
  obs.observe(canvas.closest('section'));

  canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });
  canvas.addEventListener('mouseleave', () => { mouseX = -9999; mouseY = -9999; });

  window.addEventListener('resize', () => { resize(); });
  init();
  loop();
}

/* ---------------------------------------------------------------
   11. PARALLAX ON HERO CONTENT
--------------------------------------------------------------- */
function initParallax() {
  const heroContent = $('[data-parallax]');
  if (!heroContent) return;
  const speed = parseFloat(heroContent.dataset.parallax || '0.3');

  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const hero = $('#hero');
    if (scrolled < (hero?.offsetHeight || 0)) {
      heroContent.style.transform = `translateY(${scrolled * speed}px)`;
      heroContent.style.opacity = 1 - (scrolled / 600);
    }
  }, { passive: true });
}

/* ---------------------------------------------------------------
   12. CPU DIAGRAM — animated cores
--------------------------------------------------------------- */
function initCpuDiagram() {
  const grid = $('#cpuCoresGrid');
  if (!grid) return;
  const NUM_CORES = 8;
  const cores = [];

  // Build cores
  for (let i = 0; i < NUM_CORES; i++) {
    const core = document.createElement('div');
    core.className = 'cpu-core';
    core.setAttribute('aria-label', `Core ${i + 1}`);
    core.textContent = `C${i + 1}`;
    grid.appendChild(core);
    cores.push(core);
  }

  // Randomly fire cores
  setInterval(() => {
    const numFire = randInt(1, 4);
    const shuffled = [...cores].sort(() => Math.random() - 0.5).slice(0, numFire);
    shuffled.forEach(c => {
      c.classList.add('active');
      setTimeout(() => c.classList.remove('active'), rand(200, 600));
    });
  }, 300);

  // Heat fill animation tied to slider
  const slider = $('#cpuSlider');
  const heatFill = $('#heatFill');
  const speedLabel = $('#cpuSpeedLabel');

  if (slider && heatFill) {
    const update = () => {
      const v = parseFloat(slider.value);
      const pct = ((v - 1) / 4) * 100;
      heatFill.style.height = clamp(pct * 0.6 + 10, 10, 85) + '%';
      speedLabel.textContent = v.toFixed(1) + ' GHz';
    };
    slider.addEventListener('input', update);
    update();
  }
}

/* ---------------------------------------------------------------
   13. RAM DIAGRAM — animated cells and gauge
--------------------------------------------------------------- */
function initRamDiagram() {
  const cellsContainer = $('#ramCells');
  const pinsContainer = $('#ramPins');
  const gaugeFill = $('#ramGaugeFill');
  const gaugeValue = $('#ramGaugeValue');
  const slider = $('#ramSlider');
  const appsLabel = $('#ramAppsLabel');

  if (!cellsContainer) return;

  const NUM_CELLS = 64;
  const cells = [];

  // Build cells
  for (let i = 0; i < NUM_CELLS; i++) {
    const cell = document.createElement('div');
    cell.className = 'ram-cell';
    cellsContainer.appendChild(cell);
    cells.push(cell);
  }

  // Build pins
  if (pinsContainer) {
    for (let i = 0; i < 40; i++) {
      const pin = document.createElement('div');
      pin.className = 'ram-pin';
      pinsContainer.appendChild(pin);
    }
  }

  // Slider drives usage
  const updateRam = () => {
    if (!slider) return;
    const apps = parseInt(slider.value);
    const usedPct = clamp(apps / 10, 0, 1);
    const usedCells = Math.floor(cells.length * usedPct);

    cells.forEach((cell, i) => {
      cell.classList.toggle('used', i < usedCells);
    });

    const gbUsed = (usedPct * 16).toFixed(1);
    if (gaugeFill) gaugeFill.style.width = (usedPct * 100) + '%';
    if (gaugeValue) gaugeValue.textContent = `${gbUsed} GB / 16 GB`;
    if (appsLabel) appsLabel.textContent = `${apps} app${apps !== 1 ? 's' : ''}`;
  };

  slider?.addEventListener('input', updateRam);

  // Animate random cell activity
  setInterval(() => {
    const activeCells = cells.filter(c => c.classList.contains('used'));
    if (activeCells.length > 0) {
      const cell = activeCells[randInt(0, activeCells.length - 1)];
      cell.classList.add('active');
      setTimeout(() => cell.classList.remove('active'), 200);
    }
  }, 150);

  // Init with IntersectionObserver
  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) { updateRam(); obs.disconnect(); }
  }, { threshold: 0.2 });
  obs.observe(cellsContainer);
}

/* ---------------------------------------------------------------
   14. GPU CANVAS — animated pixel rendering simulation
--------------------------------------------------------------- */
function initGpuCanvas() {
  const canvas = $('#gpuCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let animId;

  const W = canvas.width;
  const H = canvas.height;
  const GRID = 20;
  const COLS = Math.floor(W / GRID);
  const ROWS = Math.floor(H / GRID);
  const pixels = [];
  let frame = 0;
  let coresActive = 0;

  const PALETTE = ['#ec4899', '#a855f7', '#3b82f6', '#00e5ff', '#10b981', '#f59e0b'];

  // Initialize pixel grid
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      pixels.push({
        x: c * GRID, y: r * GRID,
        color: PALETTE[randInt(0, PALETTE.length - 1)],
        alpha: 0,
        targetAlpha: rand(0.4, 1),
        lit: false,
        delay: randInt(0, 80)
      });
    }
  }

  const slider = $('#gpuSlider');
  const resLabel = $('#gpuResLabel');
  const coresEl = $('#gpuCoresActive');
  const fpsEl = $('#gpuFps');
  const vramEl = $('#gpuVram');
  const resLabels = ['720p', '1080p', '1440p', '4K'];
  const fpsValues = [240, 144, 60, 30];
  const vramValues = ['2.1 GB', '4.2 GB', '6.2 GB', '12.4 GB'];

  let speedMult = 1;
  slider?.addEventListener('input', () => {
    const v = parseInt(slider.value) - 1;
    resLabel.textContent = resLabels[v] || '1080p';
    speedMult = [2, 1, 0.6, 0.3][v] || 1;
    if (fpsEl) fpsEl.textContent = fpsValues[v];
    if (vramEl) vramEl.textContent = vramValues[v];
  });

  let lastTime = 0;
  const animate = (time) => {
    if (time - lastTime < 16) { animId = requestAnimationFrame(animate); return; }
    lastTime = time;
    frame++;
    ctx.clearRect(0, 0, W, H);

    coresActive = 0;
    pixels.forEach((p, i) => {
      if (frame > p.delay) {
        if (!p.lit) {
          p.alpha += 0.04 * speedMult;
          if (p.alpha >= p.targetAlpha) {
            p.alpha = p.targetAlpha;
            p.lit = true;
          }
        } else {
          // Occasionally flicker for "render" effect
          if (Math.random() < 0.002 * speedMult) {
            p.alpha = 0;
            p.lit = false;
            p.color = PALETTE[randInt(0, PALETTE.length - 1)];
            p.delay = frame + randInt(0, 20);
            coresActive++;
          }
        }
        if (p.alpha > 0) {
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.fillRect(p.x + 1, p.y + 1, GRID - 2, GRID - 2);
          if (p.alpha > 0.8) coresActive++;
        }
      }
    });

    ctx.globalAlpha = 1;
    if (coresEl) coresEl.textContent = Math.floor(coresActive / 2).toLocaleString();

    animId = requestAnimationFrame(animate);
  };

  // Pause when not visible
  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      if (!animId) animId = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(animId);
      animId = null;
    }
  });
  obs.observe(canvas);
}

/* ---------------------------------------------------------------
   15. STORAGE VISUAL — disk usage breakdown
--------------------------------------------------------------- */
function initStorageVisual() {
  const container = $('#storageVisual');
  if (!container) return;

  const segments = [
    { label: 'OS (Windows/macOS)', pct: 15, color: '#3b82f6' },
    { label: 'Applications', pct: 25, color: '#a855f7' },
    { label: 'Media (photos, video)', pct: 30, color: '#ec4899' },
    { label: 'Documents', pct: 10, color: '#f59e0b' },
    { label: 'Games', pct: 15, color: '#10b981' },
    { label: 'Free Space', pct: 5, color: '#1a2235' },
  ];

  segments.forEach(seg => {
    const div = document.createElement('div');
    div.className = 'su-segment';
    div.style.flex = seg.pct;
    div.style.background = seg.color;
    div.title = `${seg.label}: ${seg.pct}%`;
    div.setAttribute('data-label', `${seg.label}: ${seg.pct}%`);
    div.setAttribute('aria-label', `${seg.label}: ${seg.pct}%`);
    container.appendChild(div);
  });
}

/* ---------------------------------------------------------------
   16. NETWORK CANVAS — node-and-packet visualization
--------------------------------------------------------------- */
function initNetworkCanvas() {
  const canvas = $('#networkCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let animId;

  const W = canvas.width;
  const H = canvas.height;

  // Network nodes
  const nodes = [
    { id: 'device', x: 60, y: H * 0.5, label: 'Your Device', color: '#10b981', role: 'device', r: 14 },
    { id: 'router', x: W * 0.35, y: H * 0.3, label: 'Router', color: '#00e5ff', role: 'router', r: 12 },
    { id: 'isp', x: W * 0.55, y: H * 0.7, label: 'ISP', color: '#00e5ff', role: 'router', r: 11 },
    { id: 'cdn', x: W * 0.7, y: H * 0.2, label: 'CDN', color: '#a855f7', role: 'server', r: 12 },
    { id: 'server', x: W - 50, y: H * 0.5, label: 'Web Server', color: '#a855f7', role: 'server', r: 14 },
    { id: 'dns', x: W * 0.5, y: H * 0.45, label: 'DNS', color: '#00e5ff', role: 'router', r: 10 },
  ];

  // Connections
  const edges = [
    ['device', 'router'],
    ['router', 'isp'],
    ['router', 'dns'],
    ['isp', 'server'],
    ['dns', 'cdn'],
    ['cdn', 'server'],
    ['isp', 'cdn'],
  ];

  // Active packets
  const packets = [];

  function spawnPacket() {
    const edge = edges[randInt(0, edges.length - 1)];
    const fromNode = nodes.find(n => n.id === edge[0]);
    const toNode = nodes.find(n => n.id === edge[1]);
    if (!fromNode || !toNode) return;

    const reverse = Math.random() > 0.5;
    packets.push({
      from: reverse ? toNode : fromNode,
      to: reverse ? fromNode : toNode,
      t: 0,
      speed: rand(0.008, 0.025),
      color: fromNode.color,
    });
  }

  // Spawn packets periodically
  setInterval(() => {
    if (packets.length < 12) spawnPacket();
  }, 400);

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Dark background
    ctx.fillStyle = 'rgba(3,7,18,0)';
    ctx.fillRect(0, 0, W, H);

    // Draw edges
    edges.forEach(([fromId, toId]) => {
      const from = nodes.find(n => n.id === fromId);
      const to = nodes.find(n => n.id === toId);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = 'rgba(99,177,255,0.15)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Draw nodes
    nodes.forEach(node => {
      // Outer ring glow
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r + 4, 0, Math.PI * 2);
      ctx.strokeStyle = node.color + '30';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Node fill
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
      ctx.fillStyle = node.color + '25';
      ctx.fill();
      ctx.strokeStyle = node.color;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Pulsing center dot
      ctx.beginPath();
      ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = node.color;
      ctx.shadowBlur = 6;
      ctx.shadowColor = node.color;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Label
      ctx.fillStyle = 'rgba(148,163,184,0.9)';
      ctx.font = `500 10px Rajdhani, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(node.label, node.x, node.y + node.r + 14);
    });

    // Animate and draw packets
    for (let i = packets.length - 1; i >= 0; i--) {
      const p = packets[i];
      p.t += p.speed;

      if (p.t >= 1) {
        packets.splice(i, 1);
        continue;
      }

      const x = lerp(p.from.x, p.to.x, p.t);
      const y = lerp(p.from.y, p.to.y, p.t);

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    animId = requestAnimationFrame(draw);
  }

  // Pause when not visible
  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      if (!animId) animId = requestAnimationFrame(draw);
    } else {
      cancelAnimationFrame(animId);
      animId = null;
    }
  });
  obs.observe(canvas);

  // Network speed slider
  const slider = $('#netSlider');
  const netLabel = $('#netSpeedLabel');
  const speedLabels = ['10 Mbps', '100 Mbps', '1 Gbps', '2.5 Gbps', '10 Gbps'];
  slider?.addEventListener('input', () => {
    const v = parseInt(slider.value) - 1;
    netLabel.textContent = speedLabels[v] || '100 Mbps';
    // Increase packet spawn speed
    packets.forEach(p => { p.speed = rand(0.01, 0.04) * ((v + 1) * 0.5); });
  });
}

/* ---------------------------------------------------------------
   17. MINI SIMULATION (How components work together)
--------------------------------------------------------------- */
function initSimulation() {
  const simOpenApp = $('#simOpenApp');
  const simBrowse = $('#simBrowse');
  const simGame = $('#simGame');
  const log = $('#simLog');

  if (!log) return;

  let logTimeout = null;
  let simRunning = false;

  const COMPONENTS = {
    cpu: { id: 'simCpu', node: null },
    ram: { id: 'simRam', node: null },
    gpu: { id: 'simGpu', node: null },
    ssd: { id: 'simSsd', node: null },
    net: { id: 'simNet', node: null },
  };

  // Cache DOM references
  Object.values(COMPONENTS).forEach(c => {
    c.node = $(`#${c.id}`);
  });

  function clearLog() {
    log.innerHTML = '';
  }

  function addLog(text, delay) {
    return new Promise(resolve => {
      setTimeout(() => {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        const now = new Date();
        const time = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`;
        entry.innerHTML = `<span class="log-time">[${time}]</span> <span>${text}</span>`;
        log.appendChild(entry);
        log.scrollTop = log.scrollHeight;
        resolve();
      }, delay);
    });
  }

  function fireNode(id, duration = 800) {
    const comp = Object.values(COMPONENTS).find(c => c.id === id);
    if (!comp?.node) return;
    comp.node.classList.add('firing');
    setTimeout(() => comp.node.classList.remove('firing'), duration);
  }

  // Scenarios
  const scenarios = {
    app: [
      { delay: 0,    nodes: ['simSsd'], text: '📦 SSD: Loading app files from disk...' },
      { delay: 600,  nodes: ['simRam'], text: '🧠 RAM: App data loaded into working memory' },
      { delay: 1200, nodes: ['simCpu'], text: '⚡ CPU: Executing app initialization code' },
      { delay: 1800, nodes: ['simCpu', 'simRam'], text: '⚡ CPU + 🧠 RAM: Running startup routines...' },
      { delay: 2500, nodes: ['simGpu'], text: '🎨 GPU: Rendering the user interface to screen' },
      { delay: 3200, nodes: ['simCpu', 'simGpu', 'simRam'], text: '✅ App ready! All components synchronized.' },
    ],
    browse: [
      { delay: 0,    nodes: ['simNet'], text: '🌐 NET: Sending DNS query to resolve URL...' },
      { delay: 700,  nodes: ['simCpu'], text: '⚡ CPU: Processing TCP/IP connection request' },
      { delay: 1400, nodes: ['simNet'], text: '🌐 NET: Receiving HTML/CSS/JS packets from server' },
      { delay: 2000, nodes: ['simRam'], text: '🧠 RAM: Storing webpage data in browser cache' },
      { delay: 2600, nodes: ['simCpu'], text: '⚡ CPU: Parsing DOM tree and executing JavaScript' },
      { delay: 3300, nodes: ['simGpu'], text: '🎨 GPU: Compositing and rendering the webpage' },
      { delay: 4000, nodes: ['simCpu', 'simGpu', 'simRam', 'simNet'], text: '✅ Page loaded! Everything worked in harmony.' },
    ],
    game: [
      { delay: 0,    nodes: ['simSsd'], text: '📦 SSD: Streaming game assets (textures, maps)...' },
      { delay: 500,  nodes: ['simRam'], text: '🧠 RAM: Buffering 8 GB of game world data' },
      { delay: 1000, nodes: ['simCpu'], text: '⚡ CPU: Running physics engine & AI calculations' },
      { delay: 1600, nodes: ['simGpu'], text: '🎨 GPU: Rendering 3D scene at 144 FPS' },
      { delay: 2200, nodes: ['simCpu', 'simRam'], text: '⚡ CPU: Processing player input & game logic' },
      { delay: 2800, nodes: ['simNet'], text: '🌐 NET: Syncing multiplayer state with server (12ms)' },
      { delay: 3500, nodes: ['simCpu', 'simGpu', 'simRam', 'simSsd', 'simNet'], text: '✅ All 5 components running at full capacity!' },
    ],
  };

  async function runScenario(type) {
    if (simRunning) return;
    simRunning = true;
    clearLog();

    // Deactivate all buttons, activate current
    $$('.sim-btn').forEach(b => b.classList.remove('active'));
    const btnMap = { app: '#simOpenApp', browse: '#simBrowse', game: '#simGame' };
    $(btnMap[type])?.classList.add('active');

    const steps = scenarios[type];
    const promises = steps.map(step => {
      return new Promise(resolve => {
        setTimeout(() => {
          step.nodes.forEach(nodeId => fireNode(nodeId, 700));
          addLog(step.text, 0);
          resolve();
        }, step.delay);
      });
    });

    await Promise.all(promises);
    const maxDelay = Math.max(...steps.map(s => s.delay));
    setTimeout(() => {
      simRunning = false;
      $$('.sim-btn').forEach(b => b.classList.remove('active'));
    }, maxDelay + 1000);
  }

  simOpenApp?.addEventListener('click', () => runScenario('app'));
  simBrowse?.addEventListener('click', () => runScenario('browse'));
  simGame?.addEventListener('click', () => runScenario('game'));
}

/* ---------------------------------------------------------------
   18. CONCLUSION CANVAS — celebratory particles
--------------------------------------------------------------- */
function initConclusionCanvas() {
  const canvas = $('#conclusionCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [], animId;

  const COLORS = ['#00e5ff', '#3b82f6', '#a855f7', '#ec4899', '#10b981', '#f59e0b'];

  class StarParticle {
    constructor() { this.reset(); }
    reset() {
      this.x = rand(0, W);
      this.y = rand(0, H);
      this.r = rand(1, 3);
      this.speed = rand(0.1, 0.4);
      this.alpha = rand(0.1, 0.6);
      this.color = COLORS[randInt(0, COLORS.length - 1)];
      this.pulse = rand(0, Math.PI * 2);
    }
    update() {
      this.pulse += 0.02;
      this.alpha = 0.2 + 0.4 * Math.abs(Math.sin(this.pulse));
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = this.color;
      ctx.shadowBlur = 4;
      ctx.shadowColor = this.color;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function resize() {
    const parent = canvas.parentElement;
    W = canvas.width = parent.offsetWidth;
    H = canvas.height = parent.offsetHeight;
  }

  function init() {
    resize();
    particles = Array.from({ length: 80 }, () => new StarParticle());
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    particles.forEach(p => { p.update(); p.draw(); });
    animId = requestAnimationFrame(loop);
  }

  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting) {
      init();
      if (!animId) loop();
    } else {
      cancelAnimationFrame(animId);
      animId = null;
    }
  });
  obs.observe(canvas.closest('section'));

  window.addEventListener('resize', resize);
}

/* ---------------------------------------------------------------
   19. COMPONENT ACCENT COLORS (drive slider colors)
--------------------------------------------------------------- */
function initSliders() {
  // CPU slider → cyan
  const cpuSlider = $('#cpuSlider');
  if (cpuSlider) {
    cpuSlider.style.accentColor = '#00e5ff';
  }

  // RAM slider → purple
  const ramSlider = $('#ramSlider');
  if (ramSlider) {
    ramSlider.style.accentColor = '#a855f7';
  }

  // GPU slider → pink
  const gpuSlider = $('#gpuSlider');
  if (gpuSlider) {
    gpuSlider.style.accentColor = '#ec4899';
  }

  // Net slider → green
  const netSlider = $('#netSlider');
  if (netSlider) {
    netSlider.style.accentColor = '#10b981';
  }
}

/* ---------------------------------------------------------------
   20. SMOOTH SCROLL for anchor links
--------------------------------------------------------------- */
function initSmoothScroll() {
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const id = link.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const offset = 80; // navbar height buffer
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

/* ---------------------------------------------------------------
   21. SCROLL EVENT LISTENER (central hub)
--------------------------------------------------------------- */
let scrollRAF = null;
window.addEventListener('scroll', () => {
  if (scrollRAF) return;
  scrollRAF = requestAnimationFrame(() => {
    updateScrollProgress();
    updateNavbar();
    scrollRAF = null;
  });
}, { passive: true });

/* ---------------------------------------------------------------
   22. RESIZE HANDLER
--------------------------------------------------------------- */
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    // Re-init anything size-dependent here if needed
  }, 200);
});

/* ---------------------------------------------------------------
   23. SECTION TAG ANIMATION (stagger on reveal)
--------------------------------------------------------------- */
function initSectionTags() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const tags = $$('.section-tag', entry.target);
        tags.forEach((tag, i) => {
          tag.style.animation = `none`;
          tag.style.opacity = '0';
          setTimeout(() => {
            tag.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            tag.style.transform = 'translateX(-20px)';
            setTimeout(() => {
              tag.style.opacity = '1';
              tag.style.transform = 'translateX(0)';
            }, 50 + i * 100);
          }, 200);
        });
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  $$('section').forEach(s => obs.observe(s));
}

/* ---------------------------------------------------------------
   24. INIT — Run everything after DOM is ready
--------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  initReveal();
  initStorageBars();
  initExpandPanels();
  initHeroCanvas();
  initParallax();
  initCpuDiagram();
  initRamDiagram();
  initGpuCanvas();
  initStorageVisual();
  initNetworkCanvas();
  initSimulation();
  initConclusionCanvas();
  initSliders();
  initSmoothScroll();
  initSectionTags();

  // Initial state
  updateScrollProgress();
  updateNavbar();

  // Apply saved theme
  applyTheme(currentTheme);
  applyLevel();

  console.log(`
  ╔══════════════════════════════════╗
  ║   Inside A Computer — Loaded     ║
  ║   Keyboard shortcuts:            ║
  ║   T = Toggle theme               ║
  ║   L = Toggle level               ║
  ╚══════════════════════════════════╝
  `);
});
