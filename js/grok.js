// ============================================================
// VOXIS â groq.js
// CÃ©rebro IA real via Groq API (gratuito + ultrarÃ¡pido)
// Substitui o brain.js bÃ¡sico por IA de verdade
// ============================================================

const GroqAI = {

  // ð§ CONFIGURE AQUI sua chave da Groq
  // Acesse: https://console.groq.com â API Keys â Create
  config: {
    apiKey: 'SUA_GROQ_API_KEY_AQUI',
    model: 'llama-3.1-8b-instant',   // RÃ¡pido e gratuito
    maxTokens: 1024,
    temperature: 0.8,
    endpoint: 'https://api.groq.com/openai/v1/chat/completions'
  },

  isConfigured: false,

  // Personalidade base do VOXIS
  systemPrompt: `VocÃª Ã© o VOXIS, um assistente pessoal inteligente e natural.

Suas caracterÃ­sticas:
- Fala em portuguÃªs brasileiro de forma natural e fluida
- Ã empÃ¡tico, curioso e perspicaz
- Aprende com o histÃ³rico da conversa
- Usa raciocÃ­nio lÃ³gico (silogismo) quando relevante
- Elogia de forma genuÃ­na, nÃ£o forÃ§ada (mÃ¡x 25% das respostas)
- Quando encontra contradiÃ§Ãµes, gera dÃºvidas em vez de afirmar
- NUNCA pergunta "posso ajudar?" repetidamente
- Respostas curtas e diretas para voz (mÃ¡x 3 frases quando possÃ­vel)
- Tem memÃ³ria das conversas anteriores

Contexto do usuÃ¡rio serÃ¡ fornecido quando disponÃ­vel.`,

  // ===== INICIALIZAR =====
  init() {
    if (this.config.apiKey !== 'SUA_GROQ_API_KEY_AQUI') {
      this.isConfigured = true;
      document.getElementById('groqStatus').textContent = 'â Ativo';
      document.getElementById('groqStatus').className = 'badge badge-green';
      console.log('ð¤ Groq AI configurado e pronto!');
    } else {
      console.log('ð¤ Groq: aguardando configuraÃ§Ã£o.');
    }
  },

  // ===== PROCESSAR COM IA =====
  async process(userText) {
    if (!this.isConfigured) {
      // Fallback para brain.js se nÃ£o configurado
      return Brain.process(userText);
    }

    try {
      // Monta contexto com histÃ³rico recente
      const messages = this.buildMessages(userText);

      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: messages,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          stream: false
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'Erro na API');
      }

      const data = await response.json();
      const answer = data.choices[0]?.message?.content?.trim();

      if (!answer) throw new Error('Resposta vazia');

      // Aprende com a interaÃ§Ã£o
      Brain.learn(userText);

      return answer;

    } catch (e) {
      console.error('Erro Groq:', e);

      // Fallback inteligente
      if (e.message.includes('401')) {
        return 'Minha chave de API parece invÃ¡lida. Verifique o arquivo groq.js.';
      }
      if (e.message.includes('429')) {
        return 'Atingi o limite por minuto. Aguarde alguns segundos e tente novamente!';
      }
      if (!navigator.onLine) {
        return Brain.process(userText) + ' (modo offline)';
      }

      return Brain.process(userText);
    }
  },

  // ===== MONTAR MENSAGENS COM CONTEXTO =====
  buildMessages(userText) {
    const messages = [];

    // System prompt base
    let systemContent = this.systemPrompt;

    // Injeta contexto do usuÃ¡rio (tÃ³picos frequentes)
    const knowledge = JSON.parse(localStorage.getItem('voxis_knowledge') || '{}');
    if (knowledge.topics && Object.keys(knowledge.topics).length > 0) {
      const topTopics = Object.entries(knowledge.topics)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([t]) => t)
        .join(', ');
      systemContent += `\n\nTÃ³picos frequentes do usuÃ¡rio: ${topTopics}.`;
    }

    // Injeta fatos aprendidos
    if (knowledge.facts && knowledge.facts.length > 0) {
      const recentFacts = knowledge.facts
        .slice(-5)
        .map(f => `â¢ ${f.text.substring(0, 100)}`)
        .join('\n');
      systemContent += `\n\nÃltimas informaÃ§Ãµes que o usuÃ¡rio compartilhou:\n${recentFacts}`;
    }

    messages.push({ role: 'system', content: systemContent });

    // HistÃ³rico recente (Ãºltimas 10 trocas = 20 mensagens)
    const history = Memory.getData().history || [];
    const recent = history.slice(-20);

    recent.forEach(msg => {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.text
      });
    });

    // Mensagem atual
    messages.push({ role: 'user', content: userText });

    return messages;
  },

  // ===== TROCAR MODELO =====
  setModel(model) {
    const models = {
      'fast': 'llama-3.1-8b-instant',    // Mais rÃ¡pido
      'smart': 'llama-3.3-70b-versatile', // Mais inteligente
      'balance': 'mixtral-8x7b-32768',      // Equilibrado
      'code': 'llama3-70b-8192'           // Bom para cÃ³digo
    };
    this.config.model = models[model] || model;
    console.log('ð¤ Modelo trocado para:', this.config.model);
  },

  // ===== MODELOS DISPONÃVEIS (GRATUITOS) =====
  availableModels: [
    { id: 'llama-3.1-8b-instant', name: 'LLaMA 3.1 8B', speed: 'â¡ Ultra', quality: 'â­â­â­' },
    { id: 'llama-3.3-70b-versatile', name: 'LLaMA 3.3 70B', speed: 'ð¢ MÃ©dio', quality: 'â­â­â­â­â­' },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', speed: 'ð RÃ¡pido', quality: 'â­â­â­â­' },
    { id: 'gemma2-9b-it', name: 'Gemma 2 9B', speed: 'ð RÃ¡pido', quality: 'â­â­â­â­' },
    { id: 'llama-3.1-70b-versatile', name: 'LLaMA 3.1 70B', speed: 'ð¢ MÃ©dio', quality: 'â­â­â­â­â­' }
  ]
};
