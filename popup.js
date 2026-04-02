document.addEventListener('DOMContentLoaded', () => {
  const el = id => document.getElementById(id);
  const set = (id, v) => { const e = el(id); if (e) e.textContent = v; };

  // Keyword Tags Logic
  let cachedKws = [];
  let isKwExpanded = false;
  const kwInput = el('i-keywords');
  const kwContainer = el('kw-tags-container');
  const kwMoreBtn = el('kw-tags-more');

  function renderTags() {
    if (!kwContainer) return;
    kwContainer.innerHTML = '';
    kwMoreBtn.style.display = 'none';

    let displayKws = cachedKws;
    if (cachedKws.length > 5 && !isKwExpanded) {
      displayKws = cachedKws.slice(0, 5);
      kwMoreBtn.style.display = 'block';
      kwMoreBtn.innerText = `Nhiều hơn (+${cachedKws.length - 5})`;
    } else if (cachedKws.length > 5 && isKwExpanded) {
      kwMoreBtn.style.display = 'block';
      kwMoreBtn.innerText = 'Rút gọn lại';
    }

    displayKws.forEach((kw) => {
      const tag = document.createElement('div');
      tag.style.cssText = 'background: rgba(254, 44, 85, 0.1); color: #fe2c55; padding: 2px 8px; border-radius: 12px; font-size: 10px; display: flex; align-items: center; gap: 4px;';
      tag.innerHTML = `<span>${kw}</span><span style="cursor:pointer; font-weight:bold; font-size:12px;">&times;</span>`;
      tag.querySelector('span:last-child').onclick = () => {
        cachedKws.splice(cachedKws.indexOf(kw), 1);
        saveKws();
      };
      kwContainer.appendChild(tag);
    });
  }

  function saveKws() {
    const val = cachedKws.join(',');
    chrome.storage.sync.set({ blockKeywords: val }, () => {
      renderTags();
      chrome.tabs.query({active:true,currentWindow:true}, t => {
        if(t[0] && t[0].id) chrome.tabs.sendMessage(t[0].id, {type:'UPDATE_SETTINGS',settings:{ blockKeywords: val }});
      });
    });
  }

  if (kwMoreBtn) {
    kwMoreBtn.onclick = () => {
      isKwExpanded = !isKwExpanded;
      renderTags();
    };
  }

  if (kwInput) {
    kwInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = e.target.value.trim().toLowerCase();
        if (val && !cachedKws.includes(val)) {
          cachedKws.push(val);
          saveKws();
        }
        e.target.value = '';
      }
    });
  }

  function toast(msg) { const t=el('toast'); if(!t)return; t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2200); }
  function send(msg, cb) { 
    chrome.tabs.query({active:true,currentWindow:true},tabs=>{ 
      if(tabs[0]?.url?.includes('tiktok.com')) {
        chrome.tabs.sendMessage(tabs[0].id,msg).then(cb).catch(err => {
          if (err.message.includes('context invalidated') || err.message.includes('Receiving end does not exist')) {
            const w = el('reload-warning'); if (w) w.style.display = 'block';
          }
        }); 
      }
    }); 
  }

  // Theme logic
  const isDarkOS = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  let currentTheme = localStorage.getItem('tpt_theme') || (isDarkOS ? 'dark' : 'light');
  if (currentTheme === 'dark') document.documentElement.classList.add('dark-theme');
  else document.documentElement.classList.add('light-theme');
  
  const thToggle = el('theme-toggle');
  if (thToggle) {
    thToggle.addEventListener('click', () => {
      if (document.documentElement.classList.contains('dark-theme')) {
        document.documentElement.classList.remove('dark-theme');
        document.documentElement.classList.add('light-theme');
        localStorage.setItem('tpt_theme', 'light');
      } else {
        document.documentElement.classList.remove('light-theme');
        document.documentElement.classList.add('dark-theme');
        localStorage.setItem('tpt_theme', 'dark');
      }
    });
  }

  function updateSpeedBtns(val) {
    document.querySelectorAll('.ps-btn').forEach(b => {
      if (+b.dataset.v === +val) b.classList.add('on');
      else b.classList.remove('on');
    });
  }

  chrome.storage.sync.get(null, data => {
    const s = { backgroundPlay:true, autoScroll:false, speed:1, eq:'normal', eqBass:0, eqMid:0, eqTreble:0, cleanMode:false, unlockShop:false, blockKeywords:'', ...data };
    
    const cbg = el('c-bg'); if (cbg) cbg.checked = !!s.backgroundPlay;
    const casc = el('c-autosc'); if (casc) casc.checked = !!s.autoScroll;
    const ccl = el('c-clean'); if (ccl) ccl.checked = !!s.cleanMode;
    const cshop = el('c-shop'); if (cshop) cshop.checked = !!s.unlockShop;
    const ikw = el('i-keywords'); if (ikw) ikw.value = '';
    if (s.blockKeywords) { cachedKws = s.blockKeywords.split(',').filter(k=>k); renderTags(); }
    const seq = el('s-eq'); if (seq) seq.value = s.eq;

    const ss = el('s-speed'); 
    if (ss) { ss.value = s.speed; ss.style.setProperty('--fill', ((s.speed / 4) * 100) + '%'); }

    const advPanel = el('adv-eq-panel');
    if (advPanel) advPanel.style.display = s.eq === 'advanced' ? 'flex' : 'none';

    const sbass = el('s-bass'); if (sbass) { sbass.value = s.eqBass; set('d-bass', s.eqBass); sbass.style.setProperty('--fill', (((s.eqBass + 10) / 20) * 100) + '%'); }
    const smid = el('s-mid'); if (smid) { smid.value = s.eqMid; set('d-mid', s.eqMid); smid.style.setProperty('--fill', (((s.eqMid + 10) / 20) * 100) + '%'); }
    const streble = el('s-treble'); if (streble) { streble.value = s.eqTreble; set('d-treble', s.eqTreble); streble.style.setProperty('--fill', (((s.eqTreble + 10) / 20) * 100) + '%'); }
    
    set('d-speed', s.speed + 'x');
    updateSpeedBtns(s.speed);
    
    // Ping to check if content script is alive
    send({type:'PING'}, undefined);

    chrome.tabs.query({active:true,currentWindow:true}, tabs => {
      const ok = tabs[0]?.url?.includes('tiktok.com');
      const st = el('status'); if (st) st.className = 'status' + (ok ? ' on' : '');
      set('stext', ok ? 'TikTok is open' : 'TikTok not open');
    });
  });

  const apply = () => {
    const cbg = el('c-bg');
    const casc = el('c-autosc');
    const ccl = el('c-clean');
    const cshop = el('c-shop');
    const seq = el('s-eq');
    const ss = el('s-speed');
    const advPanel = el('adv-eq-panel');
    const sbass = el('s-bass'), smid = el('s-mid'), streble = el('s-treble');
    
    if (!cbg||!ss) return;

    if (seq && advPanel) {
      advPanel.style.display = seq.value === 'advanced' ? 'flex' : 'none';
    }

    const settings = { 
      backgroundPlay: cbg.checked, 
      autoScroll: casc ? casc.checked : false,
      speed: +ss.value, 
      eq: seq ? seq.value : 'normal',
      eqBass: sbass ? +sbass.value : 0,
      eqMid: smid ? +smid.value : 0,
      eqTreble: streble ? +streble.value : 0,
      cleanMode: ccl ? ccl.checked : false,
      unlockShop: cshop ? cshop.checked : false,
      blockKeywords: cachedKws.join(',')
    };
    chrome.storage.sync.set(settings, () => {
      if (chrome.runtime.lastError) return;
      send({type:'UPDATE_SETTINGS',settings}, undefined);
    });
  };

  const ss = el('s-speed'); 
  if (ss) {
    ss.addEventListener('input', e => {
      const v = +e.target.value;
      set('d-speed', v + 'x');
      updateSpeedBtns(v);
      ss.style.setProperty('--fill', ((v / 4) * 100) + '%');
      apply();
    });
  }
  
  document.querySelectorAll('.ps-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      const v = +e.target.dataset.v;
      if (ss) {
        ss.value = v;
        ss.style.setProperty('--fill', ((v / 4) * 100) + '%');
      }
      set('d-speed', v + 'x');
      updateSpeedBtns(v);
      apply();
    });
  });

  const cbg = el('c-bg'); if (cbg) cbg.addEventListener('change', apply);
  const casc = el('c-autosc'); if (casc) casc.addEventListener('change', apply);
  const ccl = el('c-clean'); if (ccl) ccl.addEventListener('change', apply);
  const cshop = el('c-shop'); if (cshop) cshop.addEventListener('change', apply);
  
  const seq = el('s-eq'); if (seq) seq.addEventListener('change', apply);

  const sbass = el('s-bass'); if (sbass) sbass.addEventListener('input', e => { 
    set('d-bass', e.target.value); 
    sbass.style.setProperty('--fill', (((+e.target.value + 10) / 20) * 100) + '%'); 
    apply(); 
  });
  const smid = el('s-mid'); if (smid) smid.addEventListener('input', e => { 
    set('d-mid', e.target.value); 
    smid.style.setProperty('--fill', (((+e.target.value + 10) / 20) * 100) + '%'); 
    apply(); 
  });
  const streble = el('s-treble'); if (streble) streble.addEventListener('input', e => { 
    set('d-treble', e.target.value); 
    streble.style.setProperty('--fill', (((+e.target.value + 10) / 20) * 100) + '%'); 
    apply(); 
  });

  const btnSs = el('btn-screenshot');
  if (btnSs) btnSs.addEventListener('click', () => {
    send({type:'CAPTURE_FRAME'}, undefined);
    toast('Taking screenshot...');
  });

  function _fmtSize(b) {
    if (!b || b <= 0) return '';
    if (b >= 1048576) return (b / 1048576).toFixed(1) + ' MB';
    if (b >= 1024)    return (b / 1024).toFixed(0) + ' KB';
    return b + ' B';
  }
  function _esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  const urlGo = el('f-url-go');
  const urlEl = el('f-url');
  if (urlGo && urlEl) {
    const handleGo = () => {
      const url = urlEl.value.trim();
      if (!url) { el('dl-status').textContent = 'Paste a TikTok link first'; el('dl-status').style.display='block'; return; }
      const full = url.startsWith('http') ? url : 'https://' + url;
      el('dl-status').textContent = 'Fetching from tikwm.com…';
      el('dl-status').style.display = 'block';
      el('dl-status').style.color = 'var(--mt)';
      el('dl-result').innerHTML = '';
      urlGo.disabled = true;

      chrome.runtime.sendMessage({ type: 'TIKWM_FETCH', url: full }, res => {
        urlGo.disabled = false;
        if (chrome.runtime.lastError) { el('dl-status').textContent = 'Error: ' + chrome.runtime.lastError.message; el('dl-status').style.color='#ff3b30'; return; }
        if (!res || !res.ok) { el('dl-status').textContent = 'Error: ' + (res?.error || 'API error'); el('dl-status').style.color='#ff3b30'; return; }
        
        const d = res.data;
        const box = el('dl-result');
        const rows = [];
        if (d.hdplay) rows.push({ label: 'Video HD', size: d.hd_size || d.hdsize, href: d.hdplay, file: 'tiktok-hd.mp4' });
        if (d.play)   rows.push({ label: 'Video (no wm)', size: d.size, href: d.play, file: 'tiktok.mp4' });
        if (d.wmplay) rows.push({ label: 'Video (wm)', size: d.wm_size || d.wmsize, href: d.wmplay, file: 'tiktok-wm.mp4' });
        if (d.music)  rows.push({ label: 'Audio MP3', size: null, href: d.music, file: 'tiktok-music.mp3' });
        if (d.images && Array.isArray(d.images))
          d.images.forEach((img, i) => rows.push({ label: `Image ${i+1}/${d.images.length}`, size: null, href: img, file: `tiktok-img-${i+1}.jpg` }));
        if (!rows.length && d.cover) rows.push({ label: 'Cover', size: null, href: d.cover, file: 'tiktok-cover.jpg' });

        if (!rows.length) { el('dl-status').textContent = 'No downloadable files'; el('dl-status').style.color='#ff3b30'; return; }

        el('dl-status').textContent = `${rows.length} files ready`;
        el('dl-status').style.color = '#34c759';

        box.innerHTML = rows.map((r, i) => `
          <button class="dl-action-btn" data-url="${_esc(r.href)}" data-file="${_esc(r.file)}" style="display:flex; justify-content:space-between; padding:8px 12px; background:var(--btn-bg); border:1px solid var(--btn-bd); border-radius:8px; color:var(--tx); text-decoration:none; font-size:11.5px; font-weight:500; align-items:center; transition:all 0.2s; cursor:pointer;">
            <span style="display:flex; align-items:center; gap:6px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              ${_esc(r.label)}
            </span>
            ${r.size ? `<span style="color:var(--mt);font-size:10.5px;">${_esc(_fmtSize(r.size))}</span>` : ''}
          </button>`).join('');

        box.querySelectorAll('.dl-action-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const u = btn.getAttribute('data-url');
            const f = btn.getAttribute('data-file');
            btn.style.opacity = '0.5';
            chrome.runtime.sendMessage({ type: 'DOWNLOAD_FILE', url: u, filename: f }, () => {
              setTimeout(() => { btn.style.opacity = '1'; toast('Downloading...'); }, 300);
            });
          });
        });
      });
    };
    urlGo.addEventListener('click', handleGo);
    urlEl.addEventListener('keydown', e => { if (e.key === 'Enter') handleGo(); });
  }
});
