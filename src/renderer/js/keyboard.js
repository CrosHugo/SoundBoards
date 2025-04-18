class KeyboardManager {
    constructor(soundboard) {
      this.soundboard = soundboard;
      this.keyMap = new Map(); // Map des touches aux ID de son
      this.active = true;
      
      // Initialiser les raccourcis à partir des données du soundboard
      this.initialize();
      
      // Ajouter l'écouteur d'événements clavier global
      document.addEventListener('keydown', this.handleKeyPress.bind(this));
    }
    
    initialize() {
      // Charger les raccourcis à partir des sons existants
      const sounds = this.soundboard.getSounds();
      sounds.forEach(sound => {
        if (sound.shortcut) {
          this.keyMap.set(sound.shortcut.toLowerCase(), sound.id);
        }
      });
    }
    
    handleKeyPress(event) {
      // Ne pas traiter si désactivé ou si une zone de texte est active
      if (!this.active || event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }
      
      // Raccourci spécial pour arrêter tous les sons (Échap)
      if (event.key === 'Escape') {
        event.preventDefault();
        this.soundboard.stopAllSounds();
        return;
      }
      
      // Convertir la touche en format standard
      const key = this.normalizeKey(event.key);
      
      // Si un son est associé à cette touche, le jouer
      if (this.keyMap.has(key)) {
        event.preventDefault(); // Empêcher le comportement par défaut
        this.soundboard.playSound(this.keyMap.get(key));
      }
    }
    
    setShortcut(soundId, key) {
      // Supprimer l'ancien raccourci s'il existe
      this.removeShortcutForSound(soundId);
      
      if (key) {
        const normalizedKey = this.normalizeKey(key);
        
        // Vérifier si la touche est déjà utilisée
        const existingSound = this.getSoundIdByShortcut(normalizedKey);
        if (existingSound) {
          // Supprimer l'ancien mapping
          this.removeShortcutForSound(existingSound);
        }
        
        // Ajouter le nouveau raccourci
        this.keyMap.set(normalizedKey, soundId);
        
        // Mettre à jour l'objet son
        const sounds = this.soundboard.getSounds();
        const sound = sounds.find(s => s.id === soundId);
        if (sound) {
          sound.shortcut = normalizedKey;
          this.soundboard.updateSound(soundId, { shortcut: normalizedKey });
        }
      }
    }
    
    removeShortcutForSound(soundId) {
      // Trouver et supprimer tout raccourci existant pour ce son
      for (const [key, id] of this.keyMap.entries()) {
        if (id === soundId) {
          this.keyMap.delete(key);
          break;
        }
      }
    }
    
    getSoundIdByShortcut(key) {
      // Trouver l'ID du son associé à cette touche
      return this.keyMap.get(this.normalizeKey(key));
    }
    
    normalizeKey(key) {
      // Normaliser la touche pour éviter les problèmes de casse/format
      return key.toLowerCase();
    }
    
    enableKeyboardShortcuts() {
      this.active = true;
    }
    
    disableKeyboardShortcuts() {
      this.active = false;
    }
    
    toggleKeyboardShortcuts() {
      this.active = !this.active;
      return this.active;
    }
    
    saveShortcutsToSoundboard() {
      // Mettre à jour les sons avec leurs raccourcis actuels
      const sounds = this.soundboard.getSounds();
      sounds.forEach(sound => {
        // Trouver le raccourci actuel pour ce son (s'il existe)
        let currentShortcut = null;
        for (const [key, id] of this.keyMap.entries()) {
          if (id === sound.id) {
            currentShortcut = key;
            break;
          }
        }
        
        // Mettre à jour le son si nécessaire
        if (sound.shortcut !== currentShortcut) {
          this.soundboard.updateSound(sound.id, { shortcut: currentShortcut });
        }
      });
    }
}
  
// Exporter la classe pour l'utiliser dans d'autres fichiers
window.KeyboardManager = KeyboardManager;