// ============================================================
// VOXIS â brain.js
// CÃ©rebro: Silogismo + Aprendizado + Doce Elogio + DinÃ¢mica
// ============================================================

const Brain = {

  // Base de conhecimento acumulada
  knowledge: {
    facts: [],   // Fatos aprendidos
    patterns: {},   // PadrÃµes de escrita do usuÃ¡rio
    topics: {},   // TÃ³picos frequentes
    mood: 'neutro'
  },

  // Regras de Silogismo
  syllogismRules: [
    {
      if: (text) => text.includes('sempre') || text.includes('todo'),
      then: (text) => Brain.applySyllogism(text, 'universal')
    },
    {
      if: (text) => text.includes('nunca') || text.includes('nenhum'),
      then: (text) => Brain.applySyllogism(text, 'negativo')
    },
    {
      if: (text) => text.includes('Ã s vezes') || text.includes('talvez'),
      then: (text) => Brain.applySyllogism(text, 'particular')
    }
  ],

  // PadrÃµes de resposta natural
  responsePatterns: {
    greeting: [
      'OlÃ¡! Que bom te ouvir.',
      'Oi! Estou aqui.',
      'OlÃ¡! Como posso te ajudar hoje?'
    ],
    agreement: [
      'Faz sentido o que vocÃª disse.',
      'Entendo sua perspectiva.',
      'Concordo com esse ponto de vista.'
    ],
    doubt: [
      'Hmm, isso me faz pensar... hÃ¡ uma contradiÃ§Ã£o interessante aÃ­.',
      'Curioso â isso vai contra o que aprendi antes. Pode me explicar melhor?',
      'Interessante. Tenho uma dÃºvida sobre isso...'
    ],
    praise: [
      'Que ideia incrÃ­vel!',
      'VocÃª tem uma forma muito clara de pensar.',
      'Gostei muito dessa perspectiva.'
    ],
    continuity: [
      'Quer continuar explorando esse assunto?',
      'Tem mais alguma coisa que queira compartilhar?'
    ]
  },

  // ===== INICIALIZAÃÃO =====
  init() {
    const saved = localStorage.getItem('voxis_knowledge');
    if (saved) {
      try {
        this.knowledge = JSON.parse(saved);
      } catch (e) {
        console.warn('Erro ao carregar conhecimento:', e);
      }
    }
    console.log('ð§  Brain iniciado. Fatos conhecidos:', this.knowledge.facts.length);
  },

  // ===== PROCESSAR INPUT =====
  process(text) {
    const lower = text.toLowerCase().trim();

    // Aprende com o input
    this.learn(text);

    // 1. Verifica saudaÃ§Ãµes
    if (this.isGreeting(lower)) {
      return this.respond('greeting') + ' ' + this.getContextualOpener();
    }

    // 2. Verifica contradiÃ§Ãµes (Doce Elogio + DÃºvida)
    const contradiction = this.checkContradiction(text);
    if (contradiction) {
      return this.respond('doubt') + ' ' + contradiction;
    }

    // 3. Aplica silogismo se aplicÃ¡vel
    const syllogism = this.trySyllogism(lower);
    if (syllogism) {
      return syllogism;
    }

    // 4. Verifica se Ã© pergunta
    if (lower.includes('?') || lower.startsWith('o que') || lower.startsWith('como') || lower.startsWith('por que')) {
      return this.answerQuestion(text);
    }

    // 5. Resposta contextual com aprendizado
    return this.contextualResponse(text);
  },

  // ===== APRENDER =====
  learn(text) {
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 3);

    // Aprende palavras novas
    words.forEach(word => {
      if (!this.knowledge.patterns[word]) {
        this.knowledge.patterns[word] = 0;
      }
      this.knowledge.patterns[word]++;
    });

    // Extrai fatos (frases declarativas)
    if (!text.includes('?') && text.length > 20) {
      if (this.knowledge.facts.length < 200) {
        this.knowledge.facts.push({
          text: text,
          time: new Date().toISOString(),
          weight: 1
        });
      }
    }

    // Identifica tÃ³picos frequentes
    const topics = ['trabalho', 'famÃ­lia', 'saÃºde', 'estudo', 'projeto', 'ideia', 'problema', 'sonho'];
    topics.forEach(topic => {
      if (text.toLowerCase().includes(topic)) {
        this.knowledge.topics[topic] = (this.knowledge.topics[topic] || 0) + 1;
      }
    });

    // Salva
    this.save();
  },

  // ===== VERIFICAR CONTRADIÃÃO =====
  checkContradiction(text) {
    const lower = text.toLowerCase();
    for (const fact of this.knowledge.facts.slice(-20)) {
      const factLower = fact.text.toLowerCase();
      // Detecta negaÃ§Ã£o de algo jÃ¡ dito
      if (
        (lower.includes('nÃ£o') && factLower.includes(lower.replace('nÃ£o ', '').substring(0, 20))) ||
        (lower.includes('nunca') && factLower.includes('sempre')) ||
        (lower.includes('sempre') && factLower.includes('nunca'))
      ) {
        return `Antes vocÃª mencionou: "${fact.text.substring(0, 60)}..." â isso parece diferente do que vocÃª disse agora.`;
      }
    }
    return null;
  },

  // ===== SILOGISMO =====
  trySyllogism(text) {
    for (const rule of this.syllogismRules) {
      if (rule.if(text)) {
        return rule.then(text);
      }
    }
    return null;
  },

  applySyllogism(text, type) {
    const templates = {
      universal: `Entendo â vocÃª estÃ¡ estabelecendo uma regra geral. Se isso Ã© sempre verdade, entÃ£o podemos concluir que casos especÃ­ficos tambÃ©m seguem essa lÃ³gica. ${this.respond('agreement')}`,
      negativo: `Interessante ponto. Se isso nunca acontece, entÃ£o o oposto deve ser considerado. Isso me leva a pensar nas exceÃ§Ãµes... ${this.respond('doubt')}`,
      particular: `VocÃª levanta uma possibilidade. Quando algo "Ã s vezes" acontece, vale explorar em quais condiÃ§Ãµes isso ocorre. ${this.respond('agreement')}`
    };
    return templates[type] || this.contextualResponse(text);
  },

  // ===== RESPONDER PERGUNTA =====
  answerQuestion(text) {
    const lower = text.toLowerCase();

    // Busca na base de conhecimento
    const relevant = this.knowledge.facts.filter(f =>
      f.text.toLowerCase().split(' ').some(w => lower.includes(w) && w.length > 4)
    );

    if (relevant.length > 0) {
      const fact = relevant[relevant.length - 1];
      return `Com base no que conversamos, lembro que vocÃª mencionou: "${fact.text.substring(0, 80)}". Isso pode ser relevante para sua pergunta. O que vocÃª acha?`;
    }

    // Resposta criativa baseada em tÃ³pico frequente
    const topTopic = this.getTopTopic();
    if (topTopic && lower.includes(topTopic)) {
      return `VocÃª costuma falar bastante sobre ${topTopic}. Posso perceber que Ã© algo importante para vocÃª. Me conta mais sobre essa questÃ£o especÃ­fica?`;
    }

    return `Essa Ã© uma pergunta interessante. Ainda estou aprendendo sobre isso com vocÃª. Me conta mais â assim consigo te ajudar melhor.`;
  },

  // ===== RESPOSTA CONTEXTUAL =====
  contextualResponse(text) {
    const topTopic = this.getTopTopic();
    const hasPraise = Math.random() < 0.25; // 25% de chance de elogio

    let response = '';

    // Doce elogio ocasional (natural, nÃ£o forÃ§ado)
    if (hasPraise) {
      response += this.respond('praise') + ' ';
    }

    // Resposta baseada no tÃ³pico mais frequente
    if (topTopic) {
      response += `Percebo que ${topTopic} Ã© algo que aparece bastante nas nossas conversas. `;
    }

    // Adiciona reflexÃ£o
    response += this.generateReflection(text);

    return response;
  },

  // ===== GERAR REFLEXÃO =====
  generateReflection(text) {
    const reflections = [
      `O que vocÃª acabou de compartilhar me parece importante. Como isso te afeta no dia a dia?`,
      `Entendo. Isso faz parte de algo maior que vocÃª estÃ¡ construindo?`,
      `Interessante perspectiva. VocÃª chegou a essa conclusÃ£o como?`,
      `Isso que vocÃª disse guarda uma lÃ³gica interessante. Quer explorar mais?`,
      `Faz sentido. E como vocÃª se sente em relaÃ§Ã£o a isso?`
    ];
    return reflections[Math.floor(Math.random() * reflections.length)];
  },

  // ===== HELPERS =====
  isGreeting(text) {
    const greetings = ['olÃ¡', 'oi', 'bom dia', 'boa tarde', 'boa noite', 'hey', 'e aÃ­'];
    return greetings.some(g => text.startsWith(g));
  },

  respond(type) {
    const arr = this.responsePatterns[type];
    return arr[Math.floor(Math.random() * arr.length)];
  },

  getContextualOpener() {
    const topTopic = this.getTopTopic();
    if (topTopic) return `Quer continuar de onde paramos sobre ${topTopic}?`;
    return 'O que vocÃª tem em mente?';
  },

  getTopTopic() {
    const topics = this.knowledge.topics;
    if (Object.keys(topics).length === 0) return null;
    return Object.entries(topics).sort((a, b) => b[1] - a[1])[0][0];
  },

  save() {
    try {
      localStorage.setItem('voxis_knowledge', JSON.stringify(this.knowledge));
    } catch (e) { }
  }
};
