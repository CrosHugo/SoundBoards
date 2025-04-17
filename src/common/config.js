// Ce fichier peut contenir des constantes partagées entre le main et le renderer
const path = require('path');

const CONFIG = {
  // Dossier des sons par défaut
  SOUNDS_DIRECTORY: path.join(__dirname, '../renderer/assets/sounds'),
  
  // Types de fichiers audio supportés
  SUPPORTED_AUDIO_FILES: ['.mp3', '.wav', '.ogg'],
  
  // Configuration par défaut
  DEFAULT_CONFIG: {
    sounds: []
  }
};

module.exports = CONFIG;