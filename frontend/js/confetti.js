/**
 * Alpha Quarante — Canvas Confetti
 * Custom lightweight canvas particle system.
 * No external dependencies.
 */

(function () {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  // Resize canvas to window
  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // ── Confetti Colors (matching brand palette) ──
  const COLORS = [
    '#D4AF37',
    '#E8D5A3',
    '#F7F0E4',
    '#8E001C',
    '#B8102E',
    '#C9A84C',
    '#A8892A',
  ];

  // ── Particle Class ────────────────────────────────────
  class Particle {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * canvas.width;
      this.y = initial ? Math.random() * canvas.height * -1 : -20;
      this.w = Math.random() * 10 + 4;
      this.h = Math.random() * 6 + 3;
      this.color = COLORS[Math.floor(Math.random() * COLORS.length)];
      this.opacity = Math.random() * 0.7 + 0.3;
      this.vx = (Math.random() - 0.5) * 2;
      this.vy = Math.random() * 3 + 2;
      this.angle = Math.random() * Math.PI * 2;
      this.angularVelocity = (Math.random() - 0.5) * 0.2;
      this.shape = Math.random() > 0.5 ? 'rect' : 'circle';
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += 0.05; // gravity
      this.angle += this.angularVelocity;
      this.vx += (Math.random() - 0.5) * 0.1; // slight horizontal drift

      if (this.y > canvas.height + 30) {
        this.reset();
      }
    }

    draw() {
      ctx.save();
      ctx.globalAlpha = this.opacity;
      ctx.fillStyle = this.color;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);

      if (this.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, this.w / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Rectangle (confetti strip)
        ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
      }

      ctx.restore();
    }
  }

  // ── Create Particles ──────────────────────────────────
  const PARTICLE_COUNT = 120;
  const particles = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new Particle());
  }

  // ── Animation Loop ────────────────────────────────────
  let animFrame;
  let elapsed = 0;
  const DURATION = 6000; // 6 seconds of confetti
  let startTime = null;

  function animate(timestamp) {
    if (!startTime) startTime = timestamp;
    elapsed = timestamp - startTime;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fade out particles after 4s
    const fadeProgress = Math.max(0, (elapsed - 4000) / 2000);

    particles.forEach(p => {
      p.opacity = Math.max(0, p.opacity - fadeProgress * 0.01);
      p.update();
      p.draw();
    });

    if (elapsed < DURATION) {
      animFrame = requestAnimationFrame(animate);
    } else {
      // Clear canvas when done
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.display = 'none';
    }
  }

  // ── Start after short delay (let checkmark animate first) ──
  setTimeout(() => {
    animFrame = requestAnimationFrame(animate);
  }, 600);

  // Cleanup on page hide
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && animFrame) {
      cancelAnimationFrame(animFrame);
    }
  });
})();
