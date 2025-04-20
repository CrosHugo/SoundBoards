/**
 * Classe principale de la Soundboard
 * Gère les sons, leur lecture et leur configuration
 */
class Soundboard {
  constructor() {
      this.sounds = [];              // Liste des sons disponibles
      this.activeSounds = new Map(); // Sons en cours de lecture
      this.globalVolume = 1.0;       // Volume global (0-1)
      this.isInitialized = false;    // État d'initialisation
  }

  /**
   * Initialise la soundboard et charge la configuration
   * @returns {Promise<void>}
   */
  async initialize() {
      if (this.isInitialized) return;
      
      try {
          // Charger la configuration sauvegardée
          const config = await window.electronAPI.loadConfig();
          
          // Initialiser les sons depuis la configuration
          this.sounds = Array.isArray(config.sounds) ? config.sounds : [];
          
          // Charger le volume global
          if (typeof config.globalVolume === 'number') {
              this.globalVolume = Math.max(0, Math.min(1, config.globalVolume));
          }
          
          // Si aucun son n'est configuré, essayer de charger les sons du dossier
          if (this.sounds.length === 0) {
              await this.loadSoundsFromDirectory();
          }
          
          this.isInitialized = true;
      } catch (error) {
          console.error('Erreur lors de l\'initialisation de la soundboard:', error);
          // Initialiser avec des valeurs par défaut en cas d'erreur
          this.sounds = [];
          this.globalVolume = 1.0;
          await this.loadSoundsFromDirectory();
          this.isInitialized = true;
      }
  }

  /**
   * Charge les sons à partir du répertoire par défaut
   * @returns {Promise<void>}
   */
  async loadSoundsFromDirectory() {
      try {
          const soundFiles = await window.electronAPI.listSoundFiles();
          
          this.sounds = soundFiles.map(file => ({
              id: this.generateId(),
              name: file.replace(/\.[^/.]+$/, ""), // Enlever l'extension
              file: file,
              color: this.getRandomColor(),
              icon: '🔊',
              volume: 1.0 // Volume individuel par défaut
          }));
      } catch (error) {
          console.error('Erreur lors du chargement des sons:', error);
          this.sounds = [];
      }
  }

  /**
   * Ajoute un nouveau son à la collection
   * @param {string} file - Nom du fichier
   * @param {string} name - Nom à afficher
   * @param {string} icon - Emoji/icône
   * @param {string} color - Couleur en format hex
   * @param {string} shortcut - Raccourci clavier
   * @returns {Promise<string>} - ID du son créé
   */
  async addSound(file, name, icon = '🔊', color = null, shortcut = null) {
      const id = this.generateId();
      
      this.sounds.push({
          id,
          name: name || file.replace(/\.[^/.]+$/, ""),
          file,
          color: color || this.getRandomColor(),
          icon: icon || '🔊',
          shortcut: shortcut || null,
          volume: 1.0 // Volume individuel par défaut
      });

      // Sauvegarder automatiquement la configuration
      await this.saveConfig();
      
      return id;
  }

  /**
   * Supprime un son de la collection
   * @param {string} id - ID du son à supprimer
   * @returns {boolean} - Succès de l'opération
   */
  removeSound(id) {
      const index = this.sounds.findIndex(sound => sound.id === id);
      if (index === -1) return false;
      
      // Supprimer de la liste
      this.sounds.splice(index, 1);
      
      // Arrêter le son s'il est en cours de lecture
      if (this.activeSounds.has(id)) {
          this.activeSounds.get(id).stop();
          this.activeSounds.delete(id);
      }
      
      return true;
  }

  /**
   * Joue un son par son ID
   * @param {string} id - ID du son
   * @returns {Promise<boolean>} - Succès de l'opération
   */
  async playSound(id) {
      const sound = this.getSound(id);
      if (!sound) return false;
      
      // Si le son est déjà en train de jouer, l'arrêter (comportement toggle)
      if (this.activeSounds.has(id)) {
          this.stopSound(id);
          return false;
      }
      
      try {
          // Obtenir le chemin complet du son
          const soundPath = await window.electronAPI.getSoundPath(sound.file);
          
          // Créer une nouvelle instance Howl
          const howl = new Howl({
              src: [soundPath],
              volume: this.globalVolume * (sound.volume || 1.0), // Combiner volume global et individuel
              onend: () => {
                  this.activeSounds.delete(id);
                  // Informer l'interface utilisateur que le son est terminé
                  document.dispatchEvent(new CustomEvent('soundEnded', { detail: { id } }));
              },
              onloaderror: (error) => {
                  console.error(`Erreur de chargement du son ${sound.name}:`, error);
                  this.activeSounds.delete(id);
                  document.dispatchEvent(new CustomEvent('soundError', { 
                      detail: { id, error: 'Erreur de chargement du son' } 
                  }));
              },
              onplayerror: (error) => {
                  console.error(`Erreur de lecture du son ${sound.name}:`, error);
                  this.activeSounds.delete(id);
                  document.dispatchEvent(new CustomEvent('soundError', { 
                      detail: { id, error: 'Erreur de lecture du son' } 
                  }));
              }
          });
          
          // Jouer le son
          howl.play();
          this.activeSounds.set(id, howl);
          
          // Informer l'interface utilisateur que le son a commencé
          document.dispatchEvent(new CustomEvent('soundStarted', { detail: { id } }));
          
          return true;
      } catch (error) {
          console.error(`Erreur lors de la lecture du son ${id}:`, error);
          return false;
      }
  }

