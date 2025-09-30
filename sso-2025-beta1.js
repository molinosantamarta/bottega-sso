(function(){
  // SSO Scanner Injector (UI+Logic) — beta2 (Wix‑safe, no Custom Elements/Shadow DOM)
  // API: SSOScanner.init(mountSelector)

  const $ = (root, sel) => root.querySelector(sel);
  const $$ = (root, sel) => Array.from(root.querySelectorAll(sel));

  // ---------------- CSS ----------------
  const CSS = `
    /* Mobile-first, ultra-compact */
    [data-sso] { color-scheme: dark; }
    [data-sso] :where(*) { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    [data-sso] {
      --bg:#0b0b0b; --fg:#fff; --muted:#1c1c1e; --accent:#0a84ff; --danger:#ff453a; --ok:#34c759; --chip:#1f1f22; --border:#2c2c2e;
      --radius:12px; --pad:10px; --gap:8px; --fs:15px; --fs-sm:13px; --fs-lg:16px;
      background:var(--bg); color:var(--fg); font-family:-apple-system,system-ui,Segoe UI,Roboto,sans-serif;
    }

    /* Wrapper: meno spazio su mobile; spazio extra solo se serve la bottom-bar */
    [data-sso] .wrap{ padding:8px 10px calc(64px + env(safe-area-inset-bottom)); max-width:760px; margin:0 auto; }

    /* Header compatto su mobile */
    [data-sso] header{ padding:10px 8px 8px; text-align:center; border-bottom:1px solid #222; }
    [data-sso] header h1{ margin:0; font-size:20px; font-weight:900; line-height:1.25; color:transparent; background:linear-gradient(90deg,#ff0000 0%,#ff9900 25%,#ffff00 50%,#ff9900 75%,#ff0000 100%); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; background-size:300% 100%; animation:radar-sweep 8s linear infinite; }
    [data-sso] header small{ display:block; margin-top:4px; font-size:12px; opacity:.8; }

    /* Sezioni e step */
    [data-sso] .section{ margin-top:12px; border-radius:var(--radius); padding:8px; transition:background .2s ease; background:transparent; }
    [data-sso] .section.active{ background:rgba(52,199,89,.10); }
    [data-sso] .step-title{ font-size:var(--fs-sm); opacity:.9; margin-bottom:10px; display:flex; align-items:center; gap:6px; }
    [data-sso] .step-badge{ background:#2a2a2d; color:#fff; border-radius:999px; padding:2px 7px; font-size:12px; transition:all .2s ease; }
    [data-sso] .step-badge.done{ background:var(--ok); color:#000; font-weight:800; }

    @keyframes pulse-badge { 0%,100%{ transform:translateZ(0) scale(1); box-shadow:0 0 0 0 rgba(10,132,255,.0);} 50%{ transform:translateZ(0) scale(1.06); box-shadow:0 0 0 6px rgba(10,132,255,.12);} }
    [data-sso] .step-badge.pulse{ animation:pulse-badge 1.1s ease-in-out infinite; background:linear-gradient(180deg,#0a84ff,#0569c9); }

    /* Controlli */
    [data-sso] .controls{ display:flex; flex-direction:column; gap:8px; }

    [data-sso] .btn{ padding:12px 14px; border:0; border-radius:var(--radius); font-size:var(--fs); font-weight:700; color:#fff; cursor:pointer; width:100%; }
    [data-sso] .primary{ background:var(--accent); }
    [data-sso] .ghost{ background:var(--muted); }
    [data-sso] .danger{ background:var(--danger); }

    /* Segment controls */
    [data-sso] .seg-row{ display:flex; gap:8px; align-items:center; flex-wrap:wrap; margin-bottom:8px; }
    [data-sso] .seg{ display:flex; background:#161618; border:1px solid var(--border); border-radius:999px; overflow:auto; -webkit-overflow-scrolling:touch; transition:all .2s ease; }
    [data-sso] .seg::-webkit-scrollbar{ display:none; }
    [data-sso] .seg.active{ border-color:rgba(52,199,89,.9); background:linear-gradient(180deg, rgba(52,199,89,.15), rgba(52,199,89,.05)); box-shadow:0 6px 18px rgba(52,199,89,.26), inset 0 1px 0 rgba(255,255,255,.12); }
    [data-sso] .seg .opt{ padding:8px 12px; font-size:var(--fs-sm); border:0; background:transparent; color:#fff; cursor:pointer; white-space:nowrap; transition:all .2s ease; }
    [data-sso] .seg .opt.active{ background:linear-gradient(180deg, rgba(52,199,89,1), rgba(52,199,89,.85)); color:#000; font-weight:800; box-shadow:0 6px 16px rgba(52,199,89,.42), inset 0 1px 0 rgba(255,255,255,.22); border-radius:999px; }
    [data-sso] .seg-label{ font-size:12px; opacity:.85; min-width:66px; transition:all .2s ease; }
    [data-sso] .seg-label.active{ color:var(--ok); font-weight:800; opacity:1; text-shadow:0 0 6px rgba(52,199,89,.5); }

    /* Chips */
    [data-sso] .chips{ display:flex; gap:6px; margin-top:8px; flex-wrap:wrap; }
    [data-sso] .chip{ background:#2a2a2d; color:#fff; padding:8px 10px; border-radius:999px; font-size:var(--fs-sm); border:0; cursor:pointer; white-space:nowrap; transition:all .2s ease; }
    [data-sso] .chip.active{ background:linear-gradient(180deg, rgba(52,199,89,1), rgba(52,199,89,.85)); color:#000; font-weight:800; box-shadow:0 6px 16px rgba(52,199,89,.42), inset 0 1px 0 rgba(255,255,255,.22); }

    /* Zona custom */
    [data-sso] .custom{ display:flex; gap:6px; margin-top:8px; }
    [data-sso] .custom input{ flex:1; padding:8px 12px; border-radius:999px; border:1px solid var(--border); background:#161618; color:#fff; font-size:var(--fs-sm); }
    [data-sso] .custom input::placeholder{ color:#aaa; }
    [data-sso] .custom button{ padding:10px 12px; border-radius:999px; border:0; background:var(--muted); color:#fff; font-weight:700; cursor:pointer; }

    /* Zona selezionata */
    [data-sso] .selected-zone{ margin-top:8px; padding:8px 10px; border-radius:var(--radius); background:#111; border:1px solid var(--border); display:flex; align-items:center; gap:8px; font-weight:600; transition:background .2s ease, box-shadow .2s ease, color .2s ease; }
    [data-sso] .selected-zone.active{ background:#ffd60a; color:#000; box-shadow:0 4px 12px rgba(0,0,0,.22); }
    [data-sso] .selected-dot{ width:10px; height:10px; border-radius:999px; background:var(--ok); display:inline-block; }

    /* Video e placeholder: altezze più contenute su telefoni piccoli */
    [data-sso] video{ width:100%; aspect-ratio:16/9; background:#000; border-radius:var(--radius); margin-top:8px; display:none; }
    [data-sso] .placeholder{ width:100%; aspect-ratio:16/9; border-radius:var(--radius); border:1px dashed var(--border); display:flex; align-items:center; justify-content:center; color:#aaa; margin-top:8px; text-align:center; padding:0 10px; }
    @media (max-width:380px){ [data-sso] video, [data-sso] .placeholder{ height:48vw; aspect-ratio:auto; } }
    @media (min-width:381px) and (max-width:600px){ [data-sso] video, [data-sso] .placeholder{ height:56vw; aspect-ratio:auto; } }

    /* Box risultati */
    [data-sso] .box{ border:1px solid var(--border); border-radius:var(--radius); padding:10px; background:#111; margin-top:8px; }
    [data-sso] .label{ font-size:11px; opacity:.8; margin-bottom:4px; }
    [data-sso] .zone-line{ font-size:14px; font-weight:800; margin-bottom:6px; }
    [data-sso] .list{ display:flex; flex-wrap:wrap; gap:6px; min-height:40px; }
    [data-sso] .pill{ padding:8px 10px; border-radius:999px; background:var(--chip); font-size:14px; cursor:pointer; }
    [data-sso] .summary{ margin-top:8px; font-size:11px; opacity:.8; }

    /* Inserimento manuale */
    [data-sso] .manual{ display:flex; gap:6px; margin-top:8px; }
    [data-sso] .manual input{ flex:1; padding:10px 12px; border-radius:999px; border:1px solid var(--border); background:#161618; color:#fff; font-size:16px; }

    /* Bottom bar: più bassa su mobile; safe-area gestita */
    [data-sso] .bar{ position:fixed; left:0; right:0; bottom:0; backdrop-filter:blur(6px); background:rgba(15,15,15,.96); border-top:1px solid var(--border); padding:8px 10px calc(8px + env(safe-area-inset-bottom)); display:flex; gap:8px; z-index:2147483000; }
    [data-sso] .bar .btn{ flex:1; }

    [data-sso] .demo-badge{ position:fixed; top:8px; right:8px; background:#333; color:#fff; font:12px/1 -apple-system,system-ui,Segoe UI,Roboto,sans-serif; padding:6px 8px; border-radius:8px; opacity:.8; }

    @keyframes radar-sweep{0%{background-position:0% 50%;}50%{background-position:200% 50%;}100%{background-position:0% 50%;}}

    /* Desktop enhancements */
    @media (min-width:700px){
      [data-sso] .controls{ flex-direction:row; }
      [data-sso] .btn{ width:auto; }
      [data-sso] .primary{ flex:1; }
      [data-sso] header h1{ font-size:26px; }
      [data-sso] .wrap{ padding:12px 12px calc(88px + env(safe-area-inset-bottom)); }
    }
  `;

  // ---------------- HTML ----------------
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
            <div class="manual">
              <input id="manualNum" inputmode="numeric" pattern="[0-9]*" placeholder="Aggiungi numero (solo cifre)">
              <button id="btnAddManual" class="btn ghost">Aggiungi</button>
            </div>
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

  // ---------------- Logica ----------------
  function mountUI(mount){
    let styleTag = mount.querySelector('style[data-sso-style]');
    if(!styleTag){
      styleTag = document.createElement('style');
      styleTag.setAttribute('data-sso-style','');
      styleTag.textContent = CSS;
      mount.appendChild(styleTag);
    }

    const t = document.createElement('template');
    t.innerHTML = UI.trim();
    const node = t.content.firstElementChild;
    mount.appendChild(node);

    /* demo-badge creato già nel template UI; evitato doppio inserimento su mount */

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
    const video = $('#video', root);
    const placeholder = $('#placeholder', root);

    // iOS: forza fallback jsQR (BarcodeDetector instabile in Safari)
    const __IS_IOS__ = /iP(hone|ad|od)|iPhone|iPad|iPod/.test(navigator.userAgent);
    try{ if (__IS_IOS__ && 'BarcodeDetector' in window) window.BarcodeDetector = undefined; }catch(_){/* ignore */}

    // Loader jsQR
    const JSQR_URL = 'https://unpkg.com/jsqr@1.4.0/dist/jsQR.js'; let jsqrLoaded = false; function ensureJsQR(){ return new Promise((resolve)=>{ if (jsqrLoaded){ resolve(); return; } const s = document.createElement('script'); s.src = JSQR_URL; s.async = true; s.onload = ()=>{ jsqrLoaded = true; resolve(); }; s.onerror = ()=> resolve(); document.head.appendChild(s); }); } // Reuse canvas
    const __scanCanvas = document.createElement('canvas');
    const __scanCtx = __scanCanvas.getContext('2d', { willReadFrequently: true });
        const s = document.createElement('script'); s.src = JSQR_URL; s.async = true;
        s.onload = ()=>{ jsqrLoaded = true; resolve(); };
        s.onerror = ()=> resolve();
        document.head.appendChild(s);
      });
    }

    let __audioCtx=null, __gain=null; function beep(freq=1200, ms=130){ try{ const Ctx = window.AudioContext || window.webkitAudioContext; if(!__audioCtx){ __audioCtx = new Ctx(); __gain = __audioCtx.createGain(); __gain.gain.value = 0.12; __gain.connect(__audioCtx.destination); } const osc = __audioCtx.createOscillator(); osc.type='sine'; osc.frequency.value=freq; osc.connect(__gain); osc.start(); osc.stop(__audioCtx.currentTime + ms/1000); }catch(_){} if (navigator.vibrate) navigator.vibrate(30); }catch(_){/* ignore */}
      if (navigator.vibrate) navigator.vibrate(30);
    }

    function safeJSON(s){ try{ return JSON.parse(s||''); }catch(_){ return null; } }
    const state = {
      scanning:false,
      currentZone: localStorage.getItem('mloc_text') || null,
      zoneData:  safeJSON(localStorage.getItem('zoneData')) || {},
      zoneOrder: safeJSON(localStorage.getItem('zoneOrder')) || []
    };
    let __persistTimer=null, __lastSnapshot=''; function persist(){ clearTimeout(__persistTimer); __persistTimer = setTimeout(()=>{ const snap = JSON.stringify({a:state.zoneData,b:state.zoneOrder,c:state.currentZone}); if (snap===__lastSnapshot) return; __lastSnapshot = snap; localStorage.setItem('zoneData', JSON.stringify(state.zoneData)); localStorage.setItem('zoneOrder', JSON.stringify(state.zoneOrder)); if (state.currentZone) localStorage.setItem('mloc_text', state.currentZone); }, 200); }
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
          const s = document.createElement('span'); s.className='pill'; s.textContent=n; s.title='Tocca per rimuovere';
          s.addEventListener('click', ()=>{ removeNum(state.currentZone, n); persist(); render(); });
          list.appendChild(s);
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
      if (!isSecureContext){ alert('La fotocamera richiede HTTPS. Pubblica su https:// o abilita Anteprima con HTTPS.'); return; }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){ alert('Browser non supporta getUserMedia.'); return; }
      try{
        const constraints = { video: { facingMode: { ideal: 'environment' }, width:{ideal:1280}, height:{ideal:720} } };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream; await video.play();
        video.style.display = 'block'; placeholder.style.display = 'flex'; placeholder.style.display='none';
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

      const canvas = __scanCanvas; const ctx = __scanCtx;

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
        }catch(_){ /* ignore frame errors */ }
        raf = requestAnimationFrame(tick);
      };
      tick();
    }

    function handleCode(raw){
      const s = (raw||'').trim();
      if (!/^\d+$/.test(s) || !state.currentZone) return; // solo numerici
      const num = String(Number(s)); // normalizza: "001" -> "1"
      let foundIn = null;
      for (const z of Object.keys(state.zoneData)){
        if (state.zoneData[z] && state.zoneData[z].includes(num)){ foundIn = z; break; }
      }
      if (!foundIn){ addNum(state.currentZone, num); beep(1200,130); }
      else if (foundIn !== state.currentZone){ removeNum(foundIn, num); addNum(state.currentZone, num); }
      render();
    }

    // Bind UI
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
      video.style.display='none'; placeholder.style.display='flex';
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

    // Manual add
    $('#btnAddManual', root).addEventListener('click', ()=>{
      const input = $('#manualNum', root);
      const raw = (input.value||'').trim();
      if (!/^\d+$/.test(raw)){ alert('Inserisci solo cifre.'); return; }
      if (!state.currentZone){ alert('Seleziona prima una zona.'); return; }
      const num = String(Number(raw));
      addNum(state.currentZone, num); input.value=''; render();
    });

    // Auto restore
    if (state.currentZone){
      const targetSel = `[data-zone="${(window.CSS&&CSS.escape)?CSS.escape(state.currentZone):state.currentZone}"]`;
      const btn = mount.querySelector(targetSel);
      if (btn) btn.classList.add('active');
      $('#section1', root).classList.add('active');
      badge1.classList.remove('pulse'); badge1.classList.add('done');
      badge2.classList.add('pulse');
    }

    // Cleanup on tab hide
    const __onVis = ()=>{ if (document.hidden) stopScan(); }; document.addEventListener('visibilitychange', __onVis); });

    render();
  }

  // ---------------- API ----------------
  window.SSOScanner = {
    init(mountSelector){
      let mount = (typeof mountSelector === 'string') ? document.querySelector(mountSelector) : mountSelector;
      if (!mount){ mount = document.createElement('div'); mount.id = 'sso-scanner-mount'; document.body.appendChild(mount); }
      mount.innerHTML = ''; mountUI(mount);
    },
    destroy(mountSelector){
      const mount = (typeof mountSelector === 'string') ? document.querySelector(mountSelector) : mountSelector || document.getElementById('sso-scanner-mount');
      if (!mount) return;
      try{ const video = mount.querySelector('video'); if (video && video.srcObject){ video.srcObject.getTracks().forEach(t=>t.stop()); video.srcObject=null; } }catch(_){ }
      document.removeEventListener('visibilitychange', __onVis);
      mount.innerHTML = '';
    }
  };
})();
