// ============================================================
// VOXIS â app.js
// InicializaÃ§Ã£o geral e funÃ§Ãµes globais da interface
// ============================================================

const App = {

    init() {
        console.log('â VOXIS v1.0 iniciando...');
        Memory.init();
        Brain.init();
        VoiceEngine.init();
        SupabaseDB.init();
        DriveSync.init();
        App.updateStats();
        App.drawFlatLine();
        console.log('â VOXIS pronto!');
    },

    // Atualiza estatÃ­sticas na sidebar
    updateStats() {
        const data = Memory.getData();
        document.getElementById('statInteractions').textContent = data.interactions || 0;
        document.getElementById('statWords').textContent = data.wordsLearned || 0;
        document.getElementById('statSessions').textContent = data.sessions || 0;
    },

    // Define status visual
    setStatus(state, label) {
        const dot   = document.getElementById('statusDot');
        const lbl   = document.getElementById('statusLabel');
        dot.className = 'status-dot ' + (state || '');
        lbl.textContent = label || 'Pronto';
    },

    // Adiciona mensagem no chat
    addMessage(role, text) {
        const container = document.getElementById('chatContainer');

        // Remove welcome se existir
        const welcome = container.querySelector('.chat-welcome');
        if (welcome) welcome.remove();

        const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const isUser = role === 'user';

        const div = document.createElement('div');
        div.className = `msg ${role}`;
        div.innerHTML = `
            <div class="msg-avatar">${isUser ? 'ð¤' : 'â'}</div>
            <div>
                <div class="msg-bubble">${text}</div>
                <div class="msg-time">${now}</div>
            </div>
        `;

        container.appendChild(div);
        container.scrollTop = container.scrollHeight;

        // Salva no histÃ³rico
        Memory.saveMessage(role, text);
        App.updateStats();
    },

    // Mostra indicador de digitaÃ§Ã£o
    showTyping() {
        const container = document.getElementById('chatContainer');
        const div = document.createElement('div');
        div.className = 'msg voxis';
        div.id = 'typingIndicator';
        div.innerHTML = `
            <div class="msg-avatar">â</div>
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    },

    // Remove indicador de digitaÃ§Ã£o
    hideTyping() {
        const el = document.getElementById('typingIndicator');
        if (el) el.remove();
    },

    // Linha plana no visualizador
    drawFlatLine() {
        const canvas = document.getElementById('visualizer');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth || 300;
        canvas.height = 40;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = 'rgba(167,139,250,0.2)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 20);
        ctx.lineTo(canvas.width, 20);
        ctx.stroke();
    }
};

// ===== FUNÃÃES GLOBAIS =====

function handleTextInput(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendText();
    }
}

function handleSendText() {
    const input = document.getElementById('textInput');
    const text  = input.value.trim();
    if (!text) return;
    input.value = '';
    processUserInput(text);
}

function processUserInput(text) {
    App.addMessage('user', text);
    App.setStatus('thinking', 'Pensando...');
    App.showTyping();

    // Brain processa e responde
    setTimeout(() => {
        const response = Brain.process(text);
        App.hideTyping();
        App.addMessage('voxis', response);
        App.setStatus('speaking', 'Falando...');
        VoiceEngine.speak(response, () => {
            App.setStatus('', 'Pronto');
        });
    }, 600);
}

function importFile() {
    document.getElementById('fileInput').click();
}

function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const content = e.target.result;
        App.addMessage('user', `ð Arquivo importado: ${file.name}`);
        processUserInput(content.substring(0, 500) + (content.length > 500 ? '...' : ''));
    };
    reader.readAsText(file);
    event.target.value = '';
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('hidden');
}

// Inicia quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => App.init());
