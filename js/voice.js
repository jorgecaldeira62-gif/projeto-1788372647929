// ============================================================
// VOXIS â voice.js
// Motor de voz: TTS (1.15x / 0.95 pitch) + VAD (3s delay)
// ============================================================

const VoiceEngine = {

  // Config
  config: {
    rate: 1.15,
    pitch: 0.95,
    volume: 1.0,
    vadDelay: 3000,   // 3 segundos de silÃªncio â processa
    lang: 'pt-BR'
  },

  // Estado
  state: {
    isListening: false,
    isPaused: false,
    isSpeaking: false,
    recognition: null,
    silenceTimer: null,
    audioCtx: null,
    analyser: null,
    animId: null,
    stream: null,
    voices: [],
    selectedVoice: null
  },

  // ===== INICIALIZAÃÃO =====
  init() {
    this.loadVoices();
    window.speechSynthesis.onvoiceschanged = () => this.loadVoices();

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('â ï¸ SpeechRecognition nÃ£o suportado neste navegador.');
      document.getElementById('btnVoice').disabled = true;
      document.getElementById('btnVoice').title = 'Use Chrome ou Edge';
    }
  },

  // ===== CARREGAR VOZES =====
  loadVoices() {
    this.state.voices = window.speechSynthesis.getVoices();
    // Prioriza voz PT-BR
    this.state.selectedVoice =
      this.state.voices.find(v => v.lang === 'pt-BR') ||
      this.state.voices.find(v => v.lang.startsWith('pt')) ||
      this.state.voices[0] || null;
  },

  // ===== TOGGLE GRAVAÃÃO =====
  toggle() {
    if (this.state.isListening) {
      this.stop();
    } else {
      this.start();
    }
  },

  // ===== INICIAR ESCUTA =====
  async start() {
    if (this.state.isSpeaking) {
      window.speechSynthesis.cancel();
    }

    try {
      // Pede permissÃ£o do microfone
      this.state.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.startVisualizer(this.state.stream);
    } catch (err) {
      alert('â PermissÃ£o de microfone negada: ' + err.message);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = this.config.lang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      this.state.isListening = true;
      this.state.isPaused = false;
      this.updateUI('recording');
      document.getElementById('vadStatus').textContent = 'ðï¸ Ouvindo...';
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      // Mostra interim no status
      if (interim) {
        document.getElementById('vadStatus').textContent = 'ð¬ ' + interim.substring(0, 40) + '...';
      }

      // Quando tem resultado final â inicia timer VAD
      if (final.trim()) {
        this.onSpeechDetected(final.trim());
      }
    };

    recognition.onerror = (e) => {
      if (e.error !== 'no-speech') {
        console.error('Erro de reconhecimento:', e.error);
      }
    };

    recognition.onend = () => {
      // Reinicia automaticamente se ainda estiver ouvindo
      if (this.state.isListening && !this.state.isPaused) {
        try { recognition.start(); } catch (e) { }
      }
    };

    recognition.start();
    this.state.recognition = recognition;
    document.getElementById('btnPause').disabled = false;
  },

  // ===== QUANDO DETECTA FALA =====
  onSpeechDetected(text) {
    // Cancela timer anterior
    if (this.state.silenceTimer) {
      clearTimeout(this.state.silenceTimer);
    }

    document.getElementById('vadStatus').textContent = `â³ Aguardando 3s...`;

    // Timer VAD â 3 segundos de silÃªncio
    this.state.silenceTimer = setTimeout(() => {
      document.getElementById('vadStatus').textContent = 'ð§  Processando...';
      this.stop();
      processUserInput(text);
    }, this.config.vadDelay);
  },

  // ===== PARAR ESCUTA =====
  stop() {
    this.state.isListening = false;

    if (this.state.recognition) {
      try { this.state.recognition.stop(); } catch (e) { }
      this.state.recognition = null;
    }

    if (this.state.silenceTimer) {
      clearTimeout(this.state.silenceTimer);
      this.state.silenceTimer = null;
    }

    if (this.state.stream) {
      this.state.stream.getTracks().forEach(t => t.stop());
      this.state.stream = null;
    }

    this.stopVisualizer();
    this.updateUI('idle');
    document.getElementById('btnPause').disabled = true;
    document.getElementById('vadStatus').textContent = 'â';
  },

  // ===== PAUSAR =====
  pause() {
    if (!this.state.isListening) return;

    if (!this.state.isPaused) {
      this.state.isPaused = true;
      try { this.state.recognition.stop(); } catch (e) { }
      document.getElementById('btnPause').textContent = 'â¶ï¸';
      document.getElementById('vadStatus').textContent = 'â¸ï¸ Pausado';
      App.setStatus('', 'Pausado');
    } else {
      this.state.isPaused = false;
      try { this.state.recognition.start(); } catch (e) { }
      document.getElementById('btnPause').textContent = 'â¸ï¸';
      document.getElementById('vadStatus').textContent = 'ðï¸ Ouvindo...';
      App.setStatus('recording', 'Gravando');
    }
  },

  // ===== TTS â FALAR =====
  speak(text, onEnd) {
    if (!text) { if (onEnd) onEnd(); return; }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Aplica voz PT-BR se disponÃ­vel
    if (this.state.selectedVoice) {
      utterance.voice = this.state.selectedVoice;
    }

    utterance.rate = this.config.rate;
    utterance.pitch = this.config.pitch;
    utterance.volume = this.config.volume;
    utterance.lang = this.config.lang;

    utterance.onstart = () => {
      this.state.isSpeaking = true;
    };

    utterance.onend = () => {
      this.state.isSpeaking = false;
      if (onEnd) onEnd();
      // ApÃ³s falar, reinicia escuta automaticamente
      setTimeout(() => {
        if (!this.state.isListening) {
          this.start();
        }
      }, 800);
    };

    utterance.onerror = () => {
      this.state.isSpeaking = false;
      if (onEnd) onEnd();
    };

    this.state.isSpeaking = true;
    window.speechSynthesis.speak(utterance);
  },

  // ===== VISUALIZADOR =====
  async startVisualizer(stream) {
    const canvas = document.getElementById('visualizer');
    const ctx = canvas.getContext('2d');
    canvas.width = canvas.offsetWidth || 300;
    canvas.height = 40;

    this.state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.state.analyser = this.state.audioCtx.createAnalyser();
    const source = this.state.audioCtx.createMediaStreamSource(stream);
    source.connect(this.state.analyser);
    this.state.analyser.fftSize = 128;

    const bufferLength = this.state.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      this.state.animId = requestAnimationFrame(draw);
      this.state.analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = 'rgba(10,10,18,0.4)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barW = (canvas.width / bufferLength) * 2;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const h = (dataArray[i] / 255) * canvas.height;
        const hue = 220 + (i / bufferLength) * 80;
        ctx.fillStyle = `hsla(${hue}, 80%, 65%, 0.9)`;
        ctx.fillRect(x, canvas.height - h, barW, h);
        x += barW + 1;
      }
    };
    draw();
  },

  stopVisualizer() {
    if (this.state.animId) {
      cancelAnimationFrame(this.state.animId);
      this.state.animId = null;
    }
    if (this.state.audioCtx) {
      this.state.audioCtx.close();
      this.state.audioCtx = null;
    }
    App.drawFlatLine();
  },

  // ===== ATUALIZAR UI =====
  updateUI(state) {
    const btn = document.getElementById('btnVoice');
    const icon = document.getElementById('btnIcon');
    const label = document.getElementById('btnLabel');

    if (state === 'recording') {
      btn.classList.add('active');
      icon.textContent = 'â¹ï¸';
      label.textContent = 'Parar';
      App.setStatus('recording', 'Gravando');
    } else {
      btn.classList.remove('active');
      icon.textContent = 'ðï¸';
      label.textContent = 'Falar';
      App.setStatus('', 'Pronto');
    }
  }
};
