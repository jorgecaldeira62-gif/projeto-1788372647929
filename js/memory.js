// ============================================================
// VOXIS â memory.js
// MemÃ³ria: histÃ³rico, estatÃ­sticas, export/import
// ============================================================

const Memory = {

  storageKey: 'voxis_memory',

  // ===== INICIALIZAR =====
  init() {
    const data = this.getData();
    // Incrementa sessÃµes
    data.sessions = (data.sessions || 0) + 1;
    data.lastSeen = new Date().toISOString();
    this.setData(data);
    console.log('ð¾ Memory iniciado. SessÃ£o:', data.sessions);
  },

  // ===== OBTER DADOS =====
  getData() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : this.defaultData();
    } catch (e) {
      return this.defaultData();
    }
  },

  // ===== SALVAR DADOS =====
  setData(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (e) {
      console.warn('Erro ao salvar memÃ³ria:', e);
    }
  },

  // ===== DADOS PADRÃO =====
  defaultData() {
    return {
      interactions: 0,
      wordsLearned: 0,
      sessions: 0,
      lastSeen: null,
      history: [],
      audioLog: []
    };
  },

  // ===== SALVAR MENSAGEM =====
  saveMessage(role, text) {
    const data = this.getData();

    data.history.push({
      role,
      text,
      time: new Date().toISOString()
    });

    // Atualiza estatÃ­sticas
    data.interactions = (data.interactions || 0) + 1;

    const words = text.split(/\s+/).filter(w => w.length > 3);
    data.wordsLearned = (data.wordsLearned || 0) + words.length;

    // Limita histÃ³rico a 500 mensagens
    if (data.history.length > 500) {
      data.history = data.history.slice(-500);
    }

    this.setData(data);
  },

  // ===== EXPORTAR HISTÃRICO =====
  exportHistory() {
    const data = this.getData();

    if (!data.history || data.history.length === 0) {
      alert('â ï¸ Nenhum histÃ³rico para exportar ainda.');
      return;
    }

    // Formato TXT legÃ­vel
    let txt = `VOXIS â HistÃ³rico de Conversa\n`;
    txt += `Exportado em: ${new Date().toLocaleString('pt-BR')}\n`;
    txt += `Total de interaÃ§Ãµes: ${data.interactions}\n`;
    txt += `SessÃµes: ${data.sessions}\n`;
    txt += `${'='.repeat(50)}\n\n`;

    data.history.forEach(msg => {
      const time = new Date(msg.time).toLocaleString('pt-BR');
      const who = msg.role === 'user' ? 'ð¤ VOCÃ' : 'â VOXIS';
      txt += `[${time}] ${who}:\n${msg.text}\n\n`;
    });

    // TambÃ©m exporta JSON
    const json = JSON.stringify({
      exported: new Date().toISOString(),
      stats: {
        interactions: data.interactions,
        sessions: data.sessions,
        wordsLearned: data.wordsLearned
      },
      history: data.history
    }, null, 2);

    // Download TXT
    this.download(`VOXIS_historico_${Date.now()}.txt`, txt, 'text/plain');

    // Download JSON (para reimportar)
    setTimeout(() => {
      this.download(`VOXIS_dados_${Date.now()}.json`, json, 'application/json');
    }, 500);
  },

  // ===== IMPORTAR HISTÃRICO =====
  importHistory(jsonText) {
    try {
      const imported = JSON.parse(jsonText);
      if (!imported.history) throw new Error('Formato invÃ¡lido');

      const data = this.getData();
      // Mescla histÃ³ricos sem duplicar
      const existingTimes = new Set(data.history.map(m => m.time));
      const newMsgs = imported.history.filter(m => !existingTimes.has(m.time));

      data.history = [...data.history, ...newMsgs]
        .sort((a, b) => new Date(a.time) - new Date(b.time));

      data.interactions += imported.stats?.interactions || 0;
      data.wordsLearned += imported.stats?.wordsLearned || 0;

      this.setData(data);
      App.addMessage('voxis', `â Importei ${newMsgs.length} mensagens do histÃ³rico!`);
    } catch (e) {
      App.addMessage('voxis', 'â NÃ£o consegui ler esse arquivo. Certifique-se que Ã© um JSON do VOXIS.');
    }
  },

  // ===== LIMPAR HISTÃRICO =====
  clearHistory() {
    if (!confirm('â ï¸ Tem certeza que quer limpar o histÃ³rico de conversa?\n(O aprendizado serÃ¡ mantido)')) return;

    const data = this.getData();
    data.history = [];
    this.setData(data);

    const container = document.getElementById('chatContainer');
    container.innerHTML = `
            <div class="chat-welcome">
                <div class="welcome-icon">â</div>
                <h2>OlÃ¡! Eu sou o <strong>VOXIS</strong></h2>
                <p>HistÃ³rico limpo. Pronto para uma nova conversa!</p>
            </div>
        `;
  },

  // ===== HELPER DOWNLOAD =====
  download(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
};
