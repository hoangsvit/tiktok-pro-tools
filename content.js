// TikTok Pro Tools - Content Script v12
  (function () {
    'use strict';
    if (window.__tptLoaded) return;
    window.__tptLoaded = true;
  
    let cfg = {
      backgroundPlay: true,
      speed: 1, 
      eq: 'normal',
      eqBass: 0,
      eqMid: 0,
      eqTreble: 0,
      cleanMode: false
    };

  // ─── CAPTURE ORIGINALS ───────────────────────────────────────────────────────
  const _origPause = HTMLVideoElement.prototype.pause;
  const _origPlay  = HTMLVideoElement.prototype.play;

  // Snapshot the real getter BEFORE we override it
  const _realHiddenGetter = (() => {
    const d = Object.getOwnPropertyDescriptor(Document.prototype, 'hidden');
    return d && d.get ? d.get : null;
  })();
  const _realVisGetter = (() => {
    const d = Object.getOwnPropertyDescriptor(Document.prototype, 'visibilityState');
    return d && d.get ? d.get : null;
  })();

  function _isReallyHidden() {
    return _realHiddenGetter ? _realHiddenGetter.call(document) : false;
  }

  // ─── BACKGROUND PLAY ─────────────────────────────────────────────────────────
  // Approach: spoof document.hidden + intercept HTMLVideoElement.prototype.pause
  // at the prototype level so ALL pause calls while hidden are blocked.
  // We do NOT use visibilitychange event blocking — that breaks other things.

  let _bgEnabled = false;

  function enableBgPlay() {
    if (_bgEnabled) return;
    _bgEnabled = true;

    // Spoof document.hidden so TikTok's visibility checks always see "visible"
    try {
      Object.defineProperty(document, 'hidden', {
        get() { return cfg.backgroundPlay ? false : (_realHiddenGetter ? _realHiddenGetter.call(document) : false); },
        configurable: true
      });
    } catch (_) {}
    try {
      Object.defineProperty(document, 'visibilityState', {
        get() { return cfg.backgroundPlay ? 'visible' : (_realVisGetter ? _realVisGetter.call(document) : 'visible'); },
        configurable: true
      });
    } catch (_) {}

    // Block pause() at prototype level — only when tab is ACTUALLY hidden
    // and backgroundPlay is on. When tab is visible, always allow (user can pause).
    HTMLVideoElement.prototype.pause = function tptPause() {
      if (cfg.backgroundPlay && (_isReallyHidden() || !document.hasFocus())) return; // block silently
      return _origPause.call(this);
    };

    window.addEventListener('pause', _pauseBlocker, true);
  }

  function _pauseBlocker(event) {
    if (cfg.backgroundPlay && event.target instanceof HTMLVideoElement && (_isReallyHidden() || !document.hasFocus())) {
      event.stopImmediatePropagation();
      event.preventDefault();
      event.target.play().catch(() => {});
    }
  }

  function disableBgPlay() {
    cfg.backgroundPlay = false;
    HTMLVideoElement.prototype.pause = _origPause;
    window.removeEventListener('pause', _pauseBlocker, true);
    _bgEnabled = false;
  }

  // ─── AUTO PAUSE ON OTHER AUDIO ────────────────────────────────────────────────

  // ─── SCREENSHOT ──────────────────────────────────────────────────────────────
  function captureFrame() {
    const v = _best(); if (!v || v.videoWidth === 0) return;
    const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0);
    c.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'tiktok-' + Date.now() + '.png';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }, 'image/png');
  }

  // ─── AUDIO EQUALIZER ─────────────────────────────────────────────────────────
  const audioContextMap = new WeakMap();

  function applyEqToVideo(videoElement) {
    if (!videoElement.hasAttribute('crossorigin')) {
        try { videoElement.crossOrigin = "anonymous"; } catch(e){}
    }

    if (!audioContextMap.has(videoElement)) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const ctx = new AudioContext();
        const source = ctx.createMediaElementSource(videoElement);
        
        const bassNode = ctx.createBiquadFilter();
        bassNode.type = "lowshelf";
        bassNode.frequency.value = 250;
        
        const trebleNode = ctx.createBiquadFilter();
        trebleNode.type = "highshelf";
        trebleNode.frequency.value = 6000;
        
        const midNode = ctx.createBiquadFilter();
        midNode.type = "peaking";
        midNode.frequency.value = 1000;
        midNode.Q.value = 1;

        source.connect(bassNode);
        bassNode.connect(midNode);
        midNode.connect(trebleNode);
        trebleNode.connect(ctx.destination);

        audioContextMap.set(videoElement, { ctx, bassNode, midNode, trebleNode });
      } catch (e) {
        console.warn("TPT: Failed to init AudioContext", e);
      }
    }

    const audioNodes = audioContextMap.get(videoElement);
    if (!audioNodes) return;
    
    if (audioNodes.ctx.state === 'suspended') {
        audioNodes.ctx.resume().catch(() => {});
    }

    audioNodes.bassNode.gain.value = 0;
    audioNodes.midNode.gain.value = 0;
    audioNodes.trebleNode.gain.value = 0;

    switch (cfg.eq) {
      case 'bass':
        audioNodes.bassNode.gain.value = 12;
        audioNodes.trebleNode.gain.value = -3;
        break;
      case 'treble':
        audioNodes.trebleNode.gain.value = 12;
        audioNodes.bassNode.gain.value = -3;
        break;
      case 'vocal':
        audioNodes.midNode.gain.value = 8;
        audioNodes.bassNode.gain.value = -5;
        audioNodes.trebleNode.gain.value = 2;
        break;
      case 'advanced':
        audioNodes.bassNode.gain.value = cfg.eqBass || 0;
        audioNodes.midNode.gain.value = cfg.eqMid || 0;
        audioNodes.trebleNode.gain.value = cfg.eqTreble || 0;
        break;
      case 'normal':
      default:
        break;
    }
  }

  // ─── CLEAN MODE ──────────────────────────────────────────────────────────────
  let tptStyleElement = null;

  function updateInjectedStyles() {
    if (!tptStyleElement) {
      tptStyleElement = document.createElement('style');
      tptStyleElement.id = 'tpt-injected-styles';
      document.head.appendChild(tptStyleElement);
    }
    
    let css = '';
    if (cfg.cleanMode) {
      css += `
        [data-e2e="video-desc"],
        [data-e2e="video-author-avatar"],
        [data-e2e="browser-nickname"],
        [data-e2e="video-music"],
        [class*="DivVideoInfoContainer"],
        [class*="DivMediaCardOverlayBottom"],
        [class*="DivActionItemContainer"],
        .tiktok-1vyw0v6-DivVideoInfoContainer,
        .tiktok-14bqk18-DivVideoContainer {
            opacity: 0 !important;
            pointer-events: none !important;
            transition: opacity 0.3s ease;
        }
      `;
    }
    
    tptStyleElement.textContent = css;
  }

  // ─── VIDEO UTILS ─────────────────────────────────────────────────────────────
  function _best() {
    const all = [...document.querySelectorAll('video')];
    return all.find(v => !v.paused && v.readyState >= 2) || all.find(v => v.readyState >= 2) || all[0] || null;
  }
  function _applyAll() {
    document.querySelectorAll('video').forEach(v => {
      if (Math.abs(v.playbackRate - cfg.speed) > 0.05) v.playbackRate = cfg.speed;
      applyEqToVideo(v);
    });
    updateInjectedStyles();
  }
  function _setSpeed(val) { cfg.speed  = +val; _applyAll(); chrome.storage.sync.set({ speed: cfg.speed }); }

  new MutationObserver(_applyAll).observe(document.body, { childList: true, subtree: true });
  let _lastHref = location.href;
  setInterval(() => { if (location.href !== _lastHref) { _lastHref = location.href; setTimeout(_applyAll, 900); } }, 500);

  // ─── MESSAGES ────────────────────────────────────────────────────────────────
  chrome.runtime.onMessage.addListener(msg => {
    if (msg.type === 'PING') return;
    if (msg.type === 'CAPTURE_FRAME') { captureFrame(); return; }
    if (msg.type === 'UPDATE_SETTINGS') {
      const s = msg.settings;
      if (s.backgroundPlay !== undefined) { cfg.backgroundPlay = s.backgroundPlay; s.backgroundPlay ? enableBgPlay() : disableBgPlay(); }
      if (s.speed !== undefined) _setSpeed(s.speed);
      if (s.eq !== undefined) { cfg.eq = s.eq; _applyAll(); }
      if (s.eqBass !== undefined) { cfg.eqBass = s.eqBass; _applyAll(); }
      if (s.eqMid !== undefined) { cfg.eqMid = s.eqMid; _applyAll(); }
      if (s.eqTreble !== undefined) { cfg.eqTreble = s.eqTreble; _applyAll(); }
      if (s.cleanMode !== undefined) { cfg.cleanMode = s.cleanMode; _applyAll(); }
    }
  });

  // ─── INIT ────────────────────────────────────────────────────────────────────
  chrome.storage.sync.get(null, data => {
    cfg = Object.assign(cfg, data);
    if (cfg.backgroundPlay) enableBgPlay();
    _applyAll();
  });
})();
