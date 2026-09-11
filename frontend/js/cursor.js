/**
 * Alpha Quarante — Custom Cursor
 */
(function () {
  if (window.matchMedia('(hover: none)').matches) return;

  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  if (!dot || !ring) return;

  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let rx = mx, ry = my;
  let visible = false;

  dot.style.opacity = '0';
  ring.style.opacity = '0';
  document.body.style.cursor = 'none';

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    if (!visible) {
      dot.style.opacity = '1';
      ring.style.opacity = '1';
      visible = true;
    }
  });

  document.addEventListener('mouseleave', () => {
    dot.style.opacity = '0';
    ring.style.opacity = '0';
    visible = false;
  });

  const interactives = 'a, button, input, textarea, select, label, .faq-question, .radio-option, .info-item';

  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(interactives)) ring.classList.add('hover');
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(interactives)) ring.classList.remove('hover');
  });

  function lerp(a, b, t) { return a + (b - a) * t; }

  function animate() {
    rx = lerp(rx, mx, 0.14);
    ry = lerp(ry, my, 0.14);
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
    requestAnimationFrame(animate);
  }

  animate();
})();
