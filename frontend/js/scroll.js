/**
 * Alpha Quarante — Scroll Reveal
 * Uses IntersectionObserver to reveal elements with
 * fade-in + slide-up animations as they enter viewport.
 */

(function () {
  // Elements to observe
  const SELECTORS = ['.reveal', '.reveal-scale', '.reveal-left', '.reveal-right'];

  function initReveal() {
    const allEls = document.querySelectorAll(SELECTORS.join(', '));

    if (!allEls.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target); // Only animate once
          }
        });
      },
      {
        threshold: 0.12,     // trigger when 12% visible
        rootMargin: '0px 0px -40px 0px', // slightly before viewport bottom
      }
    );

    allEls.forEach(el => {
      observer.observe(el);
    });
  }

  // Run after DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReveal);
  } else {
    initReveal();
  }
})();
