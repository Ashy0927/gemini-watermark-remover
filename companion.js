(() => {
  'use strict';
  const moods = [
    ['neutral', 'Neutral', '● ●'], ['attentive', 'Attentive', '▮ ▮'],
    ['happy', 'Happy', '⌒ ⌒'], ['excited', 'Excited', '✦ ✦'],
    ['confused', 'Confused', '● ◦'], ['surprised', 'Surprised', '○ ○'],
    ['sad', 'Sad', '╲ ╱'], ['angry', 'Angry', '╱ ╲'],
    ['sleepy', 'Sleepy', '– –'], ['wink', 'Wink', '– ●'],
    ['love', 'Love', '♥ ♥'], ['tired', 'Tired', '▰ ▰']
  ];
  const root = document.createElement('aside');
  root.className = 'companion';
  root.setAttribute('aria-label', 'Interactive robot companion');
  root.innerHTML = `
    <section class="companion-panel" id="companion-panel" aria-label="Bot settings" hidden>
      <div class="companion-heading"><div><span class="companion-kicker">YOUR LITTLE COMPANION</span><h2>Meet Orbit<span>✦</span></h2></div><button class="companion-close" type="button" aria-label="Close bot settings">×</button></div>
      <div class="companion-panel-caption">A little personality for your workspace.</div>
      <div class="companion-grid" aria-label="Choose an expression">${moods.map(([id, label, face]) => `<button type="button" data-mood="${id}" aria-pressed="${id === 'attentive'}"><span aria-hidden="true">${face}</span>${label}</button>`).join('')}</div>
      <label class="companion-option"><span>Automatic expressions<small>A new mood every few seconds</small></span><input type="checkbox" id="companion-auto" checked></label>
      <label class="companion-option"><span>Follow mouse & touch<small>My eyes follow your movement</small></span><input type="checkbox" id="companion-follow" checked></label>
      <p class="companion-tip">Tap Orbit to open or close these controls.</p>
    </section>
    <button class="companion-orb" type="button" aria-label="Open Orbit bot settings" aria-expanded="false" aria-controls="companion-panel" data-mood="attentive">
      <span class="companion-shell"><span class="companion-face"><span class="companion-eyes" aria-hidden="true"><i></i><i></i></span></span></span>
    </button><span class="companion-name">Orbit <span>•</span></span>`;
  document.body.append(root);
  const orb = root.querySelector('.companion-orb');
  const panel = root.querySelector('.companion-panel');
  const auto = root.querySelector('#companion-auto');
  const follow = root.querySelector('#companion-follow');
  const eyes = root.querySelectorAll('.companion-eyes i');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const setMood = (id) => {
    orb.dataset.mood = id;
    eyes.forEach(eye => { eye.textContent = id === 'love' ? '♥' : id === 'excited' ? '✦' : ''; });
    root.querySelectorAll('[data-mood]').forEach(button => {
      if (button !== orb) button.setAttribute('aria-pressed', String(button.dataset.mood === id));
    });
  };
  const togglePanel = (open) => {
    panel.hidden = !open;
    orb.setAttribute('aria-expanded', String(open));
    orb.setAttribute('aria-label', `${open ? 'Close' : 'Open'} Orbit bot settings`);
  };
  orb.addEventListener('click', () => togglePanel(panel.hidden));
  root.querySelector('.companion-close').addEventListener('click', () => { togglePanel(false); orb.focus(); });
  root.querySelector('.companion-grid').addEventListener('click', event => {
    const button = event.target.closest('[data-mood]');
    if (!button) return;
    auto.checked = false;
    setMood(button.dataset.mood);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) { togglePanel(false); orb.focus(); }
  });
  document.addEventListener('pointerdown', event => {
    if (!root.contains(event.target)) togglePanel(false);
  });
  let frame = 0;
  let point = null;
  const resetEyes = () => {
    point = null;
    orb.style.setProperty('--look-x', '0px');
    orb.style.setProperty('--look-y', '0px');
  };
  document.addEventListener('pointermove', event => {
    if (!follow.checked || reducedMotion.matches) return;
    point = { x: event.clientX, y: event.clientY };
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (!point || !follow.checked || reducedMotion.matches) return;
      const rect = orb.getBoundingClientRect();
      const dx = point.x - rect.left - rect.width / 2;
      const dy = point.y - rect.top - rect.height / 2;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const amount = Math.min(8, distance / 25);
      orb.style.setProperty('--look-x', `${dx / distance * amount}px`);
      orb.style.setProperty('--look-y', `${dy / distance * amount}px`);
    });
  }, { passive: true });
  // Pointer events cover both mouse and touch without blocking page scrolling.
  document.addEventListener('pointerdown', event => {
    if (event.pointerType === 'touch') document.dispatchEvent(new PointerEvent('pointermove', { clientX: event.clientX, clientY: event.clientY }));
  }, { passive: true });
  document.addEventListener('pointerup', event => { if (event.pointerType !== 'mouse') resetEyes(); }, { passive: true });
  document.addEventListener('pointercancel', resetEyes, { passive: true });
  document.documentElement.addEventListener('pointerleave', resetEyes);
  window.addEventListener('blur', resetEyes);
  follow.addEventListener('change', resetEyes);
  reducedMotion.addEventListener('change', resetEyes);
  setInterval(() => {
    if (auto.checked && !document.hidden && !reducedMotion.matches) {
      const alternatives = moods.filter(([id]) => id !== orb.dataset.mood);
      setMood(alternatives[Math.floor(Math.random() * alternatives.length)][0]);
    }
  }, 4500);
})();
