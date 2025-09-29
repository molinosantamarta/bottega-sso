// sso-2025-beta1.js
// Custom Element per Wix Velo: <stoccaggio-scanner></stoccaggio-scanner>

(function(){
  const JSQR_URL = 'https://unpkg.com/jsqr@1.4.0/dist/jsQR.js';
  let jsqrLoaded = false;
  function ensureJsQR(){
    return new Promise((resolve)=>{
      if (jsqrLoaded){ resolve(); return; }
      const s = document.createElement('script');
      s.src = JSQR_URL; s.async = true; s.onload = ()=>{ jsqrLoaded = true; resolve(); };
      document.head.appendChild(s);
    });
  }

  class StoccaggioScanner extends HTMLElement {
    constructor(){
      super();
      this.attachShadow({mode:'open'});
      this.scanning = false;
      this.currentZone = null;
      this.zoneData  = {};
      this.zoneOrder = [];

      this.shadowRoot.innerHTML = `
<style>
  :host { display:block; font-family:-apple-system,system-ui,Segoe UI,Roboto,sans-serif; color:#fff; }
  .root { background:#0b0b0b; }
  header { padding:14px 16px 6px; text-align:center; border-bottom:1px solid #222; }
  header h1 { margin:0; font-size:18px; font-weight:800; }
  header small { display:block; margin-top:4px; font-size:12px; opacity:.65; }

  .wrap { padding:14px 16px 100px; }
  .section { margin:14px 0 0; }
  .step-title { font-size:14px; opacity:.85; margin-bottom:10px; display:flex; align-items:center; gap:8px; }
  .step-badge { background:#2a2a2d; color:#fff; border-radius:999px; padding:2px 8px; font-size:12px; }

  .seg-row { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
  .seg { display:flex; background:#161618; border:1px solid #2c2c2e; border-radius:999px; overflow:hidden; }
  .seg .opt { padding:8px 12px; font-size:14px; border:0; background:transparent; color:#fff; cursor:pointer; }
  .seg .opt.active { background:#34c759; color:#000; }
  .seg-label { font-size:13px; opacity:.8; min-width:72px; }

  .chips { display:flex; gap:8px; margin-top:12px; }
  .chip { background:#2a2a2d; color:#fff; padding:10px 12px; border-radius:999px; font-size:14px; border:0; cursor:pointer; }
  .chip.active { background:#34c759; color:#000; }

  .custom { display:flex; gap:8px; margin-top:10px; }
  .custom input { flex:1; padding:12px 14px; border-radius:12px; border:1px solid #2c2c2e; background:#111; color:#fff; font-size:15px; }
  .custom button { padding:12px 14px; border-radius:12px; border:0; background:#1c1c1e; color:#fff; font-weight:700; cursor:pointer; }

  .selected-zone { margin-top:10px; padding:10px 12px; border-radius:12px; background:#111; border:1px solid #2c2c2e; display:flex; align-items:center; gap:8px; font-weight:600; }
  .selected-dot { width:10px; height:10px; border-radius:999px; background:#34c759; display:inline-block; }

  .controls { display:flex; gap:10px; }
  button.btn { padding:14px 16px; border:0; border-radius:12px; font-size:16px; font-weight:700; color:#fff; cursor:pointer; }
  .primary { background:#0a84ff; flex:1; }
  .ghost   { background:#1c1c1e; }
  .danger  { background:#ff453a; }

  video { width:100%; aspect-ratio:16/9; background:#000; border-radius:12px; margin-top:10px; display:none; }
  .placeholder { width:100%; aspect-ratio:16/9; border-radius:12px; border:1px dashed #2c2c2e; display:flex; align-items:center; justify-content:center; color:#aaa; margin-top:10px; text-align:center; padding:0 12px; }

  .box { border:1px solid #2c2c2e; border-radius:12px; padding:12px; background:#111; margin-top:10px; }
  .label { font-size:12px; opacity:.7; margin-bottom:4px; }
  .zone-line { font-size:15px; font-weight:700; margin-bottom:8px; }
  .list { display:flex; flex-wrap:wrap; gap:6px; min-height:44px; }
  .pill { padding:8px 12px; border-radius:999px; background:#1f1f22; font-size:15px; }
  .summary { margin-top:10px; font-size:12px; opacity:.75; }

  .bar { position:sticky; bottom:0; backdrop-filter:blur(6px); background:rgba(15,15,15,.92); border-top:1px solid #2c2c2e; padding:10px 12px; display:flex; gap:10px; margin-top:14px; }
  .bar .btn { flex:1; }
  .compatNote { font-size:12px; opacity:.7; margin-top:6px; }
</style>

<div class="root">
  <header>
    <h1>Scansione Stoccaggio Ordini</h1>
    <small>spese bottega natale 2025</small>
  </header>

  <div class="wrap">
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

    <div class="section">
      <div class="step-title"><span class="step-badge">2</span> Avvia scansione</div>
      <div class="controls">
        <button id="btnScan" class="btn primary">Avvia scansione</button>
        <button id="btnStop" class="btn ghost">Stop</button>
        <button id="btnCompat" class="btn ghost">Modalità compatibile (foto)</button>
      </div>
      <input id="fileCompat" type="file" accept="image/*" capture="environment" style="display:none">
      <div class="compatNote">Se Safari blocca la fotocamera live, usa la modalità compatibile: scatta foto e legge il codice dall’immagine.</div>
    </div>

    <div class="section">
      <div class="step-title"><span class="step-badge">3</span> Finestra di scansione</div>
      <video id="video" playsinline muted></video>
      <div id="placeholder" class="placeholder">La fotocamera comparirà qui dopo “Avvia scansione”.<br>Puoi cambiare zona in qualsiasi momento senza fermare la camera.</div>
    </div>

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

      // refs
      const $ = (sel)=> this.shadowRoot.querySelector(sel);
      this.$ = $;
      this.video = $('#video');
      this.placeholder = $('#placeholder');
      this.inputCustom = $('#customZone');
      this.btnUseCustom = $('#useCustom');
      this.btnScan = $('#btnScan');
      this.btnStop = $('#btnStop');
      this.btnCompat = $('#btnCompat');
      this.fileCompat = $('#fileCompat');
      this.btnClear = $('#btnClear');
      this.btnCopy = $('#btnCopy');

      // listeners zona
      this.shadowRoot.querySelectorAll('#segNegozio .opt').forEach(btn=>{
        btn.addEventListener('click', ()=>{ this.selectZone(btn.dataset.zone); this.toggleActive(btn, '#segNegozio .opt'); });
      });
      this.shadowRoot.querySelectorAll('#segCamion .opt').forEach(btn=>{
        btn.addEventListener('click', ()=>{ this.selectZone(btn.dataset.zone); this.toggleActive(btn, '#segCamion .opt'); });
      });
      this.shadowRoot.querySelectorAll('.chip').forEach(ch=>{
        ch.addEventListener('click', ()=>{
          this.clearActive('#segNegozio .opt'); this.clearActive('#segCamion .opt');
          this.shadowRoot.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
          ch.classList.add('active'); this.selectZone(ch.dataset.zone);
        });
      });
      this.btnUseCustom.addEventListener('click', ()=>{
        const v = (this.inputCustom.value || '').trim();
        if (!v){ this.alert('Inserisci una zona personalizzata.'); return; }
        this.clearActive('#segNegozio .opt'); this.clearActive('#segCamion .opt');
        this.shadowRoot.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
        this.selectZone(v);
      });

      // pulsanti controllo
      this.btnScan.addEventListener('click', ()=> this.startScan());
      this.btnStop.addEventListener('click', ()=> this.stopScan());
      this.shadowRoot.querySelector('#btnClear').addEventListener('click', ()=>{
        this.zoneData = {}; this.zoneOrder = []; this.persistAll(); this.updateUI();
      });
      this.btnCopy.addEventListener('click', async ()=>{
        this.stopScan();
        const payload = this.buildPayload();
        if (!payload){ this.alert('Nessuna zona con numeri scansionati.'); return; }
        try{
          await navigator.clipboard.writeText(payload);
          this.alert('Copiato negli appunti.\nApri il Google Form e incolla nel campo "Scansioni".');
        }catch(e){
          const ta = document.createElement('textarea');
          ta.value = payload; this.shadowRoot.appendChild(ta);
          ta.select(); document.execCommand('copy'); ta.remove();
          this.alert('Copiato (fallback). Incolla nel Google Form.');
        }
      });

      // compat foto
      this.btnCompat.addEventListener('click', ()=> this.fileCompat.click());
      this.fileCompat.addEventListener('change', (ev)=> this.onCompatFile(ev));

      // init storage
      this.loadStorage(); this.updateUI();
    }

    // ====== Utilities UI ======
    toggleActive(btn, groupSel){
      this.shadowRoot.querySelectorAll(groupSel).forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      this.shadowRoot.querySelectorAll('.chip').forEach(c=>c.classList.remove('active'));
    }
    clearActive(groupSel){ this.shadowRoot.querySelectorAll(groupSel).forEach(b=>b.classList.remove('active')); }
    selectZone(z){
      this.currentZone = z;
      localStorage.setItem('mloc_text', this.currentZone);
      if (!this.zoneOrder.includes(this.currentZone)) this.zoneOrder.push(this.currentZone);
      this.updateUI(); this.beep(900,90);
    }
    updateUI(){
      this.$('#loc').textContent = this.currentZone || 'Nessuna zona selezionata';
      this.shadowRoot.querySelectorAll('.seg .opt').forEach(btn=>{
        btn.classList.toggle('active', btn.dataset.zone === this.currentZone);
      });
      this.shadowRoot.querySelectorAll('.chip').forEach(ch=>{
        ch.classList.toggle('active', ch.dataset.zone === this.currentZone);
      });
      this.$('#zoneLine').textContent = this.currentZone || '—';

      const listEl = this.$('#list'); listEl.innerHTML = '';
      const set = (this.currentZone && this.zoneData[this.currentZone]) ? new Set(this.zoneData[this.currentZone]) : new Set();
      if (set.size){
        const nums = Array.from(set).sort((a,b)=>Number(a)-Number(b));
        for (const n of nums){
          const span = document.createElement('span');
          span.className = 'pill'; span.textContent = n; listEl.appendChild(span);
        }
      } else {
        const em = document.createElement('em'); em.style.opacity = '0.7'; em.textContent = 'Nessun numero'; listEl.appendChild(em);
      }

      const others = Object.keys(this.zoneData).filter(z=> z!==this.currentZone && (this.zoneData[z] && this.zoneData[z].length));
      this.$('#summary').textContent = others.length ? 'Altre zone: ' + others.map(z => `${z} (${this.zoneData[z].length})`).join(' · ') : '';

      this.persistAll();
      this.style.minHeight = this.shadowRoot.host.scrollHeight + 'px';
    }

    // ====== Storage ======
    loadStorage(){
      try { this.zoneData = JSON.parse(localStorage.getItem('zoneData')||'{}'); } catch(_){ this.zoneData={}; }
      try { this.zoneOrder = JSON.parse(localStorage.getItem('zoneOrder')||'[]'); } catch(_){ this.zoneOrder=[]; }
      this.currentZone = localStorage.getItem('mloc_text') || null;
    }
    persistAll(){
      localStorage.setItem('zoneData', JSON.stringify(this.zoneData));
      localStorage.setItem('zoneOrder', JSON.stringify(this.zoneOrder));
      if (this.currentZone) localStorage.setItem('mloc_text', this.currentZone);
    }
    ensureZone(zone){ if (!this.zoneData[zone]) this.zoneData[zone] = []; if (!this.zoneOrder.includes(zone)) this.zoneOrder.push(zone); }
    addNumberToZone(zone, num){ this.ensureZone(zone); const arr = this.zoneData[zone]; if (!arr.includes(num)) arr.push(num); }
    removeNumberFromZone(zone, num){ const arr = this.zoneData[zone]; if (!arr) return; const i = arr.indexOf(num); if (i>=0) arr.splice(i,1); }

    // ====== Audio & Feedback ======
    beep(freq=1200, ms=130){
      try{ const Ctx = window.AudioContext || window.webkitAudioContext; const ctx = new Ctx();
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination); osc.type='sine'; osc.frequency.value=freq;
        gain.gain.setValueAtTime(0.12, ctx.currentTime); osc.start(); osc.stop(ctx.currentTime + ms/1000);
      }catch(_){} if (navigator.vibrate) navigator.vibrate(30);
    }
    flash(color='#34c759'){ const el = this.shadowRoot.host; const prev = el.style.boxShadow;
      el.style.boxShadow = `inset 0 0 0 9999px ${color}26`; setTimeout(()=>{ el.style.boxShadow = prev; }, 120); }
    alert(msg){ window.alert(msg); }

    // ====== Camera live (getUserMedia) ======
    async startScan(){
      if (!this.currentZone){ this.alert('Seleziona prima la ZONA.'); return; }
      if (!isSecureContext){ this.alert('La fotocamera richiede HTTPS.'); return; }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
        this.alert('Browser non supporta getUserMedia. Usa “Modalità compatibile (foto)”.'); return;
      }
      try{
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } });
        this.video.srcObject = stream; await this.video.play();
        this.video.style.display = 'block'; this.placeholder.style.display = 'none';
        this.scanning = true; this.scanLoop();
      }catch(e){
        if (e && (e.name === 'NotAllowedError' || e.name === 'SecurityError')) this.explainDenied();
        else this.alert('Fotocamera non disponibile: ' + (e?.message || e));
      }
    }
    stopScan(){
      this.scanning = false;
      if (this.video.srcObject){ this.video.srcObject.getTracks().forEach(t=>t.stop()); }
      this.video.srcObject = null; this.video.style.display = 'none'; this.placeholder.style.display = 'flex';
    }
    explainDenied(){
      this.alert(`Safari ha bloccato la fotocamera. Consenti: aA → Impostazioni sito → Fotocamera → Consenti. In alternativa, usa “Modalità compatibile (foto)”.`);
    }

    async scanLoop(){
      await ensureJsQR();
      const hasBD = 'BarcodeDetector' in window;
      let detector = null;
      if (hasBD){ try { detector = new BarcodeDetector({ formats: ['qr_code','code_128','ean_13'] }); } catch(_) { detector = null; } }
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      let last = '';

      const tick = async ()=>{
        if (!this.video.srcObject) return;
        if (!this.scanning){ requestAnimationFrame(tick); return; }
        try{
          let code = null;
          if (detector){
            const res = await detector.detect(this.video);
            if (res.length) code = res[0].rawValue;
          } else {
            canvas.width = this.video.videoWidth; canvas.height = this.video.videoHeight;
            ctx.drawImage(this.video,0,0,canvas.width,canvas.height);
            const img = ctx.getImageData(0,0,canvas.width,canvas.height);
            const q = window.jsQR ? window.jsQR(img.data, img.width, img.height) : null;
            if (q) code = q.data;
          }
          if (code && code !== last){
            last = code; this.handleScannedCode(code);
            setTimeout(()=>{ last=''; }, 550);
          }
        }catch(_){}
        requestAnimationFrame(tick);
      };
      tick();
    }

    // ====== Modalità compatibile (foto) ======
    async onCompatFile(ev){
      await ensureJsQR();
      const file = ev.target.files && ev.target.files[0];
      if (!file) return;
      if (!this.currentZone){ this.alert('Seleziona prima la ZONA.'); return; }
      const img = new Image();
      img.onload = ()=>{
        const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
        const maxW = 1600, scale = Math.min(1, maxW / img.width);
        canvas.width = Math.floor(img.width * scale); canvas.height = Math.floor(img.height * scale);
        ctx.drawImage(img,0,0,canvas.width,canvas.height);
        const data = ctx.getImageData(0,0,canvas.width,canvas.height);
        const qr = window.jsQR ? window.jsQR(data.data, data.width, data.height) : null;
        let code = qr ? qr.data : null;
        if (code){ this.handleScannedCode(code); } else { this.alert('Non riesco a leggere il codice dalla foto.'); }
        ev.target.value = '';
      };
      img.onerror = ()=> this.alert('Immagine non valida.');
      img.src = URL.createObjectURL(file);
    }

    // ====== Gestione codice letto ======
    handleScannedCode(raw){
      const s = (raw || '').trim();
      if (/^\d+$/.test(s) && this.currentZone){
        const num = String(Number(s));
        let foundIn = null;
        for (const z of Object.keys(this.zoneData)){
          if (this.zoneData[z] && this.zoneData[z].includes(num)) { foundIn = z; break; }
        }
        if (!foundIn){
          this.addNumberToZone(this.currentZone, num);
          this.updateUI(); this.beep(1200,130); this.flash('#34c759');
        } else if (foundIn === this.currentZone){
          this.flash('#777');
        } else {
          this.removeNumberFromZone(foundIn, num);
          this.addNumberToZone(this.currentZone, num);
          this.updateUI(); this.flash('#0a84ff');
        }
      }
    }

    // ====== Output ======
    buildPayload(){
      const blocks = [];
      for (const z of this.zoneOrder){
        const arr = (this.zoneData[z] || []).slice().sort((a,b)=>Number(a)-Number(b));
        if (!arr.length) continue;
        blocks.push(['LOC|' + z, ...arr].join('\n'));
      }
      return blocks.join('\n\n');
    }

    connectedCallback(){
      const $ = this.$.bind(this);
      $('#btnScan').addEventListener('click', ()=> this.startScan());
      $('#btnStop').addEventListener('click', ()=> this.stopScan());
    }

  } // class

  // registra il custom element
  if (!customElements.get('stoccaggio-scanner')){
    customElements.define('stoccaggio-scanner', StoccaggioScanner);
  }
})();
