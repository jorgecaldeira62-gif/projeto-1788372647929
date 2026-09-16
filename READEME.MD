# â VOXIS v1.0
### Assistente Pessoal Inteligente com Voz

---

## ð Como usar

### 1. Estrutura de pastas
```
VOXIS/
âââ index.html
âââ css/style.css
âââ js/
â   âââ app.js
â   âââ voice.js
â   âââ brain.js
â   âââ memory.js
â   âââ supabase.js
â   âââ drive.js
âââ data/knowledge.json
âââ README.md
```

### 2. Abrir o projeto
- Abra `index.html` no **Chrome** ou **Edge**
- Permita acesso ao **microfone** quando solicitado

### 3. Usar
- Clique em **ðï¸ Falar** e comece a falar
- ApÃ³s **3 segundos de silÃªncio** o VOXIS responde
- Ou **digite** no campo de texto
- Use **ð¤ Exportar** para salvar histÃ³rico

---

## âï¸ ConfiguraÃ§Ãµes

### Supabase (banco de dados na nuvem)
1. Acesse https://supabase.com e crie um projeto
2. VÃ¡ em **SQL Editor** e execute o SQL em `js/supabase.js`
3. Copie sua **URL** e **anon key**
4. Cole em `js/supabase.js`:
```javascript
config: {
    url:    'https://xxxx.supabase.co',
    apiKey: 'eyJhbGc...'
}
```

### Google Drive (backup)
1. Acesse https://console.cloud.google.com
2. Crie um projeto e ative a **Google Drive API**
3. Crie credenciais **OAuth 2.0**
4. Cole em `js/drive.js`:
```javascript
config: {
    clientId: 'xxxx.apps.googleusercontent.com',
    apiKey:   'AIzaSy...'
}
```

---

## ð§  Como funciona

| MÃ³dulo | FunÃ§Ã£o |
|--------|--------|
| `voice.js` | TTS (1.15x/0.95 pitch) + VAD 3s |
| `brain.js` | Silogismo + Aprendizado + Doce Elogio |
| `memory.js` | HistÃ³rico + Export/Import |
| `supabase.js` | Sync na nuvem |
| `drive.js` | Backup Google Drive |

---

## ðºï¸ Roadmap

- [x] v1.0 â HTML modular funcional
- [ ] v1.1 â IntegraÃ§Ã£o Supabase ativa
- [ ] v1.2 â Google Drive ativo
- [ ] v1.3 â ElevenLabs (clonagem de voz real)
- [ ] v2.0 â APK Android (Capacitor.js)

---

## ð Notas
- Funciona melhor no **Chrome** ou **Edge**
- Requer **microfone** para reconhecimento de voz
- Todo aprendizado fica salvo no **localStorage**
