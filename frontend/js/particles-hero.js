/**
 * Alpha Quarante — Hero Particle Canvas (or / rouge)
 */
(function () {
  const canvas = document.getElementById('hero-particles-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, particles = [], animId;

  const COLORS = [
    '212, 175, 55',
    '232, 213, 163',
    '142, 0, 28',
    '184, 16, 46',
  ];

  const CONFIG = {
    count: window.innerWidth < 768 ? 36 : 64,
    maxDist: 110,
    speed: 0.28,
    dotRadius: 1.6,
    lineOpacity: 0.14,
  };

  function resize() {
    W = canvas.width = canvas.offsetWidth || canvas.parentElement.offsetWidth;
    H = canvas.height = canvas.offsetHeight || canvas.parentElement.offsetHeight;
  }

  class Particle {
    constructor() { this.reset(true); }
    reset(init = false) {
      this.x = Math.random() * W;
      this.y = init ? Math.random() * H : (Math.random() > 0.5 ? -5 : H + 5);
      this.vx = (Math.random() - 0.5) * CONFIG.speed;
      this.vy = (Math.random() - 0.5) * CONFIG.speed;
      this.r = Math.random() * CONFIG.dotRadius + 0.4;
      this.o = Math.random() * 0.45 + 0.15;
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < -10 || this.x > W + 10 || this.y < -10 || this.y > H + 10) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color}, ${this.o})`;
      ctx.fill();
    }
  }

  function init() {
    resize();
    particles = Array.from({ length: CONFIG.count }, () => new Particle());
  }

  function drawLines() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONFIG.maxDist) {
          const alpha = CONFIG.lineOpacity * (1 - dist / CONFIG.maxDist);
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(212, 175, 55, ${alpha})`;
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach((p) => { p.update(); p.draw(); });
    drawLines();
    animId = requestAnimationFrame(animate);
  }

  init();
  animate();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { CONFIG.count = window.innerWidth < 768 ? 36 : 64; init(); }, 200);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(animId);
    else animate();
  });
})();
