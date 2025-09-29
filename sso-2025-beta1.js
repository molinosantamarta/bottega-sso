(function(){
  // SSO Scanner Injector (UI+Logic) — aspetto identico al canvas attuale
  // Nessun Custom Element o Shadow DOM. Safe per Wix.
  // API: SSOScanner.init(mountSelector)

  const $ = (root, sel) => root.querySelector(sel);
  const $$ = (root, sel) => Array.from(root.querySelectorAll(sel));

  // ---------------- CSS (copiato dal canvas: stesso look & animazioni) ----------------
  const CSS = `
    [data-sso] { color-scheme: dark; }
    [data-sso] :where(*) { box-sizing: border-box; }
    [data-sso] { --bg:#0b0b0b; --fg:#fff; --muted:#1c1c1e; --accent:#0a84ff; --danger:#ff453a; --ok:#34c759; --chip:#1f1f22; --border:#2c2c2e; background:var(--bg); color:var(--fg); font-family:-apple-system,system-ui,Segoe UI,Roboto,sans-serif; }
    [data-sso] .wrap{ padding:12px 12px 110px; max-width:760px; margin:0 auto; }

    [data-sso] header{ padding:16px 16px 12px; text-align:center; border-bottom:1px solid #222; }
    [data-sso] header h1{ margin:0; font-size:26px; font-weight:900; line-height:1.3; color:transparent; background:linear-gradient(90deg, #ff0000 0%, #ff9900 25%, #ffff00 50%, #ff9900 75%, #ff0000 100%); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; background-size:300% 100%; animation:radar-sweep 8s linear infinite; }
    [data-sso] header small{ display:block; margin-top:6px; font-size:14px; opacity:.75; }

    [data-sso] .section{ margin-top:20px; border-radius:12px; padding:10px; transition:background .3s ease; }
    [data-sso] .section.active{ background:rgba(52,199,89,.12); }
    [data-sso] .step-title{ font-size:14px; opacity:.85; margin-bottom:16px; display:flex; align-items:center; gap:8px; }
    [data-sso] .step-badge{ background:#2a2a2d; color:#fff; border-radius:999px; padding:2px 8px; font-size:12px; transition:all .2s ease; }
    [data-sso] .step-badge.done{ background:var(--ok); color:#000; font-weight:800; }

    /* Effetto lampeggio per le badge degli step (blu come nel canvas attuale) */
    @keyframes pulse-badge { 0%,100%{ transform:translateZ(0) scale(1); box-shadow:0 0 0 0 rgba(10,132,255,.0);} 50%{ transform:translateZ(0) scale(1.1); box-shadow:0 0 0 6px rgba(10,132,255,.15);} }
    [data-sso] .step-badge.pulse{ animation:pulse-badge 1.2s ease-in-out infinite; background:linear-gradient(180deg, #0a84ff, #0569c9); }

    [data-sso] .controls{ display:flex; flex-direction:column; gap:10px; }
    @media (min-width:700px){ [data-sso] .controls{ flex-direction:row; } }

    [data-sso] .btn{ padding:14px 16px; border:0; border-radius:12px; font-size:16px; font-weight:700; color:#fff; cursor:pointer; width:100%; }
    [data-sso] .primary{ background:var(--accent); }
    [data-sso] .ghost{ background:var(--muted); }
    [data-sso] .danger{ background:var(--danger); }
    @media (min-width:700px){ [data-sso] .btn{ width:auto; } .primary{ flex:1; } }

    [data-sso] .seg-row{ display:flex; gap:10px; align-items:center; flex-wrap:wrap; margin-bottom:12px; }
    [data-sso] .seg{ display:flex; background:#161618; border:1px solid var(--border); border-radius:999px; overflow:auto; -webkit-overflow-scrolling:touch; transition:all .2s ease; }
    [data-sso] .seg::-webkit-scrollbar{ display:none; }
    [data-sso] .seg.active{ border-color:rgba(52,199,89,.9); background:linear-gradient(180deg, rgba(52,199,89,.15), rgba(52,199,89,.05)); box-shadow:0 8px 24px rgba(52,199,89,.28), inset 0 1px 0 rgba(255,255,255,.15); }
    [data-sso] .seg .opt{ padding:8px 12px; font-size:14px; border:0; background:transparent; color:#fff; cursor:pointer; white-space:nowrap; transition:all .2s ease; }
    [data-sso] .seg .opt.active{ background:linear-gradient(180deg, rgba(52,199,89,1), rgba(52,199,89,.85)); color:#000; font-weight:800; box-shadow:0 6px 18px rgba(52,199,89,.45), inset 0 1px 0 rgba(255,255,255,.25); border-radius:999px; }
    [data-sso] .seg-label{ font-size:13px; opacity:.8; min-width:72px; transition:all .2s ease; }
    [data-sso] .seg-label.active{ color:var(--ok); font-weight:800; opacity:1; text-shadow:0 0 8px rgba(52,199,89,.6); }

    [data-sso] .chips{ display:flex; gap:8px; margin-top:12px; flex-wrap:wrap; }
    [data-sso] .chip{ background:#2a2a2d; color:#fff; padding:10px 12px; border-radius:999px; font-size:14px; border:0; cursor:pointer; white-space:nowrap; transition:all .2s ease; }
    [data-sso] .chip.active{ background:linear-gradient(180deg, rgba(52,199,89,1), rgba(52,199,89,.85)); color:#000; font-weight:800; box-shadow:0 6px 18px rgba(52,199,89,.45), inset 0 1px 0 rgba(255,255,255,.25); }

    [data-sso] .custom{ display:flex; gap:8px; margin-top:10px; }
    [data-sso] .custom input{ flex:1; padding:8px 12px; border-radius:999px; border:1px solid var(--border); background:#161618; color:#fff; font-size:14px; }
    [data-sso] .custom input::placeholder{ color:#aaa; }
    [data-sso] .custom button{ padding:12px 14px; border-radius:999px; border:0; background:var(--muted); color:#fff; font-weight:700; cursor:pointer; }

    [data-sso] .selected-zone{ margin-top:10px; padding:10px 12px; border-radius:12px; background:#111; border:1px solid var(--border); display:flex; align-items:center; gap:8px; font-weight:600; transition:background .3s ease, box-shadow .3s ease, color .3s ease; }
    [data-sso] .selected-zone.active{ background:#ffd60a; color:#000; box-shadow:0 4px 14px rgba(0,0,0,.25); }
    [data-sso] .selected-dot{ width:10px; height:10px; border-radius:999px; background:var(--ok); display:inline-block; }

    [data-sso] video{ width:100%; aspect-ratio:16/9; background:#000; border-radius:12px; margin-top:10px; display:none; }
    [data-sso] .placeholder{ width:100%; aspect-ratio:16/9; border-radius:12px; border:1px dashed var(--border); display:flex; align-items:center; justify-content:center; color:#aaa; margin-top:10px; text-align:center; padding:0 12px; }
    @media (max-width:600px){
      [data-sso] video, [data-sso] .placeholder{ height:56vw; aspect-ratio:auto; }
    }

    [data-sso] .box{ border:1px solid var(--border); border-radius:12px; padding:12px; background:#111; margin-top:10px; }
    [data-sso] .label{ font-size:12px; opacity:.7; margin-bottom:4px; }
    [data-sso] .zone-line{ font-size:15px; font-weight:700; margin-bottom:8px; }
    [data-sso] .list{ display:flex; flex-wrap:wrap; gap:6px; min-height:44px; }
    [data-sso] .pill{ padding:8px 12px; border-radius:999px; background:var(--chip); font-size:15px; }
    [data-sso] .summary{ margin-top:10px; font-size:12px; opacity:.75; }

    [data-sso] .bar{ position:fixed; left:0; right:0; bottom:0; backdrop-filter:blur(6px); background:rgba(15,15,15,.96); border-top:1px solid var(--border); padding:10px 12px calc(10px + env(safe-area-inset-bottom)); display:flex; gap:10px; z-index:2147483000; }
    [data-sso] .bar .btn{ flex:1; }

    [data-sso] .demo-badge{ position:fixed; top:10px; right:10px; background:#333; color:#fff; font:12px/1 -apple-system,system-ui,Segoe UI,Roboto,sans-serif; padding:6px 8px; border-radius:8px; opacity:.8; }
    @keyframes radar-sweep{0%{background-position:0% 50%;}50%{background-position:200% 50%;}100%{background-position:0% 50%;}}
  `;

  // ---------------- HTML (identico alla struttura del canvas) ----------------
  const UI = `
    <div data-sso>
      <header>
        <h1>Scanner Stoccaggio Ordini</h1>
        <small>Scansiona, organizza e trova subito le spese al momento del ritiro</small>
      </header>

      <div class="wrap">
        <!-- STEP 1 -->
        <div class="section" id="section1">
          <div class="step-title"><span class="step-badge" id="badge1">1</span> Seleziona la zona che stai per scansionare</div>

          <div class="seg-row">
            <div class="seg-label">NEGOZIO</div>
            <div class="seg" id="segNegozio">
              <button class="opt" data-zone="NEGOZIO - SOPRA">SOPRA</button>
              <button class="opt" data-zone="NEGOZIO - SOTTO">SOTTO</button>
            </div>
          </div>

          <div class="seg-row">
            <div class="seg-label">CAMION</div>
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
            <input id="customZone" placeholder="Scrivi tu la zona..">
            <button id="useCustom">Usa</button>
          </div>

          <div class="selected-zone" id="selectedZone"><span class="selected-dot"></span> <span id="loc">Nessuna zona selezionata</span></div>
        </div>

        <!-- STEP 2 -->
        <div class="section" id="section2">
          <div class="step-title"><span class="step-badge" id="badge2">2</span> Avvia scansione</div>
          <div class="controls">
            <button id="btnScan" class="btn primary">Avvia scansione</button>
          </div>
          <video id="video" playsinline muted></video>
          <div id="placeholder" class="placeholder">
            La fotocamera comparirà qui dopo “Avvia scansione”.
          </div>
        </div>

        <!-- STEP 3 -->
        <div class="section" id="section3">
          <div class="step-title"><span class="step-badge" id="badge3">3</span> Verifica numeri letti</div>
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
    <div class="demo-badge" aria-hidden="true">Prototype (iniettato via JS)</div>
  `;

  // ---------------- Logica completa (identica a quella discussa) ----------------
  function mountUI(mount){
    // CSS scoped (una sola volta per mount)
    let styleTag = mount.querySelector('style[data-sso-style]');
    if(!styleTag){
      styleTag = document.createElement('style');
      styleTag.setAttribute('data-sso-style','');
      styleTag.textContent = CSS;
      mount.appendChild(styleTag);
    }

    // UI
    const t = document.createElement('template');
    t.innerHTML = UI.trim();
    const node = t.content.firstElementChild;
    mount.appendChild(node);
    // badge demo
    const demo = document.createElement('div');
    demo.className = 'demo-badge';
    demo.setAttribute('aria-hidden','true');
    demo.textContent = 'Prototype (iniettato via JS)';
    mount.appendChild(demo);

    // Normalizzazione mount
    if (mount && mount.style){
      if (!mount.style.maxWidth) mount.style.maxWidth = '760px';
      if (!mount.style.margin) mount.style.margin = '0 auto';
    }

    const root = mount.querySelector('[data-sso]');
    const loc = $('#loc', root);
    const zoneLine = $('#zoneLine', root);
    const list = $('#list', root);
    const summary = $('#summary', root);
    const badge1 = $('#badge1', root);
    const badge2 = $('#badge2', root);
    const badge3 = $('#badge3', root);
    const selectedZoneBox = $('#selectedZone', root);
    const video = $('#video', root);
    const placeholder = $('#placeholder', root);

    // iOS: forza fallback jsQR (BarcodeDetector instabile in Safari)
    const __IS_IOS__ = /iP(hone|ad|od)|iPhone|iPad|iPod/.test(navigator.userAgent);
    try{ if (__IS_IOS__ && 'BarcodeDetector' in window) window.BarcodeDetector = undefined; }catch(_){}

    // Loader jsQR
    const JSQR_URL = 'https://unpkg.com/jsqr@1.4.0/dist/jsQR.js';
    let jsqrLoaded = false;
    function ensureJsQR(){
      return new Promise((resolve)=>{
        if (jsqrLoaded){ resolve(); return; }
        const s = document.createElement('script'); s.src = JSQR_URL; s.async = true;
        s.onload = ()=>{ jsqrLoaded = true; resolve(); };
        s.onerror = ()=> resolve();
        document.head.appendChild(s);
      });
    }

    function beep(freq=1200, ms=130){
      try{
        const Ctx = window.AudioContext || window.webkitAudioContext;
        const ctx = new Ctx(); const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type='sine'; osc.frequency.value=freq;
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        osc.start(); osc.stop(ctx.currentTime + ms/1000);
      }catch(_){}
      if (navigator.vibrate) navigator.vibrate(30);
    }

    function safeJSON(s){ try{ return JSON.parse(s||''); }catch(_){ return null; } }
    const state = {
      scanning:false,
      currentZone: localStorage.getItem('mloc_text') || null,
      zoneData:  safeJSON(localStorage.getItem('zoneData')) || {},
      zoneOrder: safeJSON(localStorage.getItem('zoneOrder')) || []
    };
    function persist(){
      localStorage.setItem('zoneData', JSON.stringify(state.zoneData));
      localStorage.setItem('zoneOrder', JSON.stringify(state.zoneOrder));
      if (state.currentZone) localStorage.setItem('mloc_text', state.currentZone);
    }
    function ensureZone(z){ if (!state.zoneData[z]) state.zoneData[z] = []; if (!state.zoneOrder.includes(z)) state.zoneOrder.push(z); }
    function addNum(z,n){ ensureZone(z); const arr = state.zoneData[z]; if (!arr.includes(n)) arr.push(n); }
    function removeNum(z,n){ const arr = state.zoneData[z]; if (!arr) return; const i = arr.indexOf(n); if (i>=0) arr.splice(i,1); }
    function buildPayload(){
      const blocks=[]; for (const z of state.zoneOrder){
        const arr=(state.zoneData[z]||[]).slice().sort((a,b)=>Number(a)-Number(b));
        if(!arr.length) continue; blocks.push(['LOC|'+z, ...arr].join('\n'));
      }
      return blocks.join('\n\n');
    }

    // guida iniziale
    if (!state.currentZone) badge1.classList.add('pulse');

    function render(){
      loc.textContent = state.currentZone || 'Nessuna zona selezionata';
      zoneLine.textContent = state.currentZone || '—';

      $$('.seg .opt', root).forEach(btn=>{
        btn.classList.toggle('active', btn.dataset.zone === state.currentZone);
      });
      $$('.chip', root).forEach(ch=>{
        ch.classList.toggle('active', ch.dataset.zone === state.currentZone);
      });

      list.innerHTML = '';
      const set = (state.currentZone && state.zoneData[state.currentZone]) ? new Set(state.zoneData[state.currentZone]) : new Set();
      if (set.size){
        Array.from(set).sort((a,b)=>Number(a)-Number(b)).forEach(n=>{
          const s = document.createElement('span'); s.className='pill'; s.textContent=n; list.appendChild(s);
        });
      } else {
        const em=document.createElement('em'); em.style.opacity='.7'; em.textContent='Nessun numero'; list.appendChild(em);
      }

      const others = Object.keys(state.zoneData).filter(z=> z!==state.currentZone && state.zoneData[z] && state.zoneData[z].length);
      summary.textContent = others.length ? 'Altre zone: ' + others.map(z => `${z} (${state.zoneData[z].length})`).join(' · ') : '';

      $$('.seg-label', root).forEach(l=>l.classList.remove('active'));
      $$('.seg', root).forEach(s=>s.classList.remove('active'));
      $('#selectedZone', root).classList.toggle('active', !!state.currentZone);
      if (state.currentZone){
        if (state.currentZone.startsWith('NEGOZIO')){ $('#segNegozio', root).previousElementSibling.classList.add('active'); $('#segNegozio', root).classList.add('active'); }
        if (state.currentZone.startsWith('CAMION')){ $('#segCamion', root).previousElementSibling.classList.add('active'); $('#segCamion', root).classList.add('active'); }
      }

      persist();
    }

    function select(z){
      state.currentZone = z;
      if (!state.zoneOrder.includes(z)) state.zoneOrder.push(z);
      localStorage.setItem('mloc_text', z);
      beep(900,90);

      badge1.classList.remove('pulse'); badge1.classList.add('done');
      badge2.classList.add('pulse');
      $('#section1', root).classList.add('active');

      render();
    }

    // Scansione live
    let raf = null, last = '';
    async function startScan(){
      if (!state.currentZone){ alert('Seleziona prima la ZONA.'); return; }
      if (!isSecureContext){ alert('La fotocamera richiede HTTPS.'); return; }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){ alert('Browser non supporta getUserMedia.'); return; }
      try{
        const constraints = { video: { facingMode: { ideal: 'environment' }, width:{ideal:1280}, height:{ideal:720} } };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream; await video.play();
        video.style.display = 'block'; placeholder.style.display = 'none';
        state.scanning = true;

        badge2.classList.remove('pulse'); badge2.classList.add('done'); badge3.classList.add('pulse');
        $('#section2', root).classList.add('active');

        loop();
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
            if (res && res.length) code = res[0].rawValue;
          } else if (window.jsQR){
            if (video.videoWidth && video.videoHeight){
              canvas.width = video.videoWidth; canvas.height = video.videoHeight;
              ctx.drawImage(video,0,0,canvas.width,canvas.height);
              const img = ctx.getImageData(0,0,canvas.width,canvas.height);
              const q = window.jsQR(img.data, img.width, img.height);
              if (q) code = q.data;
            }
          }
          if (code && code !== last){ last = code; handleCode(code); setTimeout(()=>{ last=''; }, 550); }
        }catch(_){ }
        raf = requestAnimationFrame(tick);
      };
      tick();
    }

    function handleCode(raw){
      const s = (raw||'').trim();
      if (!/^\d+$/.test(s) || !state.currentZone) return; // solo numerici
      const num = String(Number(s));
      let foundIn = null;
      for (const z of Object.keys(state.zoneData)){
        if (state.zoneData[z] && state.zoneData[z].includes(num)){ foundIn = z; break; }
      }
      if (!foundIn){ addNum(state.currentZone, num); beep(1200,130); }
      else if (foundIn !== state.currentZone){ removeNum(foundIn, num); addNum(state.currentZone, num); }
      render();
    }

    // Bind controlli (UI invariata)
    $$('#segNegozio .opt, #segCamion .opt, .chip', root).forEach(btn=>{
      btn.addEventListener('click', ()=>{
        $$('.opt, .chip', root).forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        select(btn.dataset.zone);
      });
    });
    $('#useCustom', root).addEventListener('click', ()=>{
      const v = ($('#customZone', root).value||'').trim();
      if (!v){ alert('Inserisci una zona personalizzata.'); return; }
      $$('.opt, .chip', root).forEach(b=>b.classList.remove('active'));
      select(v);
    });

    $('#btnScan', root).addEventListener('click', startScan);
    $('#btnClear', root).addEventListener('click', ()=>{
      stopScan();
      state.zoneData = {}; state.zoneOrder = []; state.currentZone = null; persist();
      badge1.classList.add('pulse'); badge1.classList.remove('done');
      badge2.classList.remove('pulse','done'); badge3.classList.remove('pulse','done');
      $('#section1', root).classList.remove('active');
      $('#section2', root).classList.remove('active');
      $('#section3', root).classList.remove('active');
      video.style.display='none'; placeholder.style.display='block';
      loc.textContent = 'Nessuna zona selezionata';
      zoneLine.textContent = '—';
      $('#selectedZone', root).classList.remove('active');
      $$('.opt,.chip', root).forEach(b=>b.classList.remove('active'));
      render();
    });
    $('#btnCopy', root).addEventListener('click', async ()=>{
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
      $('#section3', root).classList.add('active');
      badge3.classList.remove('pulse'); badge3.classList.add('done');
    });

    // Ripristino da localStorage
    if (state.currentZone){
      const btn = mount.querySelector(`[data-zone="${CSS && CSS.escape ? CSS.escape(state.currentZone) : state.currentZone}"]`);
      if (btn) btn.classList.add('active');
      $('#section1', root).classList.add('active');
      badge1.classList.remove('pulse'); badge1.classList.add('done');
      badge2.classList.add('pulse');
    }
    render();
  }

  // ---------------- API pubblica ----------------
  window.SSOScanner = {
    init(mountSelector){
      let mount = (typeof mountSelector === 'string') ? document.querySelector(mountSelector) : mountSelector;
      if (!mount){
        mount = document.createElement('div');
        mount.id = 'sso-scanner-mount';
        document.body.appendChild(mount);
      }
      mount.innerHTML = ''; // clean
      mountUI(mount);
    }
  };
})();
