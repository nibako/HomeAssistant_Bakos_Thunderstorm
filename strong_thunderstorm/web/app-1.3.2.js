(() => {
  const $ = (id) => document.getElementById(id);
  const startBtn = $('start');
  const stopBtn = $('stop');
  const flashBtn = $('flash');
  const mediaTestBtn = $('mediaTest');
  const cozyTestBtn = $('cozyTest');
  const cozyRestoreBtn = $('cozyRestore');
  const unlockBtn = $('unlock');
  const message = $('message');
  const rainVol = $('rainVol');
  const thunderVol = $('thunderVol');
  const sync = $('sync');
  const syncZeroBtn = $('syncZero');
  const duration = $('duration');
  const intensity = $('intensity');
  const timing = $('timing');
  const cozyEnabled = $('cozyEnabled');
  const gentleEnd = $('gentleEnd');

  let currentStatus = null;
  let ws;
  let reconnectTimer;
  let audioUnlocked = false;
  let syncSaveTimer = null;
  let controlsInitialized = false;
  let rainFadeToken = 0;

  try {
    localStorage.removeItem('strong_rain_volume');
    localStorage.removeItem('strong_thunder_volume');
  } catch (_) {}

  const rain = new Audio('audio/rain-heavy.m4a');
  rain.loop = true;
  rain.preload = 'auto';
  const thunderCache = new Map();
  for (const name of ['thunder-mid-1.m4a','thunder-mid-2.m4a','thunder-close-1.m4a','thunder-close-2.m4a']) {
    const a = new Audio(`audio/${name}`);
    a.preload = 'auto';
    thunderCache.set(name, a);
  }

  function settingsFromUi() {
    return {
      rain_volume: Number(rainVol.value),
      thunder_volume: Number(thunderVol.value),
      sync_offset_ms: Number(sync.value),
      duration_minutes: Number(duration.value),
      storm_intensity: intensity.value,
      thunder_timing: timing.value,
      cozy_enabled: cozyEnabled.checked,
      gentle_end_seconds: Number(gentleEnd.value),
    };
  }

  function setRangeFill(el) {
    const min = Number(el.min || 0);
    const max = Number(el.max || 100);
    const value = Number(el.value);
    const pct = max === min ? 0 : ((value - min) / (max - min)) * 100;
    el.style.setProperty('--fill', `${Math.max(0, Math.min(100, pct))}%`);
  }

  function percentValue(el) {
    const n = Number(el.value);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(100, Math.round(n)));
  }

  function renderLabels() {
    $('rainVolLabel').textContent = `${percentValue(rainVol)}%`;
    $('thunderVolLabel').textContent = `${percentValue(thunderVol)}%`;
    const s = Number(sync.value);
    $('syncLabel').textContent = `${s > 0 ? '+' : ''}${s} ms`;
    setRangeFill(rainVol);
    setRangeFill(thunderVol);
    setRangeFill(sync);
  }

  async function savePartialSettings(partial, showMessage = false) {
    const res = await fetch('api/settings', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(partial),
    });
    const data = await res.json();
    if (data.status) render(data.status, false);
    if (!data.ok) throw new Error(data.message || 'Einstellungen konnten nicht gespeichert werden');
    if (showMessage) {
      message.textContent = data.message || 'Einstellungen gespeichert';
      message.className = 'small';
    }
  }

  rainVol.addEventListener('input', renderLabels);
  thunderVol.addEventListener('input', renderLabels);
  function saveSyncValue(value, showMessage = false) {
    const normalized = Math.max(-1500, Math.min(1500, Math.round(Number(value) / 10) * 10));
    sync.value = String(normalized);
    renderLabels();
    if (syncSaveTimer) clearTimeout(syncSaveTimer);
    syncSaveTimer = null;
    return savePartialSettings({sync_offset_ms: normalized}, showMessage);
  }

  sync.addEventListener('input', () => {
    renderLabels();
    if (syncSaveTimer) clearTimeout(syncSaveTimer);
    syncSaveTimer = setTimeout(() => savePartialSettings({sync_offset_ms:Number(sync.value)}, false).catch(showError), 180);
  });

  sync.addEventListener('pointerup', () => {
    const value = Number(sync.value);
    if (Math.abs(value) <= 10 && value !== 0) {
      saveSyncValue(0, false).catch(showError);
    }
  });

  syncZeroBtn.addEventListener('click', () => {
    saveSyncValue(0, true).catch(showError);
  });
  rainVol.addEventListener('change', () => savePartialSettings({rain_volume:Number(rainVol.value)}, true).catch(showError));
  thunderVol.addEventListener('change', () => savePartialSettings({thunder_volume:Number(thunderVol.value)}, true).catch(showError));
  duration.addEventListener('change', () => savePartialSettings({duration_minutes:Number(duration.value)}, true).catch(showError));
  intensity.addEventListener('change', () => savePartialSettings({storm_intensity:intensity.value}, true).catch(showError));
  timing.addEventListener('change', () => savePartialSettings({thunder_timing:timing.value}, true).catch(showError));
  cozyEnabled.addEventListener('change', () => savePartialSettings({cozy_enabled:cozyEnabled.checked}, true).catch(showError));
  gentleEnd.addEventListener('change', () => savePartialSettings({gentle_end_seconds:Number(gentleEnd.value)}, true).catch(showError));

  function showError(err) {
    message.textContent = String(err);
    message.className = 'small error';
  }

  async function unlockAudio() {
    try {
      rain.volume = 0;
      await rain.play();
      rain.pause();
      rain.currentTime = 0;
      audioUnlocked = true;
      unlockBtn.textContent = '✓ Browser-Audio aktiviert';
      if (currentStatus?.running && currentStatus?.browser_audio) startRainFade();
    } catch (err) { showError(`Browser-Audio konnte nicht aktiviert werden: ${err}`); }
  }
  unlockBtn.addEventListener('click', unlockAudio);

  async function startRainFade() {
    if (!audioUnlocked || !currentStatus?.browser_audio) return;
    const token = ++rainFadeToken;
    const target = Number(rainVol.value) / 100;
    rain.currentTime = 0;
    rain.volume = 0;
    await rain.play().catch(() => {});
    const started = performance.now();
    const tick = () => {
      if (token !== rainFadeToken || rain.paused) return;
      const p = Math.min(1, (performance.now() - started) / 5000);
      rain.volume = target * p;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function stopRainFade(seconds = 1.4) {
    const token = ++rainFadeToken;
    const startVolume = rain.volume;
    const started = performance.now();
    const durationMs = Math.max(80, Number(seconds) * 1000);
    const tick = () => {
      if (token !== rainFadeToken) return;
      const p = Math.min(1, (performance.now() - started) / durationMs);
      rain.volume = startVolume * (1 - p);
      if (p < 1) requestAnimationFrame(tick);
      else { rain.pause(); rain.currentTime = 0; }
    };
    requestAnimationFrame(tick);
  }

  function render(status, applyControls = true) {
    currentStatus = status;
    const running = !!status.running;
    const ending = !!status.ending;
    const mixing = !!status.mixing;
    $('state').textContent = mixing ? 'Mix wird erzeugt …' : (ending ? 'Gewitter klingt aus …' : (running ? 'Gewitter läuft' : 'Gestoppt'));
    $('state').className = `state ${(running || ending) ? 'on' : 'off'}`;
    $('ready').innerHTML = `<span class="dot ${status.ready ? 'ok' : ''}"></span>${status.ready ? 'bereit' : 'noch nicht bereit'}`;
    $('mqtt').innerHTML = `<span class="dot ${status.mqtt_connected ? 'ok' : ''}"></span>${status.mqtt_connected ? 'verbunden' : 'getrennt'}`;
    $('lights').textContent = `${status.light_count} (${status.lights.join(', ') || 'noch keine Gruppenmitglieder erkannt'})`;
    $('source').textContent = status.light_source === 'group_auto' ? `automatisch aus Gruppe${status.group_found ? '' : ' – Gruppe noch nicht gefunden'}` : 'manuelle Lampenliste';
    $('group').textContent = status.lightning_group || 'keine – Blitzlicht wird einzeln gesendet';
    $('audioStatus').innerHTML = status.assets_ready ? '<span class="dot ok"></span>dynamischer Mixer bereit' : '<span class="warn">Mixer noch nicht bereit</span>';
    $('mediaStatus').textContent = status.media_player_audio ? `${status.media_player} · Einzelstream` : (status.media_player ? `${status.media_player} · Audio deaktiviert` : 'nicht konfiguriert');
    const mix = status.current_mix || {};
    const intensityLabel = {original:'Original', calm:'Ruhiger', extreme:'Extrem'}[mix.intensity || status.settings?.storm_intensity] || '—';
    const timingLabel = (mix.timing || status.settings?.thunder_timing) === 'realistic' ? 'realistisch' : 'original';
    $('mixStatus').textContent = mix.filename ? `${Math.round((mix.duration_seconds || 0)/60)} min · ${mix.thunder_events} Donner · ${intensityLabel} · ${timingLabel}` : `noch keiner · ${intensityLabel} · ${timingLabel}`;
    $('browserCard').style.display = status.media_player_audio ? 'none' : '';

    const cozyLight = status.cozy_scene ? `Szene ${status.cozy_scene}` : `eingebaut · ${status.cozy_lights?.join(', ') || 'keine Lampen'}`;
    $('cozyLightStatus').textContent = `${status.cozy_active ? 'aktiv · ' : ''}${cozyLight}`;
    $('cozyMediaStatus').textContent = status.cozy_media_player || 'nicht konfiguriert';
    $('fireplaceMediaStatus').textContent = status.fireplace_media || 'nicht konfiguriert';

    startBtn.disabled = running || ending || mixing || !status.ready;
    stopBtn.disabled = ending || (!running && !mixing && !status.cozy_active);
    flashBtn.disabled = !status.ready || mixing;
    mediaTestBtn.disabled = !(status.media_player_audio && status.media_player && status.assets_ready) || running || mixing;
    cozyTestBtn.disabled = running || mixing || status.cozy_active;
    cozyRestoreBtn.disabled = !status.cozy_active;

    if (applyControls && status.settings && !controlsInitialized) {
      rainVol.value = Math.max(0, Math.min(100, Number(status.settings.rain_volume) || 0));
      thunderVol.value = Math.max(0, Math.min(100, Number(status.settings.thunder_volume) || 0));
      sync.value = status.settings.sync_offset_ms;
      duration.value = String(status.settings.duration_minutes);
      intensity.value = status.settings.storm_intensity || 'original';
      timing.value = status.settings.thunder_timing || 'original';
      cozyEnabled.checked = !!status.settings.cozy_enabled;
      gentleEnd.value = String(status.settings.gentle_end_seconds ?? 8);
      controlsInitialized = true;
      renderLabels();
    }
    if (!running && !mixing && !rain.paused) stopRainFade();
  }

  async function api(path) {
    const res = await fetch(path, { method: 'POST', headers: {'Content-Type':'application/json'} });
    const data = await res.json();
    if (data.status) render(data.status);
    if (!data.ok) throw new Error(data.message || 'Fehler');
    return data;
  }

  startBtn.addEventListener('click', async () => {
    message.textContent = currentStatus?.media_player_audio ? 'Erzeuge einen neuen zufälligen Mix …' : '';
    message.className = 'small';
    startBtn.disabled = true;
    try {
      await savePartialSettings(settingsFromUi(), false);
      const result = await api('api/start');
      message.textContent = result.message === 'started' ? 'Neue Zufalls-Session gestartet.' : result.message;
    } catch (err) { showError(err); fetch('api/status').then(r => r.json()).then(render).catch(() => {}); }
  });
  stopBtn.addEventListener('click', async () => { try { await api('api/stop'); } catch (err) { showError(err); } });
  flashBtn.addEventListener('click', async () => { try { const r=await api('api/flash'); message.textContent=r.message; } catch (err) { showError(err); } });
  mediaTestBtn.addEventListener('click', async () => {
    message.textContent = 'Erzeuge 24-Sekunden-Testmix …';
    try { await savePartialSettings(settingsFromUi(), false); const r=await api('api/test-media-mix'); message.textContent=r.message; } catch (err) { showError(err); }
  });
  cozyTestBtn.addEventListener('click', async () => { try { const r=await api('api/test-cozy-start'); message.textContent=r.message; } catch (err) { showError(err); } });
  cozyRestoreBtn.addEventListener('click', async () => { try { const r=await api('api/test-cozy-stop'); message.textContent=r.message; } catch (err) { showError(err); } });

  function playThunder(name) {
    if (!audioUnlocked || !currentStatus?.browser_audio) return;
    const cached = thunderCache.get(name);
    if (!cached) return;
    const a = cached.cloneNode(true);
    a.volume = Math.min(1, Number(thunderVol.value) / 100);
    a.play().catch(() => {});
  }

  function connectWs() {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    const u = new URL('ws', window.location.href);
    u.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(u);
    ws.onmessage = (ev) => {
      const data = JSON.parse(ev.data);
      if (data.type === 'status') render(data.status, false);
      if (data.type === 'storm_started' && data.browser_audio && audioUnlocked) startRainFade();
      if (data.type === 'storm_ending') stopRainFade(Number(data.seconds) || 1.4);
      if (data.type === 'storm_stopped' && !rain.paused) stopRainFade(0.25);
      if (data.type === 'thunder') playThunder(data.file);
      if (data.type === 'error') showError(data.message);
    };
    ws.onclose = () => { reconnectTimer = setTimeout(connectWs, 1500); };
  }

  fetch('api/status').then(r => r.json()).then(render).catch(() => {});
  connectWs();
})();
