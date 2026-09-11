/**
 * Alpha Quarante — Navigation
 * - Scroll effect (blur backdrop)
 * - Mobile burger menu
 * - Smooth close on link click
 */

(function () {
  const nav       = document.getElementById('navbar');
  const burger    = document.getElementById('navBurger');
  const navLinks  = document.getElementById('navLinks');
  const overlay   = document.getElementById('navOverlay');

  if (!nav) return;

  // ── Scroll effect ──────────────────────────────────
  let lastScroll = 0;

  function onScroll() {
    const scrollY = window.scrollY;

    if (scrollY > 60) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }

    lastScroll = scrollY;
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run on init

  // ── Mobile menu ────────────────────────────────────
  function openMenu() {
    burger.classList.add('open');
    navLinks.classList.add('open');
    overlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
    burger.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    burger.classList.remove('open');
    navLinks.classList.remove('open');
    overlay.classList.remove('visible');
    document.body.style.overflow = '';
    burger.setAttribute('aria-expanded', 'false');
  }

  if (burger) {
    burger.addEventListener('click', () => {
      if (burger.classList.contains('open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });
  }

  if (overlay) {
    overlay.addEventListener('click', closeMenu);
  }

  // Close menu on nav link click
  if (navLinks) {
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeMenu);
    });
  }

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
})();
