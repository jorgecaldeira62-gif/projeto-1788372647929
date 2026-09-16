// ============================================================
// VOXIS â drive.js
// Google Drive Backup â preparado para ativar com OAuth
// ============================================================

const DriveSync = {

    // ð§ CONFIGURE AQUI seu Client ID do Google Cloud Console
    config: {
        clientId:  'SEU_GOOGLE_CLIENT_ID_AQUI',
        apiKey:    'SUA_GOOGLE_API_KEY_AQUI',
        scope:     'https://www.googleapis.com/auth/drive.file',
        folderId:  null,   // SerÃ¡ criado automaticamente
        folderName: 'VOXIS_Backups'
    },

    isConfigured: false,
    isAuthorized: false,
    tokenClient:  null,

    // ===== INICIALIZAR =====
    init() {
        if (
            this.config.clientId !== 'SEU_GOOGLE_CLIENT_ID_AQUI' &&
            this.config.apiKey   !== 'SUA_GOOGLE_API_KEY_AQUI'
        ) {
            this.isConfigured = true;
            this.loadGoogleAPI();
        } else {
            console.log('ð¾ Drive: aguardando configuraÃ§Ã£o.');
            document.getElementById('driveStatus').textContent = 'âï¸ Config';
        }
    },

    // ===== CARREGAR GOOGLE API =====
    loadGoogleAPI() {
        // Carrega GIS (Google Identity Services)
        const scriptGIS = document.createElement('script');
        scriptGIS.src = 'https://accounts.google.com/gsi/client';
        scriptGIS.onload = () => this.initGIS();
        document.head.appendChild(scriptGIS);

        // Carrega GAPI
        const scriptGAPI = document.createElement('script');
        scriptGAPI.src = 'https://apis.google.com/js/api.js';
        scriptGAPI.onload = () => {
            gapi.load('client', () => {
                gapi.client.init({
                    apiKey:         this.config.apiKey,
                    discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest']
                });
            });
        };
        document.head.appendChild(scriptGAPI);
    },

    // ===== INICIALIZAR GIS =====
    initGIS() {
        this.tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: this.config.clientId,
            scope:     this.config.scope,
            callback:  (response) => {
                if (response.error) {
                    console.error('Erro OAuth:', response.error);
                    return;
                }
                this.isAuthorized = true;
                document.getElementById('driveStatus').textContent = 'â Ativo';
                document.getElementById('driveStatus').className   = 'badge badge-green';
                console.log('ð¾ Drive autorizado!');
            }
        });
    },

    // ===== AUTORIZAR =====
    authorize() {
        if (!this.isConfigured) {
            alert('âï¸ Configure o Google Drive em js/drive.js\n\nAcesse: https://console.cloud.google.com');
            return;
        }
        if (this.tokenClient) {
            this.tokenClient.requestAccessToken();
        }
    },

    // ===== BACKUP =====
    async backup() {
        if (!this.isConfigured) {
            alert('âï¸ Configure o Google Drive em js/drive.js\n\nPrecisa de:\nâ¢ Client ID\nâ¢ API Key\n\nAcesse: https://console.cloud.google.com');
            return;
        }

        if (!this.isAuthorized) {
            this.authorize();
            return;
        }

        try {
            App.setStatus('thinking', 'Fazendo backup...');

            const data     = Memory.getData();
            const knowledge = JSON.parse(localStorage.getItem('voxis_knowledge') || '{}');

            const backupData = {
                version:   '1.0',
                timestamp: new Date().toISOString(),
                memory:    data,
                knowledge: knowledge
            };

            const content  = JSON.stringify(backupData, null, 2);
            const filename = `VOXIS_backup_${new Date().toISOString().split('T')[0]}.json`;

            // Garante pasta no Drive
            const folderId = await this.ensureFolder();

            // Upload do arquivo
            await this.uploadFile(filename, content, folderId);

            App.addMessage('voxis', `ð¾ Backup salvo no Google Drive!\nArquivo: ${filename}`);
            App.setStatus('', 'Pronto');

        } catch(e) {
            console.error('Erro no backup:', e);
            App.addMessage('voxis', 'â Erro ao fazer backup no Drive. Tente novamente.');
            App.setStatus('', 'Pronto');
        }
    },

    // ===== GARANTIR PASTA =====
    async ensureFolder() {
        if (this.config.folderId) return this.config.folderId;

        // Busca pasta existente
        const res = await gapi.client.drive.files.list({
            q:      `name='${this.config.folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
            fields: 'files(id, name)'
        });

        if (res.result.files.length > 0) {
            this.config.folderId = res.result.files[0].id;
            return this.config.folderId;
        }

        // Cria pasta nova
        const folder = await gapi.client.drive.files.create({
            resource: {
                name:     this.config.folderName,
                mimeType: 'application/vnd.google-apps.folder'
            },
            fields: 'id'
        });

        this.config.folderId = folder.result.id;
        return this.config.folderId;
    },

    // ===== UPLOAD ARQUIVO =====
    async uploadFile(filename, content, folderId) {
        const metadata = {
            name:    filename,
            parents: folderId ? [folderId] : []
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file',     new Blob([content], { type: 'application/json' }));

        const token = gapi.auth.getToken();
        const res   = await fetch(
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
            {
                method:  'POST',
                headers: { Authorization: `Bearer ${token.access_token}` },
                body:    form
            }
        );

        if (!res.ok) throw new Error('Upload falhou: ' + res.statusText);
        return await res.json();
    },

    // ===== RESTAURAR DO DRIVE =====
    async restore() {
        if (!this.isAuthorized) {
            this.authorize();
            return;
        }

        try {
            // Lista backups disponÃ­veis
            const folderId = await this.ensureFolder();
            const res = await gapi.client.drive.files.list({
                q:       `'${folderId}' in parents and name contains 'VOXIS_backup' and trashed=false`,
                orderBy: 'createdTime desc',
                fields:  'files(id, name, createdTime)',
                pageSize: 10
            });

            const files = res.result.files;
            if (files.length === 0) {
                App.addMessage('voxis', 'ð¾ Nenhum backup encontrado no Drive.');
                return;
            }

            // Usa o mais recente
            const latest = files[0];
            const fileRes = await gapi.client.drive.files.get({
                fileId: latest.id,
                alt:    'media'
            });

            const backup = JSON.parse(fileRes.body);
            Memory.setData(backup.memory);
            if (backup.knowledge) {
                localStorage.setItem('voxis_knowledge', JSON.stringify(backup.knowledge));
            }

            App.addMessage('voxis', `â Restaurado backup de ${new Date(backup.timestamp).toLocaleString('pt-BR')}!`);

        } catch(e) {
            console.error('Erro ao restaurar:', e);
            App.addMessage('voxis', 'â Erro ao restaurar do Drive.');
        }
    }
};
