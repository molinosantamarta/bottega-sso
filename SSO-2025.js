// sso-logic.js — Logica fotocamera/step per il tuo HTML UI-only
(function(){
  const SSOScanner = {
    _state: {
      root: null,
      stream: null,
      video: null,
      btnScan: null,
      btnClear: null,
      btnCopy: null,
      placeholder: null,
      badge2: null,
      badge3: null
    },

    init(mountSelector){
      const root = document.querySelector(mountSelector);
      if (!root) {
        console.error('SSOScanner: container non trovato:', mountSelector);
        return;
      }
      this._state.root = root;
      this._cacheRefs();
      this._wireHandlers();
    },

    _cacheRefs(){
      const $ = (sel) => this._state.root.querySelector(sel);
      this._state.video       = $('#video');
      this._state.btnScan     = $('#btnScan');
      this._state.btnClear    = $('#btnClear');
      this._state.btnCopy     = $('#btnCopy');
      this._state.placeholder = $('#placeholder');
      this._state.badge2      = $('#badge2');
      this._state.badge3      = $('#badge3');
    },

    _wireHandlers(){
      const st = this._state;

      if (st.btnScan) {
        st.btnScan.addEventListener('click', async () => {
          try {
            await this._openCamera();
            if (st.video) st.video.style.display = 'block';
            if (st.placeholder) st.placeholder.style.display = 'none';
            if (st.badge2) { st.badge2.classList.add('done'); st.badge2.classList.remove('pulse'); }
            if (st.badge3) { st.badge3.classList.add('pulse'); }
          } catch (err) {
            console.error('Errore apertura camera:', err);
            alert(
              'Non riesco ad accedere alla fotocamera.\n' +
              '- Sito su HTTPS?\n' +
              '- Se sei in un iFrame (Wix), l’iframe ha allow="camera"?\n' +
              '- Permesso camera negato nel browser/OS?'
            );
          }
        });
      }

      if (st.btnClear) {
        st.btnClear.addEventListener('click', async () => {
          await this._stopCamera();
          if (st.video) st.video.style.display = 'none';
          if (st.placeholder) st.placeholder.style.display = 'block';
        });
      }

      if (st.btnCopy) {
        st.btnCopy.addEventListener('click', async () => {
          await this._stopCamera();
        });
      }

      window.addEventListener('pagehide', () => this._stopCamera(), { once:true });
      window.addEventListener('beforeunload', () => this._stopCamera(), { once:true });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') this._stopCamera();
      });
    },

    async _openCamera(){
      const st = this._state;

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('getUserMedia non disponibile: contesto non sicuro o iframe sandboxato');
      }

      if (st.stream) await this._stopCamera();

      const constraints = {
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
          width:  { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      if (st.video) {
        st.video.setAttribute('playsinline', '');
        st.video.setAttribute('muted', '');
        st.video.muted = true;
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      st.stream = stream;

      if (st.video) {
        st.video.srcObject = stream;
        try { await st.video.play(); } catch(_){}
      }
    },

    async _stopCamera(){
      const st = this._state;
      if (st.stream) {
        for (const tr of st.stream.getTracks()) tr.stop();
        st.stream = null;
      }
      if (st.video) {
        try { st.video.pause(); } catch(_){}
        st.video.srcObject = null;
      }
    }
  };

  window.SSOScanner = SSOScanner;
})();
