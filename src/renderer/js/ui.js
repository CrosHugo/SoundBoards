class SoundboardUI {
    constructor(soundboard) {
      this.soundboard = soundboard;
      this.editMode = false;
      this.container = document.getElementById('soundboard-container');
      this.configPanel = document.getElementById('config-panel');
      
      this.initEventListeners();
    }
  
    initEventListeners() {
      // Boutons du header
      document.getElementById('add-sound-btn').addEventListener('click', () => this.showAddSoundDialog());
      document.getElementById('edit-mode-btn').addEventListener('click', () => this.toggleEditMode());
      
      // Boutons du panneau de configuration
      document.getElementById('save-config-btn').addEventListener('click', () => this.saveConfiguration());
      document.getElementById('close-config-btn').addEventListener('click', () => this.toggleConfigPanel(false));
      
      // Événements pour les sons
      document.addEventListener('soundStarted', (e) => this.updateSoundButtonState(e.detail.id, true));
      document.addEventListener('soundEnded', (e) => this.updateSoundButtonState(e.detail.id, false));
    }
  
    async renderSoundboard() {
      // Vider le conteneur
      this.container.innerHTML = '';
      
      // Créer un bouton pour chaque son
      const sounds = this.soundboard.getSounds();
      
      if (sounds.length === 0) {
        this.container.innerHTML = `
          <div class="empty-state">
            <p>Aucun son trouvé. Ajoutez des sons pour commencer.</p>
            <button id="add-first-sound-btn">Ajouter un son</button>
          </div>
        `;
        
        document.getElementById('add-first-sound-btn').addEventListener('click', () => this.showAddSoundDialog());
        return;
      }
      
      sounds.forEach(sound => {
        const soundButton = this.createSoundButton(sound);
        this.container.appendChild(soundButton);
      });
    }
  
    createSoundButton(sound) {
      const button = document.createElement('div');
      button.className = 'sound-button';
      button.setAttribute('data-id', sound.id);
      button.style.backgroundColor = sound.color + '20'; // Avec transparence
      button.style.borderColor = sound.color;
      
      button.innerHTML = `
        <div class="icon">${sound.icon}</div>
        <div class="label">${sound.name}</div>
      `;
      
      // Ajouter les contrôles d'édition (cachés par défaut)
      const editOverlay = document.createElement('div');
      editOverlay.className = 'edit-overlay';
      editOverlay.innerHTML = `
        <button class="edit-btn">✏️</button>
        <button class="delete-btn">🗑️</button>
      `;
      
      if (this.editMode) {
        editOverlay.style.display = 'flex';
      } else {
        editOverlay.style.display = 'none';
      }
      
      button.appendChild(editOverlay);
      
      // Ajouter les gestionnaires d'événements
      button.addEventListener('click', (e) => {
        if (!this.editMode && !e.target.closest('.edit-overlay')) {
          this.soundboard.playSound(sound.id);
        }
      });
      
      // Événements pour les boutons d'édition
      const editBtn = editOverlay.querySelector('.edit-btn');
      const deleteBtn = editOverlay.querySelector('.delete-btn');
      
      editBtn.addEventListener('click', () => this.showEditSoundDialog(sound.id));
      deleteBtn.addEventListener('click', () => this.deleteSound(sound.id));
      
      return button;
    }
  
    updateSoundButtonState(id, isPlaying) {
      const button = this.container.querySelector(`[data-id="${id}"]`);
      if (button) {
        if (isPlaying) {
          button.classList.add('playing');
        } else {
          button.classList.remove('playing');
        }
      }
    }
  
    showAddSoundDialog() {
      // Dans une vraie application, on utiliserait une boîte de dialogue plus sophistiquée
      const fileName = prompt('Nom du fichier son (dans le dossier /assets/sounds/):');
      if (!fileName) return;
      
      const displayName = prompt('Nom à afficher sur le bouton:');
      const icon = prompt('Icône (emoji ou caractère):') || '🔊';
      
      this.soundboard.addSound(fileName, displayName, icon).then(() => {
        this.renderSoundboard();
        this.soundboard.saveConfig();
      });
    }
  
    showEditSoundDialog(id) {
      const sound = this.soundboard.getSounds().find(s => s.id === id);
      if (!sound) return;
      
      const displayName = prompt('Nom à afficher sur le bouton:', sound.name);
      if (displayName === null) return; // L'utilisateur a annulé
      
      const icon = prompt('Icône (emoji ou caractère):', sound.icon);
      if (icon === null) return;
      
      this.soundboard.updateSound(id, {
        name: displayName,
        icon: icon
      });
      
      this.renderSoundboard();
      this.soundboard.saveConfig();
    }
  
    deleteSound(id) {
      if (confirm('Êtes-vous sûr de vouloir supprimer ce son ?')) {
        this.soundboard.removeSound(id);
        this.renderSoundboard();
        this.soundboard.saveConfig();
      }
    }
  
    toggleEditMode() {
      this.editMode = !this.editMode;
      
      // Mettre à jour le bouton
      const editBtn = document.getElementById('edit-mode-btn');
      editBtn.textContent = this.editMode ? 'Mode lecture' : 'Mode édition';
      
      // Mettre à jour l'affichage des overlays d'édition
      const editOverlays = document.querySelectorAll('.edit-overlay');
      editOverlays.forEach(overlay => {
        overlay.style.display = this.editMode ? 'flex' : 'none';
      });
    }
  
    toggleConfigPanel(show = null) {
      const shouldShow = show !== null ? show : this.configPanel.classList.contains('hidden');
      
      if (shouldShow) {
        this.configPanel.classList.remove('hidden');
      } else {
        this.configPanel.classList.add('hidden');
      }
    }
    
    async saveConfiguration() {
      const result = await this.soundboard.saveConfig();
      if (result.success) {
        alert('Configuration sauvegardée avec succès !');
      } else {
        alert('Erreur lors de la sauvegarde: ' + (result.error || 'Erreur inconnue'));
      }
    }
  }
  
  // Exporter la classe pour l'utiliser dans d'autres fichiers
  window.SoundboardUI = SoundboardUI;