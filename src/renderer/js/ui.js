class SoundboardUI {
  constructor(soundboard) {
    this.soundboard = soundboard;
    this.editMode = false;
    this.container = document.getElementById('soundboard-container');
    this.configPanel = document.getElementById('config-panel');
    this.keyboardManager = null; // Sera initialisé après chargement des sons
    
    this.initEventListeners();
    this.initVolumeControl();
  }

  initEventListeners() {
    // Boutons du header
    document.getElementById('add-sound-btn').addEventListener('click', () => this.showAddSoundDialog());
    document.getElementById('edit-mode-btn').addEventListener('click', () => this.toggleEditMode());
    document.getElementById('keyboard-btn').addEventListener('click', () => this.toggleKeyboardShortcuts());
    document.getElementById('stop-all-btn').addEventListener('click', () => this.stopAllSounds());
    
    // Boutons du panneau de configuration
    document.getElementById('save-config-btn').addEventListener('click', () => this.saveConfiguration());
    document.getElementById('close-config-btn').addEventListener('click', () => this.toggleConfigPanel(false));
    
    // Événements pour les sons
    document.addEventListener('soundStarted', (e) => this.updateSoundButtonState(e.detail.id, true));
    document.addEventListener('soundEnded', (e) => this.updateSoundButtonState(e.detail.id, false));
    document.addEventListener('volumeChanged', (e) => this.updateVolumeDisplay(e.detail.volume));
    document.addEventListener('soundStarted', (e) => {
        this.updateSoundButtonState(e.detail.id, true);
        this.updateStopButtonState();
      });
    
    // Initialiser la gestion des raccourcis clavier
    const keyboardShortcutInput = document.getElementById('sound-shortcut');
    if (keyboardShortcutInput) {
      keyboardShortcutInput.addEventListener('keydown', (e) => {
        e.preventDefault();
        keyboardShortcutInput.value = e.key;
      });
    }
  }

  initVolumeControl() {
    const volumeSlider = document.getElementById('volume-slider');
    const volumeDisplay = document.getElementById('volume-display');
    
    if (volumeSlider) {
      // Définir la valeur initiale
      const initialVolume = this.soundboard.getGlobalVolume();
      volumeSlider.value = initialVolume * 100;
      volumeDisplay.textContent = `${Math.round(initialVolume * 100)}%`;
      
      // Mettre à jour la couleur de fond du slider pour refléter la valeur actuelle
      this.updateSliderBackground(volumeSlider);
      
      // Ajouter un écouteur d'événement pour les changements
      volumeSlider.addEventListener('input', (e) => {
        const newVolume = parseFloat(e.target.value) / 100;
        this.soundboard.setGlobalVolume(newVolume);
        volumeDisplay.textContent = `${Math.round(newVolume * 100)}%`;
        
        // Mettre à jour l'apparence du slider
        this.updateSliderBackground(volumeSlider);
      });
    }
  }
  
  updateVolumeDisplay(volume) {
    const volumeSlider = document.getElementById('volume-slider');
    const volumeDisplay = document.getElementById('volume-display');
    
    if (volumeSlider && volumeDisplay) {
      volumeSlider.value = volume * 100;
      volumeDisplay.textContent = `${Math.round(volume * 100)}%`;
      this.updateSliderBackground(volumeSlider);
    }
  }
  
  updateSliderBackground(slider) {
    // Mettre à jour le fond du slider pour refléter visuellement la valeur
    const percent = slider.value;
    slider.style.background = `linear-gradient(to right, var(--primary-color) 0%, var(--primary-color) ${percent}%, #ddd ${percent}%)`;
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
    
    // Initialiser le gestionnaire de clavier après le chargement des sons
    if (!this.keyboardManager) {
      this.keyboardManager = new KeyboardManager(this.soundboard);
    } else {
      this.keyboardManager.initialize();
    }
  }

  createSoundButton(sound) {
    const button = document.createElement('div');
    button.className = 'sound-button';
    button.setAttribute('data-id', sound.id);
    button.style.backgroundColor = sound.color + '20'; // Avec transparence
    button.style.borderColor = sound.color;
    
    // Ajouter l'affichage du raccourci s'il existe
    const shortcutDisplay = sound.shortcut ? `<div class="shortcut">${sound.shortcut}</div>` : '';
    
    button.innerHTML = `
      <div class="icon">${sound.icon}</div>
      <div class="label">${sound.name}</div>
      ${shortcutDisplay}
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

  // Remplacer la boîte de dialogue simple par notre modal
  showAddSoundDialog() {
    // Afficher la modal
    const modal = document.getElementById('sound-modal');
    modal.classList.remove('hidden');
    
    // Configurer la modal pour l'ajout
    document.getElementById('modal-title').textContent = "Ajouter un son";
    
    // Réinitialiser le formulaire
    const form = document.getElementById('sound-form');
    form.reset();
    
    // Configurer les boutons
    document.getElementById('save-sound').onclick = () => {
      // Récupérer les valeurs du formulaire
      const file = document.getElementById('selected-file').textContent;
      const name = document.getElementById('sound-name').value;
      const icon = document.getElementById('sound-icon').value || '🔊';
      const color = document.getElementById('sound-color').value;
      const shortcut = document.getElementById('sound-shortcut').value;
      
      if (file && name) {
        this.soundboard.addSound(file, name, icon, color, shortcut).then(() => {
          this.renderSoundboard();
          this.soundboard.saveConfig();
          modal.classList.add('hidden');
        });
      }
    };
    
    document.getElementById('cancel-sound').onclick = () => {
      modal.classList.add('hidden');
    };
    
    document.querySelector('.close-modal').onclick = () => {
      modal.classList.add('hidden');
    };
  }

  showEditSoundDialog(id) {
    const sound = this.soundboard.getSounds().find(s => s.id === id);
    if (!sound) return;
    
    // Afficher la modal
    const modal = document.getElementById('sound-modal');
    modal.classList.remove('hidden');
    
    // Configurer la modal pour l'édition
    document.getElementById('modal-title').textContent = "Modifier un son";
    
    // Pré-remplir le formulaire
    document.getElementById('selected-file').textContent = sound.file;
    document.getElementById('sound-name').value = sound.name;
    document.getElementById('sound-icon').value = sound.icon;
    document.getElementById('sound-color').value = sound.color || '#3498db';
    document.getElementById('sound-shortcut').value = sound.shortcut || '';
    
    // Configurer les boutons
    document.getElementById('save-sound').onclick = () => {
      const name = document.getElementById('sound-name').value;
      const icon = document.getElementById('sound-icon').value;
      const color = document.getElementById('sound-color').value;
      const shortcut = document.getElementById('sound-shortcut').value;
      
      this.soundboard.updateSound(id, {
        name: name,
        icon: icon,
        color: color,
        shortcut: shortcut
      });
      
      // Mettre à jour le raccourci clavier
      if (this.keyboardManager) {
        this.keyboardManager.setShortcut(id, shortcut);
      }
      
      this.renderSoundboard();
      this.soundboard.saveConfig();
      modal.classList.add('hidden');
    };
    
    document.getElementById('cancel-sound').onclick = () => {
      modal.classList.add('hidden');
    };
    
    document.querySelector('.close-modal').onclick = () => {
      modal.classList.add('hidden');
    };
  }

  deleteSound(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce son ?')) {
      // Supprimer le raccourci associé
      if (this.keyboardManager) {
        this.keyboardManager.removeShortcutForSound(id);
      }
      
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

  toggleKeyboardShortcuts() {
    if (this.keyboardManager) {
      const isEnabled = this.keyboardManager.toggleKeyboardShortcuts();
      
      // Mettre à jour le texte du bouton pour refléter l'état
      const keyboardBtn = document.getElementById('keyboard-btn');
      keyboardBtn.textContent = isEnabled ? 'Désactiver raccourcis' : 'Activer raccourcis';
      
      // Afficher un message pour informer l'utilisateur
      alert(isEnabled ? 'Les raccourcis clavier sont activés.' : 'Les raccourcis clavier sont désactivés.');
    }
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
  
  stopAllSounds() {
    this.soundboard.stopAllSounds();
    this.updateStopButtonState();
  }
  
  updateStopButtonState() {
    const stopButton = document.getElementById('stop-all-btn');
    if (!stopButton) return;
    
    // Vérifier s'il y a des sons en cours de lecture
    const activeSoundsCount = this.soundboard.activeSounds.size;
    
    if (activeSoundsCount > 0) {
      stopButton.classList.add('active');
    } else {
      stopButton.classList.remove('active');
    }
  }
}

// Exporter la classe pour l'utiliser dans d'autres fichiers
window.SoundboardUI = SoundboardUI;