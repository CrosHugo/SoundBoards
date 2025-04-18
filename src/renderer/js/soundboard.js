// Importation de Howler depuis un CDN ou via webpack si configuré
// Dans cet exemple, nous supposons que Howler est chargé via un script dans index.html

class Soundboard {
  constructor() {
    this.sounds = [];
    this.activeSounds = new Map();
    this.globalVolume = 1.0; // Volume global par défaut (entre 0 et 1)
  }

  async initialize() {
    // Charger la configuration sauvegardée
    const config = await window.electronAPI.loadConfig();
    this.sounds = config.sounds || [];
    
    // Charger le volume global s'il existe
    if (config.globalVolume !== undefined) {
      this.globalVolume = config.globalVolume;
    }
    
    // Initialiser les sons
    await this.initializeSounds();
  }

  async initializeSounds() {
    // Si aucun son n'est configuré, essayer de charger les sons du dossier
    if (this.sounds.length === 0) {
      const soundFiles = await window.electronAPI.listSoundFiles();
      
      this.sounds = soundFiles.map(file => {
        return {
          id: this.generateId(),
          name: file.replace(/\.[^/.]+$/, ""), // Enlever l'extension
          file: file,
          color: this.getRandomColor(),
          icon: '🔊'
        };
      });
    }
  }

  async addSound(file, name, icon = '🔊', color = null) {
    const id = this.generateId();
    
    this.sounds.push({
      id,
      name: name || file.replace(/\.[^/.]+$/, ""),
      file,
      color: color || this.getRandomColor(),
      icon: icon
    });
    
    return id;
  }

  removeSound(id) {
    const index = this.sounds.findIndex(sound => sound.id === id);
    if (index !== -1) {
      this.sounds.splice(index, 1);
      
      // Si le son est en train de jouer, l'arrêter
      if (this.activeSounds.has(id)) {
        this.activeSounds.get(id).stop();
        this.activeSounds.delete(id);
      }
    }
  }

  async playSound(id) {
    const sound = this.sounds.find(s => s.id === id);
    if (!sound) return;
    
    // Si le son est déjà en train de jouer, l'arrêter
    if (this.activeSounds.has(id)) {
      this.activeSounds.get(id).stop();
      this.activeSounds.delete(id);
      return false;
    }
    
    // Créer une nouvelle instance Howl
    const howl = new Howl({
      src: [await window.electronAPI.getSoundPath(sound.file)],
      volume: this.globalVolume, // Appliquer le volume global
      onend: () => {
        this.activeSounds.delete(id);
        document.dispatchEvent(new CustomEvent('soundEnded', { detail: { id } }));
      }
    });
    
    // Jouer le son
    howl.play();
    this.activeSounds.set(id, howl);
    
    // Déclencher un événement pour informer l'UI
    document.dispatchEvent(new CustomEvent('soundStarted', { detail: { id } }));
    
    return true;
  }

  stopSound(id) {
    if (this.activeSounds.has(id)) {
      this.activeSounds.get(id).stop();
      this.activeSounds.delete(id);
      document.dispatchEvent(new CustomEvent('soundEnded', { detail: { id } }));
    }
  }

  stopAllSounds() {
    for (const [id, sound] of this.activeSounds) {
      sound.stop();
      document.dispatchEvent(new CustomEvent('soundEnded', { detail: { id } }));
    }
    this.activeSounds.clear();
  }

  updateSound(id, updates) {
    const soundIndex = this.sounds.findIndex(s => s.id === id);
    if (soundIndex !== -1) {
      this.sounds[soundIndex] = {
        ...this.sounds[soundIndex],
        ...updates
      };
    }
  }

  getSounds() {
    return this.sounds;
  }

  // Gestion du volume global
  setGlobalVolume(volume) {
    // Limiter le volume entre 0 et 1
    this.globalVolume = Math.max(0, Math.min(1, volume));
    
    // Mettre à jour le volume de tous les sons actifs
    for (const sound of this.activeSounds.values()) {
      sound.volume(this.globalVolume);
    }
    
    // Déclencher un événement pour informer l'UI
    document.dispatchEvent(new CustomEvent('volumeChanged', { detail: { volume: this.globalVolume } }));
    
    return this.globalVolume;
  }
  
  getGlobalVolume() {
    return this.globalVolume;
  }

  async saveConfig() {
    return await window.electronAPI.saveConfig({ 
      sounds: this.sounds,
      globalVolume: this.globalVolume 
    });
  }

  // Fonctions utilitaires
  generateId() {
    return Math.random().toString(36).substring(2, 9);
  }

  getRandomColor() {
    const colors = [
      '#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6',
      '#1abc9c', '#e67e22', '#34495e', '#16a085', '#d35400'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}

// Exportation de la classe pour l'utiliser dans d'autres fichiers
window.Soundboard = Soundboard;