const { ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

function registerIpcHandlers() {
  // Lister les fichiers audio disponibles
  ipcMain.handle('list-sound-files', async () => {
    const soundsDir = path.join(__dirname, '../renderer/assets/sounds');
    
    try {
      // Vérifier si le dossier existe
      if (!fs.existsSync(soundsDir)) {
        fs.mkdirSync(soundsDir, { recursive: true });
        return [];
      }
      
      const files = fs.readdirSync(soundsDir);
      return files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.mp3', '.wav', '.ogg'].includes(ext);
      });
    } catch (error) {
      console.error('Erreur lors de la lecture du dossier de sons:', error);
      return [];
    }
  });
  
  // Obtenir le chemin complet d'un fichier audio
  ipcMain.handle('get-sound-path', async (event, filename) => {
    return path.join(__dirname, '../renderer/assets/sounds', filename);
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
        return { sounds: [] };
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la configuration:', error);
      return { sounds: [] };
    }
  });
}

module.exports = { registerIpcHandlers };