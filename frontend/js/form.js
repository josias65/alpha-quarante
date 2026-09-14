/**
 * Alpha Quarante — Formulaire 2 étapes (infos → récap)
 */
(function () {
  const API_URL = '/api/register';
  let currentStep = 1;

  const progSteps = document.querySelectorAll('.progress-step');
  const line1 = document.getElementById('line1');

  const fields = {
    prenom: document.getElementById('prenom'),
    nom: document.getElementById('nom'),
    email: document.getElementById('email'),
    sujetPriere: document.getElementById('sujetPriere'),
  };

  const validators = {
    prenom: (v) => v.trim().length >= 2,
    nom: (v) => v.trim().length >= 2,
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
    sujetPriere: (v) => v.trim().length <= 500,
  };

  function showError(id, show) {
    const el = document.getElementById(`${id}-error`);
    if (el) el.classList.toggle('visible', show);
  }

  function setFieldState(input, valid) {
    if (!input) return;
    input.classList.remove('valid', 'invalid');
    input.classList.add(valid ? 'valid' : 'invalid');
  }

  function setupRealTime() {
    ['prenom', 'nom', 'email', 'sujetPriere'].forEach((id) => {
      const el = fields[id];
      if (!el) return;
      const validate = () => {
        if (id === 'sujetPriere' && el.value.trim() === '') {
          el.classList.remove('valid', 'invalid');
          showError(id, false);
          return;
        }
        const ok = validators[id](el.value);
        setFieldState(el, ok);
        showError(id, !ok);
      };
      el.addEventListener('input', validate);
      el.addEventListener('blur', validate);
    });
  }

  function validateStep1() {
    let valid = true;
    ['prenom', 'nom', 'email'].forEach((id) => {
      const ok = validators[id](fields[id].value);
      setFieldState(fields[id], ok);
      showError(id, !ok);
      if (!ok) valid = false;
    });
    if (fields.sujetPriere && fields.sujetPriere.value.trim() !== '') {
      const ok = validators.sujetPriere(fields.sujetPriere.value);
      setFieldState(fields.sujetPriere, ok);
      showError('sujetPriere', !ok);
      if (!ok) valid = false;
    }
    return valid;
  }

  function goToStep(next, dir = 'forward') {
    const cur = document.getElementById(`step${currentStep}`);
    const nxt = document.getElementById(`step${next}`);
    if (!cur || !nxt) return;

    cur.style.animation = dir === 'forward' ? 'slideOutLeft 0.3s ease forwards' : 'none';
    setTimeout(() => {
      cur.classList.remove('active');
      cur.style.animation = '';
      nxt.classList.add('active');
      nxt.style.animation = dir === 'forward' ? 'slideInRight 0.4s ease forwards' : 'slideInLeft 0.4s ease forwards';
      setTimeout(() => { nxt.style.animation = ''; }, 400);
      currentStep = next;
      updateProgress();
      if (next === 2) populateSummary();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, dir === 'forward' ? 250 : 0);
  }

  function updateProgress() {
    progSteps.forEach((s, i) => {
      s.classList.remove('active', 'done');
      if (i + 1 === currentStep) s.classList.add('active');
      if (i + 1 < currentStep) s.classList.add('done');
    });
    if (line1) line1.style.width = currentStep >= 2 ? '100%' : '0%';
  }

  function setText(id, val) {
    const el = document.getElementById(id);
    if (!el) return;
    if (!val || !val.trim()) {
      el.textContent = 'Non renseigné';
      el.classList.add('empty');
    } else {
      el.textContent = val;
      el.classList.remove('empty');
    }
  }

  function populateSummary() {
    setText('sum-name', `${fields.prenom.value.trim()} ${fields.nom.value.trim()}`);
    setText('sum-email', fields.email.value.trim());
    setText('sum-priere', fields.sujetPriere ? fields.sujetPriere.value.trim() : '');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('submitBtn');
    const globalErr = document.getElementById('form-global-error');
    if (globalErr) globalErr.style.display = 'none';

    btn.classList.add('btn-loading');
    btn.disabled = true;
    btn.querySelector('span').textContent = 'Envoi en cours…';

    const payload = {
      prenom: fields.prenom.value.trim(),
      nom: fields.nom.value.trim(),
      email: fields.email.value.trim(),
      sujetPriere: fields.sujetPriere ? fields.sujetPriere.value.trim() : '',
    };

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        sessionStorage.setItem('aq_prenom', payload.prenom);
        sessionStorage.setItem('aq_email', payload.email);
        sessionStorage.setItem('aq_email_sent', data.emailSent ? '1' : '0');
        sessionStorage.setItem('aq_invite', data.inviteLink || 'https://alpha40.com/');
        window.location.href = 'confirmation.html';
      } else if (res.status === 409) {
        if (globalErr) {
          globalErr.innerHTML = 'Cette adresse email est déjà inscrite. Vérifie ta boîte mail.';
          globalErr.style.display = 'block';
        }
        btn.classList.remove('btn-loading');
        btn.disabled = false;
        btn.querySelector('span').textContent = 'Confirmer';
      } else {
        throw new Error(data.message || 'Erreur serveur');
      }
    } catch (err) {
      console.error('Inscription error:', err);
      if (globalErr) {
        globalErr.innerHTML = 'Une erreur est survenue. Réessaie dans un instant.';
        globalErr.style.display = 'block';
      }
      btn.classList.remove('btn-loading');
      btn.disabled = false;
      btn.querySelector('span').textContent = 'Confirmer';
    }
  }

  function init() {
    setupRealTime();
    const n1 = document.getElementById('nextStep1');
    if (n1) n1.addEventListener('click', () => { if (validateStep1()) goToStep(2); });
    const b2 = document.getElementById('backStep2');
    if (b2) b2.addEventListener('click', () => goToStep(1, 'backward'));
    const form = document.getElementById('registrationForm');
    if (form) form.addEventListener('submit', handleSubmit);
    updateProgress();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