  /**
   * Arrête un son en cours de lecture
   * @param {string} id - ID du son
   * @returns {boolean} - Succès de l'opération
   */
  stopSound(id) {
      if (!this.activeSounds.has(id)) return false;
      
      try {
          this.activeSounds.get(id).stop();
          this.activeSounds.delete(id);
          
          // Informer l'interface utilisateur
          document.dispatchEvent(new CustomEvent('soundEnded', { detail: { id } }));
          
          return true;
      } catch (error) {
          console.error(`Erreur lors de l'arrêt du son ${id}:`, error);
          return false;
      }
  }

  /**
   * Arrête tous les sons en cours de lecture
   * @returns {number} - Nombre de sons arrêtés
   */
  stopAllSounds() {
      let stoppedCount = 0;
      
      for (const [id, howl] of this.activeSounds) {
          try {
              howl.stop();
              document.dispatchEvent(new CustomEvent('soundEnded', { detail: { id } }));
              stoppedCount++;
          } catch (error) {
              console.error(`Erreur lors de l'arrêt du son ${id}:`, error);
          }
      }
      
      this.activeSounds.clear();
      return stoppedCount;
  }

  /**
   * Met à jour les propriétés d'un son
   * @param {string} id - ID du son
   * @param {Object} updates - Propriétés à mettre à jour
   * @returns {boolean} - Succès de l'opération
   */
  updateSound(id, updates) {
      const soundIndex = this.sounds.findIndex(s => s.id === id);
      if (soundIndex === -1) return false;
      
      // Mettre à jour les propriétés
      this.sounds[soundIndex] = {
          ...this.sounds[soundIndex],
          ...updates
      };
      
      // Si le son est en cours de lecture, mettre à jour son volume si nécessaire
      if (updates.volume !== undefined && this.activeSounds.has(id)) {
          const howl = this.activeSounds.get(id);
          howl.volume(this.globalVolume * updates.volume);
      }
      
      return true;
  }

  /**
   * Récupère tous les sons disponibles
   * @returns {Array} - Liste des sons
   */
  getSounds() {
      return [...this.sounds];
  }

  /**
   * Récupère un son par son ID
   * @param {string} id - ID du son
   * @returns {Object|null} - Détails du son ou null
   */
  getSound(id) {
      return this.sounds.find(s => s.id === id) || null;
  }

  /**
   * Définit le volume global et l'applique aux sons actifs
   * @param {number} volume - Volume (0-1)
   * @returns {number} - Volume réellement appliqué
   */
  setGlobalVolume(volume) {
      // Limiter entre 0 et 1
      this.globalVolume = Math.max(0, Math.min(1, volume));
      
      // Mettre à jour le volume de tous les sons actifs
      for (const [id, howl] of this.activeSounds.entries()) {
          const sound = this.getSound(id);
          const individualVolume = sound ? (sound.volume || 1.0) : 1.0;
          howl.volume(this.globalVolume * individualVolume);
      }
      
      // Notifier le changement
      document.dispatchEvent(new CustomEvent('volumeChanged', { 
          detail: { volume: this.globalVolume }
      }));
      
      return this.globalVolume;
  }
  
  /**
   * Récupère le volume global actuel
   * @returns {number} - Volume (0-1)
   */
  getGlobalVolume() {
      return this.globalVolume;
  }

  /**
   * Sauvegarde la configuration
   * @returns {Promise<Object>} - Résultat de la sauvegarde
   */
  async saveConfig() {
      try {
          const result = await window.electronAPI.saveConfig({ 
              sounds: this.sounds,
              globalVolume: this.globalVolume 
          });
          
          return { success: true, ...result };
      } catch (error) {
          console.error('Erreur lors de la sauvegarde de la configuration:', error);
          return { success: false, error: error.message || 'Erreur inconnue' };
      }
  }

  /**
   * Génère un ID unique pour un son
   * @returns {string} - ID généré
   */
  generateId() {
      return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }

  /**
   * Sélectionne une couleur aléatoire parmi une palette prédéfinie
   * @returns {string} - Couleur au format hex
   */
  getRandomColor() {
      const colors = [
          '#3498db', // Bleu
          '#2ecc71', // Vert
          '#e74c3c', // Rouge
          '#f39c12', // Orange
          '#9b59b6', // Violet
          '#1abc9c', // Turquoise
          '#e67e22', // Orange foncé
          '#34495e', // Bleu nuit
          '#16a085', // Vert émeraude
          '#d35400', // Orange brûlé
          '#8e44ad', // Violet foncé
          '#27ae60', // Vert émeraude foncé
          '#3498db', // Bleu clair
          '#f1c40f'  // Jaune
      ];
      
      return colors[Math.floor(Math.random() * colors.length)];
  }
}

// Exporter la classe
window.Soundboard = Soundboard;