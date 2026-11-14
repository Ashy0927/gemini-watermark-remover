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
      <label class="companion-option"><span>Come near & guide me<small>Move near taps and suggest what to try</small></span><input type="checkbox" id="companion-guide" checked></label>
      <p class="companion-tip">Tap Orbit to open or close these controls.</p>
    </section>
    <div class="companion-bubble" hidden><p role="status" aria-live="polite"></p><button type="button" aria-label="Dismiss suggestion">×</button></div>
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
  const guide = root.querySelector('#companion-guide');
  const bubble = root.querySelector('.companion-bubble');
  const bubbleText = bubble.querySelector('p');
  // Suggestions are tied to actual controls; no page text or user files leave the browser.
  const hints = [
    ['#img-dropzone', 'Choose an image to start. You can also drop it here.'],
    ['#video-dropzone', 'Choose a video, then detect its watermark before exporting.'],
    ['[id$="auto-detect"]', 'Try automatic detection first, then inspect the cleaned preview.'],
    ['[id$="staging-card"]', 'Your file is loaded. Use Auto Detect to locate the watermark.'],
    ['[id*="reset-sliders"]', 'Reset restores the tuning values so you can try again.'],
    ['[id*="change-file"]', 'Choose another file to start a fresh edit.'],
    ['[id^="slider-"][id$="gain"]', 'Adjust strength a little at a time and check the cleaned preview.'],
    ['[id^="slider-"][id$="scale"]', 'Match the removal size to the watermark using the zoomed preview.'],
    ['[id^="slider-"][id*="offset"]', 'Move the removal area until it lines up with the watermark.'],
    ['.btn-preset', 'Choose the preset that matches the watermark in your file.'],
    ['[id$="export"]', 'Check the cleaned preview, then export your result.'],
    ['#img-results, #video-results', 'Your result is here. Use the download button to save it.'],
    ['#video-status', 'Keep this page open while your video processes.'],
    ['.canvas-wrapper', 'Compare the original and cleaned details before exporting.'],
    ['.activity-sample-btn, #btn-load-sample-from-showcase', 'Try a sample to explore the controls before uploading your own file.'],
    ['.bottom-menu-item', 'Use these tabs to switch between tools, samples, and information.'],
    ['#screen-tuner', 'Upload a file from Home to begin tuning the watermark removal.'],
    ['#screen-video', 'Open the video tool to upload and clean a video.'],
    ['#screen-samples', 'Try a sample to see how watermark removal works.']
  ];
  let lastPoint = null;
  let scrollTimer;
  let bubbleTimer;
  let lastHint = '';
  let lastHintTime = 0;
  const hideHint = () => { bubble.hidden = true; clearTimeout(bubbleTimer); };
  bubble.querySelector('button').addEventListener('click', hideHint);
  const dock = () => {
    root.classList.remove('companion-roaming');
    root.style.removeProperty('left');
    root.style.removeProperty('top');
    hideHint();
  };
  const assist = (target, x, y) => {
    if (!guide.checked || !panel.hidden || !(target instanceof Element) || root.contains(target)) return;
    const hint = hints.find(([selector]) => target.closest(selector));
    if (!hint) return;
    const width = root.offsetWidth;
    const height = root.offsetHeight;
    const maxX = Math.max(12, window.innerWidth - width - 12);
    const maxY = Math.max(12, window.innerHeight - height - 96);
    // Keep away from the touched control and leave room for bottom navigation.
    const control = target.closest('button, input, a, .dropzone') || target;
    const bounds = control.getBoundingClientRect();
    let left = x + 48;
    if (left + width > window.innerWidth - 12) left = x - width - 48;
    left = Math.min(maxX, Math.max(12, left));
    let top = Math.min(maxY, Math.max(12, y - height / 2));
    if (left < bounds.right + 12 && left + width > bounds.left - 12 && top < bounds.bottom + 12 && top + height > bounds.top - 12) {
      top = bounds.top - height - 20 >= 12 ? bounds.top - height - 20 : bounds.bottom + 20;
      top = Math.min(maxY, Math.max(12, top));
    }
    // Reduced-motion users get suggestions from the stationary dock.
    if (!reducedMotion.matches) {
      root.classList.add('companion-roaming');
      root.style.left = `${left}px`;
      root.style.top = `${top}px`;
    }
    const now = Date.now();
    if (hint[1] === lastHint && now - lastHintTime < 12000) return;
    lastHint = hint[1];
    lastHintTime = now;
    bubbleText.textContent = hint[1];
    bubble.hidden = false;
    const position = reducedMotion.matches ? root.getBoundingClientRect() : { left, top, bottom: top + height };
    const bubbleWidth = Math.min(240, window.innerWidth - 24);
    bubble.style.width = `${bubbleWidth}px`;
    bubble.style.left = `${Math.max(12, Math.min(window.innerWidth - bubbleWidth - 12, position.left + width / 2 - bubbleWidth / 2))}px`;
    bubble.style.top = `${position.top >= 115 ? position.top - 105 : Math.min(window.innerHeight - 110, position.bottom + 10)}px`;
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(hideHint, 6500);
  };
  document.addEventListener('pointerdown', event => {
    if (root.contains(event.target)) return;
    lastPoint = { x: event.clientX, y: event.clientY };
    // Let controls and tab switches finish before inspecting their context.
    setTimeout(() => assist(event.target, event.clientX, event.clientY), 120);
  }, { passive: true });
  document.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch' && !root.contains(event.target)) lastPoint = { x: event.clientX, y: event.clientY };
  }, { passive: true });
  document.addEventListener('focusin', event => {
    if (!event.target.matches(':focus-visible') || root.contains(event.target)) return;
    const rect = event.target.getBoundingClientRect();
    assist(event.target, rect.left + rect.width / 2, rect.top + rect.height / 2);
  });
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    hideHint();
    scrollTimer = setTimeout(() => {
      const x = Math.max(12, Math.min(window.innerWidth - 12, lastPoint?.x ?? window.innerWidth / 2));
      const y = Math.max(12, Math.min(window.innerHeight - 110, lastPoint?.y ?? window.innerHeight / 2));
      const target = document.elementsFromPoint(x, y).find(element => !root.contains(element));
      assist(target, x, y);
    }, 280);
  }, { passive: true });
  guide.addEventListener('change', () => { if (!guide.checked) dock(); });
  window.addEventListener('resize', dock);
  reducedMotion.addEventListener('change', dock);
  const setMood = (id) => {
    orb.dataset.mood = id;
    eyes.forEach(eye => { eye.textContent = id === 'love' ? '♥' : id === 'excited' ? '✦' : ''; });
    root.querySelectorAll('[data-mood]').forEach(button => {
      if (button !== orb) button.setAttribute('aria-pressed', String(button.dataset.mood === id));
    });
  };
  const togglePanel = (open) => {
    if (open) { hideHint(); dock(); }
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
