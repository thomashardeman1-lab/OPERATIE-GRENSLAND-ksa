/* Operatie Grensland – app. Instellingen staan in config.js. */
(function () {
  const C = window.GRENSLAND;
  const $ = id => document.getElementById(id);
  const KEY = 'grensland-state-v1';

  // ---------- Tijd (met demo-modus: ?demo=20 laat de tijd 20× sneller lopen vanaf de start) ----------
  const params = new URLSearchParams(location.search);
  const DEMO = params.has('demo') ? Math.max(1, Number(params.get('demo')) || 1) : 0;
  const loadReal = Date.now();
  function at(hhmm) { const [h, m] = hhmm.split(':').map(Number); const d = new Date(); d.setHours(h, m, 0, 0); return d.getTime(); }
  const T = { start: at(C.tijden.start), nacht: at(C.tijden.nachtValt), eind: at(C.tijden.eindsignaal), einde: at(C.tijden.einde) };
  function now() { return DEMO ? T.start - 30000 + (Date.now() - loadReal) * DEMO : Date.now(); }
  const fmt = ms => { const s = Math.max(0, Math.round(ms / 1000)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
  const clockStr = ms => new Date(ms).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // ---------- Status ----------
  const fresh = () => ({ team: null, unlocked: false, pu: {}, codes: {}, seen: -1, log: [] });
  let S = fresh();
  try { S = Object.assign(S, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

  // ---------- Hulpjes ----------
  function show(id) { document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === id)); }
  function toast(t) { const el = $('toast'); el.textContent = t; el.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => el.classList.remove('on'), 3000); }
  function norm(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim(); }
  async function sha(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
  function wa(text) { return 'https://wa.me/' + C.spelleiderWhatsApp + '?text=' + encodeURIComponent(text); }
  function team() { return C.bendes[S.team]; }
  function buzz(p) { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} }
  let actx;
  function beep() { try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); const o = actx.createOscillator(), g = actx.createGain(); o.frequency.value = 880; g.gain.value = .15; o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime + .25); } catch (e) {} }
  function ask(html, okLabel, onOk) {
    $('modalbox').innerHTML = html + `<div class="row"><button class="btn ghost" id="m-no">Annuleer</button><button class="btn" id="m-ok">${okLabel}</button></div>`;
    $('modal').classList.add('on');
    $('m-no').onclick = () => $('modal').classList.remove('on');
    $('m-ok').onclick = () => { const r = onOk(); if (r !== false) $('modal').classList.remove('on'); };
  }
  $('modal').addEventListener('click', e => { if (e.target.id === 'modal') $('modal').classList.remove('on'); });

  // ---------- Start & opdracht 0 ----------
  $('teamlist').innerHTML = Object.entries(C.bendes).map(([k, t]) =>
    `<button class="teambtn" data-t="${k}"><i style="background:${t.kleur}"></i><span><b>${t.naam}</b><small>${t.info}</small></span></button>`).join('');
  $('teamlist').onclick = e => { const b = e.target.closest('[data-t]'); if (!b) return; S.team = b.dataset.t; save(); applyTeam(); show('s-lock'); setTimeout(() => $('street').focus(), 200); };
  $('back').onclick = () => { S.team = null; save(); show('s-start'); };
  $('unlock').onclick = () => {
    const v = norm($('street').value);
    if (team().straat.some(k => v.includes(norm(k)))) { S.unlocked = true; save(); beep(); enterMain(); toast('Welkom in Grensland. Pas op voor Elias.'); }
    else { $('lockerr').textContent = 'Dat klopt niet. Kijk nog eens goed naar het bord.'; $('street').classList.add('shake'); setTimeout(() => $('street').classList.remove('shake'), 400); buzz(120); }
  };
  $('street').addEventListener('keydown', e => { if (e.key === 'Enter') $('unlock').click(); });
  function applyTeam() { if (team()) { document.documentElement.style.setProperty('--team', team().kleur); document.querySelector('meta[name=theme-color]').content = '#0f1814'; } }

  // ---------- Tabs ----------
  document.querySelector('.tabs').onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    document.querySelectorAll('.tabs button').forEach(x => x.classList.toggle('on', x === b));
    document.querySelectorAll('.view').forEach(v => v.classList.toggle('on', v.id === b.dataset.v));
    if (b.dataset.v === 'v-ch') { S.seen = currentIndex(); save(); }
    if (b.dataset.v === 'v-map' && map) setTimeout(() => map.invalidateSize(), 50);
    render();
  };

  // ---------- Kaart ----------
  let map, meMarker, accCircle, lastPos, follow = true;
  function initMap() {
    if (map || !window.L) { if (!window.L) $('dist').textContent = '⚠️ Kaart kon niet laden. Controleer je internet.'; return; }
    map = L.map('map', { zoomControl: false, attributionControl: true }).setView(C.kaart.centrum, C.kaart.zoom);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
    const label = { post: p => p.id, huis: () => '📦', depot: () => '🏁' };
    C.plekken.forEach(p => {
      const icon = L.divIcon({ className: '', html: `<div class="mk ${p.type}">${label[p.type](p)}</div>`, iconSize: [36, 36], iconAnchor: [18, 18] });
      L.marker(p.ll, { icon }).addTo(map).bindPopup(`<b>${p.naam}</b>`);
    });
    map.on('dragstart', () => { follow = false; });
    startGps();
  }
  function startGps() {
    if (!navigator.geolocation) { $('dist').textContent = '⚠️ Deze gsm geeft geen locatie.'; return; }
    navigator.geolocation.watchPosition(pos => {
      const ll = [pos.coords.latitude, pos.coords.longitude]; lastPos = ll;
      if (!meMarker) {
        meMarker = L.marker(ll, { icon: L.divIcon({ className: '', html: '<div class="me"></div>', iconSize: [20, 20], iconAnchor: [10, 10] }), zIndexOffset: 1000 }).addTo(map);
        accCircle = L.circle(ll, { radius: pos.coords.accuracy, color: '#2d8cff', weight: 1, fillOpacity: .08 }).addTo(map);
        map.setView(ll, Math.max(map.getZoom(), 16));
      } else { meMarker.setLatLng(ll); accCircle.setLatLng(ll).setRadius(pos.coords.accuracy); if (follow) map.panTo(ll); }
      renderDist();
    }, err => {
      $('dist').textContent = err.code === 1 ? '⚠️ Locatie geweigerd. Zet locatie aan voor deze website in je instellingen.' : '📡 Geen gps-signaal. Probeer buiten, weg van gebouwen.';
    }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 });
  }
  function km(a, b) { const R = 6371e3, r = Math.PI / 180, dLat = (b[0] - a[0]) * r, dLon = (b[1] - a[1]) * r; const x = Math.sin(dLat / 2) ** 2 + Math.cos(a[0] * r) * Math.cos(b[0] * r) * Math.sin(dLon / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); }
  const mtxt = m => m < 1000 ? Math.round(m / 10) * 10 + ' m' : (m / 1000).toFixed(1).replace('.', ',') + ' km';
  function renderDist() {
    if (!lastPos) return;
    const huis = C.plekken.find(p => p.type === 'huis'), depot = C.plekken.find(p => p.type === 'depot');
    $('dist').innerHTML = `📦 Smokkelhuis <b>${mtxt(km(lastPos, huis.ll))}</b> &nbsp;·&nbsp; 🏁 Depot <b>${mtxt(km(lastPos, depot.ll))}</b>`;
  }
  $('locate').onclick = () => { follow = true; if (lastPos) map.setView(lastPos, 17); else toast('Nog geen gps-signaal…'); };

  // ---------- Fases & challenges ----------
  function phase(t) {
    if (t < T.start) return { k: 'voor', label: 'Wacht op de start', next: T.start, nextLabel: 'tot de start' };
    if (t < T.nacht) return { k: 'spel', label: 'Smokkelen', next: T.nacht, nextLabel: 'tot nacht valt' };
    if (t < T.eind) return { k: 'nacht', label: '🌙 Nacht valt', next: T.eind, nextLabel: 'tot eindsignaal' };
    if (t < T.einde) return { k: 'eind', label: '🏁 Eindsignaal', next: T.einde, nextLabel: 'tot verzamelen' };
    return { k: 'gedaan', label: 'Missie voorbij', next: null };
  }
  function currentIndex() { const t = now(); let i = -1; C.challenges.forEach((c, j) => { if (at(c.tijd) <= t) i = j; }); return i; }
  let lastIdx = null, lastPhase = null;

  function tick() {
    if (!S.unlocked) return;
    const t = now(), ph = phase(t);
    $('phase').textContent = ph.label + (DEMO ? ' · DEMO ×' + DEMO : '');
    $('countdown').textContent = ph.next ? fmt(ph.next - t) : '—';
    $('countlabel').textContent = ph.next ? ph.nextLabel : '';
    const bn = $('banner');
    bn.className = 'banner';
    if (ph.k === 'nacht') { bn.classList.add('on', 'night'); bn.textContent = '🌙 Nacht valt: het smokkelhuis is dicht en Elias heeft versterking.'; }
    else if (ph.k === 'eind') { bn.classList.add('on', 'end'); bn.textContent = '🏁 Eindsignaal: breng wat je draagt naar het depot, ten laatste om ' + C.tijden.einde + '.'; }
    else if (ph.k === 'gedaan') { bn.classList.add('on', 'end'); bn.textContent = 'De missie is voorbij. Iedereen naar het depot.'; }
    if (lastPhase && lastPhase !== ph.k) { buzz([300, 150, 300]); beep(); toast(ph.label); }
    lastPhase = ph.k;
    const idx = currentIndex();
    if (lastIdx !== null && idx > lastIdx) { buzz([200, 100, 200, 100, 200]); beep(); toast('🎯 Nieuwe challenge: ' + C.challenges[idx].naam); }
    if (idx !== lastIdx) { lastIdx = idx; render(); }
    $('badge').classList.toggle('on', idx > S.seen && !document.querySelector('[data-v=v-ch]').classList.contains('on'));
  }

  function render() {
    if (!S.unlocked) return;
    $('tname').textContent = team().naam;
    const idx = currentIndex(), t = now();
    // live
    const c = C.challenges[idx];
    if (!c) {
      $('live').innerHTML = `<div class="card"><b>Nog geen challenge.</b><p class="hint" style="margin:6px 0 0">De eerste verschijnt om ${C.challenges[0].tijd}. Wie eerst is, wint.</p></div>`;
    } else {
      const p = C.powerups[c.powerup], won = S.codes[idx];
      $('live').innerHTML = `<div class="card live"><span class="chip p">Challenge van ${c.tijd}</span>
        <h3 style="font-size:20px;margin:10px 0 4px">${c.naam}</h3><p style="margin:0">${c.opdracht}</p>
        <div class="prize"><small>De eerste bende wint</small><b>${p.e} ${p.naam}</b></div>
        ${won ? '<span class="chip g">🏆 Gewonnen! Power-up toegevoegd.</span>' :
        `<a class="btn wa" href="${wa(team().naam + ' – challenge "' + c.naam + '" (' + c.tijd + '). Bewijs:')}" target="_blank" rel="noopener">📷 Stuur bewijs via WhatsApp</a>
         <p class="hint" style="margin:10px 0 0">Waren jullie eerst? Dan krijg je van de spelleider een code:</p>
         <div class="coderow"><input class="field" id="code" placeholder="CODE" autocomplete="off" autocapitalize="characters" enterkeyhint="done"><button class="btn" id="codeok">OK</button></div>`}
      </div>`;
      const ok = $('codeok');
      if (ok) { ok.onclick = () => checkCode(idx, $('code')); $('code').addEventListener('keydown', e => { if (e.key === 'Enter') checkCode(idx, $('code')); }); }
    }
    const nxt = C.challenges.find(x => at(x.tijd) > t);
    $('nextch').textContent = nxt ? 'Volgende challenge om ' + nxt.tijd + '.' : (c ? 'Dit was de laatste challenge.' : '');
    $('history').innerHTML = C.challenges.slice(0, Math.max(0, idx)).map((x, i) => {
      const p = C.powerups[x.powerup];
      return `<div class="item"><span class="e">${p.e}</span><span class="t"><b>${x.naam}</b><small>${x.tijd}</small></span>${S.codes[i] ? '<span class="chip g">Gewonnen</span>' : `<button class="chip" data-old="${i}">Code?</button>`}</div>`;
    }).reverse().join('') || '<p class="hint">Nog niets.</p>';
    // power-ups
    let total = 0;
    $('pulist').innerHTML = Object.entries(C.powerups).map(([k, p]) => {
      const n = S.pu[k] || 0; total += n;
      return `<button class="pucard${n ? '' : ' no'}" data-pu="${k}"><span class="e">${p.e}</span><b>${p.naam}</b><small>${p.uitleg}</small><span class="act" style="${n ? '' : 'color:var(--muted)'}">${n ? n + '× · Activeer →' : 'Nog te winnen'}</span></button>`;
    }).join('');
    $('pubadge').classList.toggle('on', total > 0);
  }

  async function checkCode(i, inp) {
    const raw = (inp ? inp.value : '').toUpperCase().replace(/[\s-]/g, '');
    if (!raw) return false;
    const h = await sha(raw);
    if (h === C.challenges[i].codeHash) {
      S.codes[i] = true; const k = C.challenges[i].powerup; S.pu[k] = (S.pu[k] || 0) + 1; save();
      buzz([100, 50, 100]); beep(); toast('🏆 ' + C.powerups[k].e + ' ' + C.powerups[k].naam + ' gewonnen!'); $('modal').classList.remove('on'); render(); return true;
    }
    inp.classList.add('shake'); setTimeout(() => inp.classList.remove('shake'), 400); buzz(150); toast('Foute code'); return false;
  }
  $('history').addEventListener('click', e => {
    const b = e.target.closest('[data-old]'); if (!b) return; const i = +b.dataset.old;
    ask(`<h3>Code voor "${C.challenges[i].naam}"</h3><input class="field" id="oldcode" placeholder="CODE" autocapitalize="characters" autocomplete="off">`, 'OK', () => { checkCode(i, $('oldcode')); return false; });
    setTimeout(() => $('oldcode') && $('oldcode').focus(), 100);
  });

  // ---------- Power-up activeren ----------
  $('pulist').onclick = e => {
    const b = e.target.closest('[data-pu]'); if (!b) return; const k = b.dataset.pu, p = C.powerups[k];
    if (!(S.pu[k] > 0)) { toast('Die moet je eerst winnen met een challenge.'); return; }
    ask(`<h3>${p.e} ${p.naam} activeren?</h3><p class="hint">${p.uitleg}<br>Je kunt hem maar één keer gebruiken.</p>`, 'Activeer', () => activate(k));
  };
  function activate(k) {
    const p = C.powerups[k], t0 = Date.now();
    S.pu[k]--; S.log.push({ k, t: t0 }); save(); render();
    $('full').innerHTML = `<div class="e">${p.e}</div><h3>${p.naam}</h3><p>${p.uitleg}</p><div class="live" id="lv"></div>
      <div class="meta">${team().naam} · geactiveerd om ${clockStr(t0)}</div>
      ${p.meld ? `<a class="btn wa" href="${wa(team().naam + ' activeert ' + p.naam + ' om ' + clockStr(t0) + '. Elias moet 3 minuten stilstaan!')}" target="_blank" rel="noopener">📲 Meld aan spelleider</a>` : ''}
      <button class="btn" id="donepu">Sluiten</button>`;
    $('full').classList.add('on'); buzz(200);
    clearInterval(activate.h);
    const lv = () => { const el = $('lv'); if (!el) return; if (p.timer) { const left = p.timer * 1000 - (Date.now() - t0); el.textContent = left > 0 ? fmt(left) : 'Elias is los!'; } else el.textContent = clockStr(Date.now()); };
    lv(); activate.h = setInterval(lv, 250);
    $('donepu').onclick = () => ask('<h3>Scherm sluiten?</h3><p class="hint">Heeft de leiding het scherm gezien? Je kunt het daarna niet meer openen.</p>', 'Sluiten', () => { clearInterval(activate.h); $('full').classList.remove('on'); });
  }

  // ---------- Regels, nood, scherm aan, reset ----------
  $('objtable').innerHTML = C.objecten.map(o => `<tr><td>${o.e} ${o.naam}</td><td>${o.punten}</td></tr>`).join('');
  $('sos').onclick = () => { location.href = 'tel:' + C.spelleiderTel; };
  let wakeLock = null;
  $('wake').onchange = async e => {
    try {
      if (e.target.checked) { wakeLock = await navigator.wakeLock.request('screen'); toast('Scherm blijft aan'); }
      else if (wakeLock) { await wakeLock.release(); wakeLock = null; }
    } catch (err) { e.target.checked = false; toast('Dit lukt niet op deze gsm'); }
  };
  document.addEventListener('visibilitychange', async () => { if (document.visibilityState === 'visible' && $('wake').checked && 'wakeLock' in navigator) { try { wakeLock = await navigator.wakeLock.request('screen'); } catch (e) {} } });
  $('reset').onclick = () => ask('<h3>App resetten</h3><p class="hint">Alleen voor de leiding. Alle power-ups worden gewist.</p><input class="field" id="pin" type="password" inputmode="numeric" placeholder="Pincode">', 'Reset', () => {
    if ($('pin').value !== C.leidingPin) { $('pin').classList.add('shake'); return false; }
    S = fresh(); save(); location.reload();
  });

  // ---------- Installatie-tip ----------
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const tip = standalone ? '' : ios ? 'Tip: tik op Delen ⬆️ en dan "Zet op beginscherm" om de app als icoon te bewaren.' : 'Tip: open het menu ⋮ van je browser en kies "App installeren" of "Toevoegen aan startscherm".';
  $('installhint').textContent = tip; $('installhint2').textContent = tip;

  // ---------- Opstarten ----------
  function enterMain() { show('s-main'); applyTeam(); render(); tick(); setTimeout(initMap, 50); }
  applyTeam();
  if (S.team && S.unlocked) enterMain(); else if (S.team) show('s-lock');
  setInterval(tick, 1000);
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
