const { ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const { CONFIG } = require('../common/config');

function registerIpcHandlers() {
  // Lister les fichiers audio disponibles
  ipcMain.handle('list-sound-files', async () => {
    try {
      // S'assurer que le répertoire existe
      if (!fs.existsSync(CONFIG.SOUNDS_DIRECTORY)) {
        fs.mkdirSync(CONFIG.SOUNDS_DIRECTORY, { recursive: true });
        return [];
      }
      
      const files = fs.readdirSync(CONFIG.SOUNDS_DIRECTORY);
      return files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return CONFIG.SUPPORTED_AUDIO_FILES.includes(ext);
      });
    } catch (error) {
      console.error('Erreur lors de la lecture du dossier des sons:', error);
      return [];
    }
  });
  
  // Obtenir le chemin complet d'un fichier audio
  ipcMain.handle('get-sound-path', async (event, filename) => {
    return path.join(CONFIG.SOUNDS_DIRECTORY, filename);
  });
  
  // Sélectionner un fichier audio à importer
  ipcMain.handle('select-audio-file', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [
        { name: 'Fichiers audio', extensions: CONFIG.SUPPORTED_AUDIO_FILES.map(ext => ext.slice(1)) }
      ]
    });
    
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    
    const filePath = result.filePaths[0];
    const filename = path.basename(filePath);
    
    // Copier le fichier dans le dossier des sons
    try {
      const targetPath = path.join(CONFIG.SOUNDS_DIRECTORY, filename);
      fs.copyFileSync(filePath, targetPath);
      return filename;
    } catch (error) {
      console.error('Erreur lors de la copie du fichier:', error);
      return null;
    }
  });
  
  // Sauvegarder la configuration
  ipcMain.handle('save-config', async (event, config) => {
    const configPath = path.join(__dirname, '../common/config.json');
    
    try {
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la configuration:', error);
      return { success: false, error: error.message };
    }
  });
  
  // Charger la configuration
  ipcMain.handle('load-config', async () => {
    const configPath = path.join(__dirname, '../common/config.json');
    
    try {
      if (fs.existsSync(configPath)) {
        const configData = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(configData);
      } else {
        return CONFIG.DEFAULT_CONFIG;
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la configuration:', error);
      return CONFIG.DEFAULT_CONFIG;
    }
  });
}

module.exports = { registerIpcHandlers };