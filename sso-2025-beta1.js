// sso-2025-beta1.js (no Custom Elements, no Shadow DOM) – Wix safe – MOBILE OPTIMIZED
(function(){
  const JSQR_URL = 'https://unpkg.com/jsqr@1.4.0/dist/jsQR.js';
  let jsqrLoaded = false;

  // --- iOS patch: forziamo jsQR (BarcodeDetector è ballerino su Safari) ---
  const isIOS = /iP(hone|ad|od)|iPhone|iPad|iPod/.test(navigator.userAgent);
  try{ if (isIOS && 'BarcodeDetector' in window) window.BarcodeDetector = undefined; }catch(_){}

  function ensureJsQR(){
    return new Promise((resolve)=>{
      if (jsqrLoaded){ resolve(); return; }
      const s = document.createElement('script');
      s.src = JSQR_URL; s.async = true; s.onload = ()=>{ jsqrLoaded = true; resolve(); };
      s.onerror = ()=> resolve(); // proseguiamo comunque (solo QR-fallback mancherà)
      document.head.appendChild(s);
    });
  }

  function h(html){
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }

  function beep(freq=1200, ms=130){
    try{
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type='sine'; osc.frequency.value=freq;
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      osc.start(); osc.stop(ctx.currentTime + ms/1000);
    }catch(_){}
    if (navigator.vibrate) navigator.vibrate(30);
  }
  function byId(root,id){ return root.querySelector('#'+id); }

  // Stato globale (persistito)
  let state = {
    scanning: false,
    currentZone: localStorage.getItem('mloc_text') || null,
    zoneData:  safeJSON(localStorage.getItem('zoneData')) || {},
    zoneOrder: safeJSON(localStorage.getItem('zoneOrder')) || []
  };
  function safeJSON(s){ try{ return JSON.parse(s||''); }catch(_){ return null; } }
  function persist(){
    localStorage.setItem('zoneData', JSON.stringify(state.zoneData));
    localStorage.setItem('zoneOrder', JSON.stringify(state.zoneOrder));
    if (state.currentZone) localStorage.setItem('mloc_text', state.currentZone);
  }
  function ensureZone(z){
    if (!state.zoneData[z]) state.zoneData[z] = [];
    if (!state.zoneOrder.includes(z)) state.zoneOrder.push(z);
  }
  function addNum(z,n){
    ensureZone(z);
    const arr = state.zoneData[z];
    if (!arr.includes(n)) arr.push(n);
  }
  function removeNum(z,n){
    const arr = state.zoneData[z]; if (!arr) return;
    const i = arr.indexOf(n); if (i>=0) arr.splice(i,1);
  }
  function buildPayload(){
    const blocks = [];
    for (const z of state.zoneOrder){
      const arr = (state.zoneData[z]||[]).slice().sort((a,b)=>Number(a)-Number(b));
      if (!arr.length) continue;
      blocks.push(['LOC|'+z, ...arr].join('\n'));
    }
    return blocks.join('\n\n');
  }

  // UI template (mobile-first)
  const UI = `
  <style>
    :root { --bg:#0b0b0b; --fg:#fff; --muted:#1c1c1e; --accent:#0a84ff; --danger:#ff453a; --ok:#34c759; --chip:#1f1f22; --border:#2c2c2e; }
    .sso { color:var(--fg); background:var(--bg); font-family:-apple-system,system-ui,Segoe UI,Roboto,sans-serif; }
    .sso *{ box-sizing:border-box; }
    @supports (-webkit-touch-callout:none){ .sso input{ font-size:16px; } } /* evita zoom su iOS */

    .sso header{ padding:14px 16px 6px; text-align:center; border-bottom:1px solid #222; }
    .sso header h1{ margin:0; font-size:18px; font-weight:800; }
    .sso header small{ display:block; margin-top:4px; font-size:12px; opacity:.65; }

    .wrap{ padding:14px 16px 110px; } /* spazio per la bar fissa */
    .section{ margin:14px 0 0; }
    .step-title{ font-size:14px; opacity:.85; margin-bottom:10px; display:flex; align-items:center; gap:8px; }
    .step-badge{ background:#2a2a2d; color:#fff; border-radius:999px; padding:2px 8px; font-size:12px; }

    /* controlli: mobile = colonna; desktop = riga */
    .controls{ display:flex; flex-direction:column; gap:10px; }
    @media (min-width:700px){ .controls{ flex-direction:row; } }

    .btn{ padding:14px 16px; border:0; border-radius:12px; font-size:16px; font-weight:700; color:#fff; cursor:pointer; width:100%; }
    .primary{ background:var(--accent); }
    .ghost{ background:var(--muted); }
    .danger{ background:var(--danger); }
    @media (min-width:700px){ .btn{ width:auto; } .primary{ flex:1; } }

    .seg-row{ display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
    .seg{ display:flex; background:#161618; border:1px solid var(--border); border-radius:999px; overflow:auto; -webkit-overflow-scrolling:touch; }
    .seg::-webkit-scrollbar{ display:none; }
    .seg .opt{ padding:8px 12px; font-size:14px; border:0; background:transparent; color:#fff; cursor:pointer; white-space:nowrap; }
    .seg .opt.active{ background:var(--ok); color:#000; }
    .seg-label{ font-size:13px; opacity:.8; min-width:72px; }

    .chips{ display:flex; gap:8px; margin-top:12px; flex-wrap:wrap; }
    .chip{ background:#2a2a2d; color:#fff; padding:10px 12px; border-radius:999px; font-size:14px; border:0; cursor:pointer; white-space:nowrap; }
    .chip.active{ background:var(--ok); color:#000; }

    .custom{ display:flex; gap:8px; margin-top:10px; }
    .custom input{ flex:1; padding:12px 14px; border-radius:12px; border:1px solid var(--border); background:#111; color:#fff; font-size:15px; }
    .custom button{ padding:12px 14px; border-radius:12px; border:0; background:var(--muted); color:#fff; font-weight:700; cursor:pointer; }

    .selected-zone{ margin-top:10px; padding:10px 12px; border-radius:12px; background:#111; border:1px solid var(--border); display:flex; align-items:center; gap:8px; font-weight:600; }
    .selected-dot{ width:10px; height:10px; border-radius:999px; background:var(--ok); display:inline-block; }

    /* finestra camera: altezza stabile su mobile; 16:9 su desktop */
    video{ width:100%; aspect-ratio:16/9; background:#000; border-radius:12px; margin-top:10px; display:none; }
    .placeholder{ width:100%; aspect-ratio:16/9; border-radius:12px; border:1px dashed var(--border); display:flex; align-items:center; justify-content:center; color:#aaa; margin-top:10px; text-align:center; padding:0 12px; }
    @media (max-width:600px){
      video, .placeholder{ height:56vw; aspect-ratio:auto; }
    }

    .box{ border:1px solid var(--border); border-radius:12px; padding:12px; background:#111; margin-top:10px; }
    .label{ font-size:12px; opacity:.7; margin-bottom:4px; }
    .zone-line{ font-size:15px; font-weight:700; margin-bottom:8px; }
    .list{ display:flex; flex-wrap:wrap; gap:6px; min-height:44px; }
    .pill{ padding:8px 12px; border-radius:999px; background:var(--chip); font-size:15px; }
    .summary{ margin-top:10px; font-size:12px; opacity:.75; }

    /* barra azioni: fixed + safe-area */
    .bar{
      position:fixed; left:0; right:0; bottom:0;
      backdrop-filter:blur(6px);
      background:rgba(15,15,15,.96);
      border-top:1px solid var(--border);
      padding:10px 12px calc(10px + env(safe-area-inset-bottom));
      display:flex; gap:10px; z-index:2147483000;
    }
    .bar .btn{ flex:1; }
  </style>

  <div class="sso">
    <header>
      <h1>Scansione Stoccaggio Ordini</h1>
      <small>spese bottega natale 2025</small>
    </header>

    <div class="wrap">
      <!-- STEP 1 -->
      <div class="section">
        <div class="step-title"><span class="step-badge">1</span> Seleziona la zona che stai per scansionare</div>

        <div class="seg-row">
          <div class="seg-label">NEGOZIO</div>
          <div class="seg" id="segNegozio">
            <button class="opt" data-zone="NEGOZIO - SOPRA">SOPRA</button>
            <button class="opt" data-zone="NEGOZIO - SOTTO">SOTTO</button>
          </div>

          <div class="seg-label" style="margin-left:auto">CAMION</div>
          <div class="seg" id="segCamion">
            <button class="opt" data-zone="CAMION - SOPRA">SOPRA</button>
            <button class="opt" data-zone="CAMION - SOTTO">SOTTO</button>
          </div>
        </div>

        <div class="chips">
          <button class="chip" data-zone="CARNE">CARNE</button>
          <button class="chip" data-zone="SCALE">SCALE</button>
        </div>

        <div class="custom">
          <input id="customZone" placeholder="Zona personalizzata (es. CELLA - RIPIANO 2)">
          <button id="useCustom">Usa</button>
        </div>

        <div class="selected-zone"><span class="selected-dot"></span> <span id="loc">Nessuna zona selezionata</span></div>
      </div>

      <!-- STEP 2 -->
      <div class="section">
        <div class="step-title"><span class="step-badge">2</span> Avvia scansione</div>
        <div class="controls">
          <button id="btnScan" class="btn primary">Avvia scansione</button>
          <button id="btnStop" class="btn ghost">Stop</button>
          <button id="btnCompat" class="btn ghost">Modalità compatibile (foto)</button>
        </div>
        <input id="fileCompat" type="file" accept="image/*" capture="environment" style="display:none">
        <div class="compatNote" style="font-size:12px;opacity:.7;margin-top:6px">Se Safari blocca la fotocamera live, usa la modalità compatibile: scatta foto e legge il codice dall’immagine.</div>
      </div>

      <!-- STEP 3 -->
      <div class="section">
        <div class="step-title"><span class="step-badge">3</span> Finestra di scansione</div>
        <video id="video" playsinline muted></video>
        <div id="placeholder" class="placeholder">
          La fotocamera comparirà qui dopo “Avvia scansione”.
        </div>
      </div>

      <!-- STEP 4 -->
      <div class="section">
        <div class="step-title"><span class="step-badge">4</span> Verifica numeri letti</div>
        <div class="box">
          <div class="label">Zona</div>
          <div class="zone-line" id="zoneLine">—</div>
          <div class="list" id="list"></div>
          <div class="summary" id="summary"></div>
        </div>
      </div>

      <div class="bar">
        <button id="btnCopy" class="btn primary">Termina e copia</button>
        <button id="btnClear" class="btn danger">Svuota</button>
      </div>
    </div>
  </div>
  `;

  function initDOM(mount){
    mount.innerHTML = UI;

    const video = byId(mount,'video');
    const placeholder = byId(mount,'placeholder');

    // Selettori zona
    mount.querySelectorAll('#segNegozio .opt').forEach(btn=>{
      btn.addEventListener('click', ()=>{ selectZone(btn.dataset.zone); toggleActive(btn, '#segNegozio .opt'); });
    });
    mount.querySelectorAll('#segCamion .opt').forEach(btn=>{
      btn.addEventListener('click', ()=>{ selectZone(btn.dataset.zone); toggleActive(btn, '#segCamion .opt'); });
    });
    mount.querySelectorAll('.chip').forEach(ch=>{
      ch.addEventListener('click', ()=>{
        clearActive('#segNegozio .opt'); clearActive('#segCamion .opt');
        mount.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
        ch.classList.add('active'); selectZone(ch.dataset.zone);
      });
    });
    byId(mount,'useCustom').addEventListener('click', ()=>{
      const v = (byId(mount,'customZone').value || '').trim();
      if (!v){ alert('Inserisci una zona personalizzata.'); return; }
      clearActive('#segNegozio .opt'); clearActive('#segCamion .opt');
      mount.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
      selectZone(v);
    });

    // Pulsanti
    byId(mount,'btnScan').addEventListener('click', startScan);
    byId(mount,'btnStop').addEventListener('click', stopScan);
    byId(mount,'btnClear').addEventListener('click', ()=>{
      state.zoneData={}; state.zoneOrder=[]; persist(); render();
    });
    byId(mount,'btnCopy').addEventListener('click', async ()=>{
      stopScan();
      const payload = buildPayload();
      if (!payload){ alert('Nessuna zona con numeri scansionati.'); return; }
      try{
        await navigator.clipboard.writeText(payload);
        alert('Copiato negli appunti.\nApri il Google Form e incolla nel campo "Scansioni".');
      }catch(_){
        const ta = document.createElement('textarea');
        ta.value = payload; document.body.appendChild(ta);
        ta.select(); document.execCommand('copy'); ta.remove();
        alert('Copiato (fallback). Incolla nel Google Form.');
      }
    });

    // Compat foto
    byId(mount,'btnCompat').addEventListener('click', ()=> byId(mount,'fileCompat').click());
    byId(mount,'fileCompat').addEventListener('change', onCompatFile);

    // helpers UI
    function toggleActive(btn, groupSel){
      mount.querySelectorAll(groupSel).forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      mount.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
    }
    function clearActive(sel){ mount.querySelectorAll(sel).forEach(b=>b.classList.remove('active')); }

    function selectZone(z){
      state.currentZone = z;
      localStorage.setItem('mloc_text', z);
      if (!state.zoneOrder.includes(z)) state.zoneOrder.push(z);
      beep(900,90);
      render();
    }

    function render(){
      byId(mount,'loc').textContent = state.currentZone || 'Nessuna zona selezionata';
      mount.querySelectorAll('.seg .opt').forEach(btn=>{
        btn.classList.toggle('active', btn.dataset.zone === state.currentZone);
      });
      mount.querySelectorAll('.chip').forEach(ch=>{
        ch.classList.toggle('active', ch.dataset.zone === state.currentZone);
      });

      byId(mount,'zoneLine').textContent = state.currentZone || '—';

      const listEl = byId(mount,'list'); listEl.innerHTML = '';
      const set = (state.currentZone && state.zoneData[state.currentZone]) ? new Set(state.zoneData[state.currentZone]) : new Set();
      if (set.size){
        const nums = Array.from(set).sort((a,b)=>Number(a)-Number(b));
        for (const n of nums){
          const span = h(`<span class="pill">${n}</span>`);
          listEl.appendChild(span);
        }
      } else {
        const em = h(`<em style="opacity:.7">Nessun numero</em>`);
        listEl.appendChild(em);
      }

      const others = Object.keys(state.zoneData).filter(z=> z!==state.currentZone && (state.zoneData[z] && state.zoneData[z].length));
      byId(mount,'summary').textContent = others.length ? 'Altre zone: ' + others.map(z => `${z} (${state.zoneData[z].length})`).join(' · ') : '';

      persist();
    }

    // SCAN live
    let raf = null, last = '';
    async function startScan(){
      if (!state.currentZone){ alert('Seleziona prima la ZONA.'); return; }
      if (!isSecureContext){ alert('La fotocamera richiede HTTPS.'); return; }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
        alert('Browser non supporta getUserMedia. Usa “Modalità compatibile (foto)”.'); return;
      }
      try{
        // constraints più adatti al decode
        const constraints = { video: { facingMode: { ideal: 'environment' }, width:{ideal:1280}, height:{ideal:720} } };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream; await video.play();
        video.style.display = 'block'; placeholder.style.display = 'none';
        state.scanning = true; loop();
      }catch(e){
        alert('Fotocamera non disponibile: ' + (e && e.message ? e.message : e));
      }
    }
    function stopScan(){
      state.scanning = false;
      if (video.srcObject){ video.srcObject.getTracks().forEach(t=>t.stop()); }
      video.srcObject = null; video.style.display = 'none'; placeholder.style.display = 'flex';
      if (raf) cancelAnimationFrame(raf);
    }

    async function loop(){
      await ensureJsQR();
      const hasBD = 'BarcodeDetector' in window;
      let detector = null;
      if (hasBD){ try{ detector = new BarcodeDetector({ formats: ['qr_code','code_128','ean_13'] }); }catch(_){ detector=null; } }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      const tick = async ()=>{
        if (!video.srcObject) return;
        if (!state.scanning){ raf = requestAnimationFrame(tick); return; }

        try{
          let code = null;
          if (detector){
            const res = await detector.detect(video);
            if (res.length) code = res[0].rawValue;
          } else if (window.jsQR){
            if (video.videoWidth && video.videoHeight){
              canvas.width = video.videoWidth; canvas.height = video.videoHeight;
              ctx.drawImage(video,0,0,canvas.width,canvas.height);
              const img = ctx.getImageData(0,0,canvas.width,canvas.height);
              const q = window.jsQR(img.data, img.width, img.height);
              if (q) code = q.data;
            }
          }

          if (code && code !== last){
            last = code;
            handleCode(code);
            setTimeout(()=>{ last=''; }, 550);
          }
        }catch(_){}
        raf = requestAnimationFrame(tick);
      };
      tick();
    }

    // Compat foto
    async function onCompatFile(ev){
      await ensureJsQR();
      const file = ev.target.files && ev.target.files[0];
      if (!file) return;
      if (!state.currentZone){ alert('Seleziona prima la ZONA.'); return; }
      const img = new Image();
      img.onload = ()=>{
        const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
        const maxW = 1600, scale = Math.min(1, maxW / img.width);
        canvas.width = Math.floor(img.width * scale); canvas.height = Math.floor(img.height * scale);
        ctx.drawImage(img,0,0,canvas.width,canvas.height);
        const data = ctx.getImageData(0,0,canvas.width,canvas.height);
        const qr = window.jsQR ? window.jsQR(data.data, data.width, data.height) : null;
        const code = qr ? qr.data : null;
        if (code){ handleCode(code); } else { alert('Non riesco a leggere il codice dalla foto.'); }
        ev.target.value = '';
      };
      img.onerror = ()=> alert('Immagine non valida.');
      img.src = URL.createObjectURL(file);
    }

    function handleCode(raw){
      const s = (raw||'').trim();
      if (!/^\d+$/.test(s) || !state.currentZone) return; // accetta solo QR numerici
      const num = String(Number(s));

      // è già presente in qualche zona?
      let foundIn = null;
      for (const z of Object.keys(state.zoneData)){
        if (state.zoneData[z] && state.zoneData[z].includes(num)){ foundIn = z; break; }
      }

      if (!foundIn){
        addNum(state.currentZone, num);
        beep(1200,130);
      } else if (foundIn !== state.currentZone){
        removeNum(foundIn, num);
        addNum(state.currentZone, num);
      } // duplicato nella stessa zona → silenzio

      render();
    }

    // prima render
    render();
  }

  // API pubblica
  window.BottegaSSO = {
    init: function(mountSelector){
      var mount = (typeof mountSelector === 'string')
        ? document.querySelector(mountSelector)
        : mountSelector;
      if (!mount){
        mount = document.createElement('div');
        mount.id = 'scanner-mount-inline';
        mount.style = 'max-width:760px;margin:24px auto;padding:0 12px;';
        document.body.appendChild(mount);
      }
      initDOM(mount);
    }
  };
})();
