const { contextBridge, ipcRenderer } = require('electron');

// Exposer des API sécurisées au renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Lister les fichiers audio disponibles
  listSoundFiles: () => ipcRenderer.invoke('list-sound-files'),
  
  // Obtenir le chemin complet d'un fichier audio
  getSoundPath: (filename) => ipcRenderer.invoke('get-sound-path', filename),
  
  // Sauvegarder la configuration
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  
  // Charger la configuration
  loadConfig: () => ipcRenderer.invoke('load-config')
});