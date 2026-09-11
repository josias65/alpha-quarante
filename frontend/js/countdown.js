/**
 * Alpha Quarante — Countdown Timer
 * Date cible : 1er octobre 2026
 */

(function () {
  const EVENT_DATE = new Date('2026-10-01T09:00:00').getTime();

  // ── Elements ─────────────────────────────────────────
  const els = {
    daysFront:    document.getElementById('days-front'),
    daysBack:     document.getElementById('days-back'),
    flipDays:     document.getElementById('flip-days'),
    hoursFront:   document.getElementById('hours-front'),
    hoursBack:    document.getElementById('hours-back'),
    flipHours:    document.getElementById('flip-hours'),
    minutesFront: document.getElementById('minutes-front'),
    minutesBack:  document.getElementById('minutes-back'),
    flipMinutes:  document.getElementById('flip-minutes'),
    secondsFront: document.getElementById('seconds-front'),
    secondsBack:  document.getElementById('seconds-back'),
    flipSeconds:  document.getElementById('flip-seconds'),
  };

  if (!els.daysFront) return; // Not on countdown page

  // ── State ─────────────────────────────────────────────
  let prevValues = { days: -1, hours: -1, minutes: -1, seconds: -1 };

  // ── Helpers ──────────────────────────────────────────
  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function animateFlip(flipCard, frontEl, backEl, newValue) {
    const padded = pad(newValue);

    // Update back face with new value (hidden until flip)
    backEl.textContent = padded;

    // Trigger animation
    flipCard.classList.remove('flipping');
    void flipCard.offsetWidth; // reflow to restart animation
    flipCard.classList.add('flipping');

    // After animation: update front, remove class
    setTimeout(() => {
      frontEl.textContent = padded;
      flipCard.classList.remove('flipping');
    }, 650);
  }

  function updateUnit(flipCard, frontEl, backEl, newVal, prevKey) {
    if (newVal !== prevValues[prevKey]) {
      if (prevValues[prevKey] !== -1) {
        animateFlip(flipCard, frontEl, backEl, newVal);
      } else {
        // Initial set — no animation
        frontEl.textContent = pad(newVal);
        backEl.textContent  = pad(newVal);
      }
      prevValues[prevKey] = newVal;
    }
  }

  // ── Main Tick ─────────────────────────────────────────
  function tick() {
    const now  = Date.now();
    const diff = EVENT_DATE - now;

    if (diff <= 0) {
      // Event started — show zeros and stop
      ['days', 'hours', 'minutes', 'seconds'].forEach(unit => {
        const front = document.getElementById(`${unit}-front`);
        const back  = document.getElementById(`${unit}-back`);
        if (front) front.textContent = '00';
        if (back)  back.textContent  = '00';
      });

      // Optionally display "L'événement a commencé !"
      const wrapper = document.querySelector('.countdown-wrapper');
      if (wrapper) {
        const label = wrapper.querySelector('.countdown-label');
        if (label) {
          label.textContent = '🎉 L\'événement a commencé !';
          label.style.color = 'var(--orange)';
          label.style.fontSize = '1rem';
        }
      }
      return;
    }

    const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    updateUnit(els.flipDays,    els.daysFront,    els.daysBack,    days,    'days');
    updateUnit(els.flipHours,   els.hoursFront,   els.hoursBack,   hours,   'hours');
    updateUnit(els.flipMinutes, els.minutesFront, els.minutesBack, minutes, 'minutes');
    updateUnit(els.flipSeconds, els.secondsFront, els.secondsBack, seconds, 'seconds');
  }

  // ── Start ─────────────────────────────────────────────
  tick();
  setInterval(tick, 1000);
})();
