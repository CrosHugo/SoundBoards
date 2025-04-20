const path = require('path');
const { app } = require('electron');

// Déterminer le chemin de base selon l'environnement
const BASE_PATH = app ? (app.getPath('userData')) : 
  (process.env.APPDATA || (process.platform === 'darwin' 
    ? process.env.HOME + '/Library/Application Support' 
    : process.env.HOME + '/.local/share'));

// Configuration globale de l'application
const CONFIG = {
  // Chemins de fichiers
  SOUNDS_DIRECTORY: path.join(__dirname, '../renderer/assets/sounds'),
  
  // Types de fichiers supportés
  SUPPORTED_AUDIO_FILES: ['.mp3', '.wav', '.ogg', '.aac', '.flac'],
  
  // Couleurs prédéfinies pour les boutons
  BUTTON_COLORS: [
    '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6',
    '#1abc9c', '#e67e22', '#34495e', '#16a085', '#d35400',
    '#2980b9', '#27ae60', '#c0392b', '#d35400', '#8e44ad'
  ],
  
  // Configuration par défaut
  DEFAULT_CONFIG: {
    sounds: [],
    globalVolume: 1.0,
    categories: [],
    lastUsedCategory: null
  }
};

module.exports = { CONFIG };