/**
 * Alpha Quarante — Motion (curtain, magnetic, parallax, progress)
 */
(function () {
  // ── Entry curtain ──────────────────────────────────
  const curtain = document.getElementById('pageCurtain');
  const brand = document.getElementById('curtainBrand');
  if (curtain) {
    requestAnimationFrame(() => {
      if (brand) brand.classList.add('shown');
      setTimeout(() => {
        curtain.classList.add('hiding');
        setTimeout(() => curtain.classList.add('done'), 750);
      }, 700);
    });
  }

  // ── Scroll progress ────────────────────────────────
  const bar = document.getElementById('scrollProgressBar');
  const si = document.getElementById('scrollIndicator');
  if (bar) {
    window.addEventListener('scroll', () => {
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = docH > 0 ? window.scrollY / docH : 0;
      bar.style.width = (ratio * 100) + '%';
      if (si && window.scrollY > 60) si.classList.add('hidden');
    }, { passive: true });
  }

  // ── Magnetic buttons ───────────────────────────────
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  if (!reduce && !coarse) {
    document.querySelectorAll('.magnetic').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.18}px, ${y * 0.22}px)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
      });
    });
  }

  // ── Hero silk parallax ─────────────────────────────
  const heroBg = document.getElementById('heroBg');
  if (heroBg && !reduce && !coarse) {
    let tx = 0, ty = 0, cx = 0, cy = 0;
    window.addEventListener('mousemove', (e) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 18;
      ty = (e.clientY / window.innerHeight - 0.5) * 12;
    }, { passive: true });

    (function tick() {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      heroBg.style.transform = `scale(1.1) translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(tick);
    })();
  }
})();
