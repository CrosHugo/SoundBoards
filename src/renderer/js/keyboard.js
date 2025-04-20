/**
 * Gestionnaire des raccourcis clavier pour la Soundboard
 * Permet de lier des sons à des touches spécifiques du clavier
 */
class KeyboardManager {
  /**
   * Initialise le gestionnaire de clavier
   * @param {Soundboard} soundboard - L'instance Soundboard à contrôler
   */
  constructor(soundboard) {
      this.soundboard = soundboard;
      this.keyMap = new Map(); // Associe les touches aux ID de sons
      this.active = true;      // État d'activation des raccourcis
      
      // Charger les raccourcis existants
      this.initialize();
      
      // Configurer l'écouteur d'événements clavier global
      document.addEventListener('keydown', this.handleKeyPress.bind(this));
  }
  
  /**
   * Charge les raccourcis clavier depuis les données de la soundboard
   */
  initialize() {
      const sounds = this.soundboard.getSounds();
      sounds.forEach(sound => {
          if (sound.shortcut) {
              this.keyMap.set(sound.shortcut.toLowerCase(), sound.id);
          }
      });
  }
  
  /**
   * Gère les événements de touches pour jouer les sons
   * @param {KeyboardEvent} event - L'événement clavier
   */
  handleKeyPress(event) {
      // Ne pas traiter si désactivé ou si focus sur un champ de saisie
      if (!this.active || 
          event.target.tagName === 'INPUT' || 
          event.target.tagName === 'TEXTAREA' ||
          event.target.isContentEditable) {
          return;
      }
      
      // Raccourci spécial pour arrêter tous les sons (Échap)
      if (event.key === 'Escape') {
          event.preventDefault();
          this.soundboard.stopAllSounds();
          return;
      }
      
      // Normaliser la touche et vérifier si un son lui est associé
      const key = this.normalizeKey(event.key);
      if (this.keyMap.has(key)) {
          event.preventDefault();
          this.soundboard.playSound(this.keyMap.get(key));
      }
  }
  
  /**
   * Définit un raccourci clavier pour un son
   * @param {string} soundId - ID du son
   * @param {string} key - Touche à associer
   * @returns {boolean} - Succès de l'opération
   */
  setShortcut(soundId, key) {
      // Si pas de touche spécifiée, simplement retirer le raccourci existant
      if (!key) {
          this.removeShortcutForSound(soundId);
          return true;
      }
      
      const normalizedKey = this.normalizeKey(key);
      
      // Supprimer l'ancien raccourci pour ce son s'il existe
      this.removeShortcutForSound(soundId);
      
      // Vérifier si la touche est déjà utilisée et la libérer
      const existingSound = this.getSoundIdByShortcut(normalizedKey);
      if (existingSound) {
          this.removeShortcutForSound(existingSound);
      }
      
      // Ajouter le nouveau raccourci
      this.keyMap.set(normalizedKey, soundId);
      
      // Mettre à jour l'objet son directement
      const sound = this.soundboard.getSound(soundId);
      if (sound) {
          this.soundboard.updateSound(soundId, { shortcut: normalizedKey });
      }
      
      return true;
  }
  
  /**
   * Supprime le raccourci associé à un son
   * @param {string} soundId - ID du son
   */
  removeShortcutForSound(soundId) {
      for (const [key, id] of this.keyMap.entries()) {
          if (id === soundId) {
              this.keyMap.delete(key);
              break;
          }
      }
      
      // Mettre à jour l'objet son si nécessaire
      const sound = this.soundboard.getSound(soundId);
      if (sound && sound.shortcut) {
          this.soundboard.updateSound(soundId, { shortcut: null });
      }
  }
  
  /**
   * Trouve l'ID du son associé à une touche
   * @param {string} key - La touche à rechercher
   * @returns {string|null} - L'ID du son ou null
   */
  getSoundIdByShortcut(key) {
      return this.keyMap.get(this.normalizeKey(key)) || null;
  }
  
  /**
   * Normalise une touche (minuscules)
   * @param {string} key - La touche à normaliser
   * @returns {string} - La touche normalisée
   */
  normalizeKey(key) {
      return key.toLowerCase();
  }
  
  /**
   * Active les raccourcis clavier
   */
  enableKeyboardShortcuts() {
      this.active = true;
      return true;
  }
  
  /**
   * Désactive les raccourcis clavier
   */
  disableKeyboardShortcuts() {
      this.active = false;
      return false;
  }
  
  /**
   * Bascule l'état d'activation des raccourcis
   * @returns {boolean} - Nouvel état d'activation
   */
  toggleKeyboardShortcuts() {
      this.active = !this.active;
      return this.active;
  }
  
  /**
   * Sauvegarde les raccourcis vers la soundboard
   * Synchronise l'état des raccourcis avec les données de la soundboard
   */
  saveShortcutsToSoundboard() {
      const sounds = this.soundboard.getSounds();
      
      sounds.forEach(sound => {
          // Trouver le raccourci actuel pour ce son
          let currentShortcut = null;
          for (const [key, id] of this.keyMap.entries()) {
              if (id === sound.id) {
                  currentShortcut = key;
                  break;
              }
          }
          
          // Mettre à jour si nécessaire
          if (sound.shortcut !== currentShortcut) {
              this.soundboard.updateSound(sound.id, { shortcut: currentShortcut });
          }
      });
  }
}

// Exporter la classe
window.KeyboardManager = KeyboardManager;