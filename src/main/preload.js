const { contextBridge, ipcRenderer } = require('electron');

// Exposer des API sécurisées au renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Gestion des fichiers audio
  listSoundFiles: () => ipcRenderer.invoke('list-sound-files'),
  getSoundPath: (filename) => ipcRenderer.invoke('get-sound-path', filename),
  selectAudioFile: () => ipcRenderer.invoke('select-audio-file'),
  
  // Gestion de la configuration
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  loadConfig: () => ipcRenderer.invoke('load-config')
});