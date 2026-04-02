// TikTok Pro Tools - Background v12

// ─── TikWM Download API (proxy to avoid CORS) ────────────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'TIKWM_FETCH') {
    fetchTikwm(msg.url)
      .then(data => sendResponse({ ok: true, data }))
      .catch(err => sendResponse({ ok: false, error: err.message }));
    return true; // async
  }
  if (msg.type === 'DOWNLOAD_FILE') {
    chrome.downloads.download({
      url: msg.url,
      filename: msg.filename || 'tiktok-download',
      saveAs: false
    });
    sendResponse({ ok: true });
    return true;
  }
});

async function fetchTikwm(tiktokUrl) {
  const body = new URLSearchParams({ url: tiktokUrl, hd: '1' });
  const res = await fetch('https://tikwm.com/api/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const json = await res.json();
  if (json.code !== 0) throw new Error(json.msg || 'API error');
  return json.data;
}

// Keep SW alive
chrome.alarms.create('keepAlive', { periodInMinutes: 0.4 });
chrome.alarms.onAlarm.addListener(() => {});
