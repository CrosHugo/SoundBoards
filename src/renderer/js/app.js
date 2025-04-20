/**
 * Point d'entrée principal de l'application Soundboard
 * Initialise les composants et configure l'interface utilisateur
 */
document.addEventListener('DOMContentLoaded', async () => {
  // Créer et initialiser l'instance de Soundboard
  const soundboard = new Soundboard();
  await soundboard.initialize();
  
  // Créer et configurer l'interface utilisateur
  const ui = new SoundboardUI(soundboard);
  await ui.renderSoundboard();
  
  // Initialiser les événements du formulaire modal
  initModalEvents();
  
  // Exposer les instances pour le débogage (à retirer en production)
  if (process.env.NODE_ENV !== 'production') {
      window.appSoundboard = soundboard;
      window.appUI = ui;
  }
});

/**
* Initialise les événements associés à la modal d'ajout/édition de son
*/
function initModalEvents() {
  // Gestion du bouton parcourir pour sélectionner un fichier
  const browseBtn = document.getElementById('browse-btn');
  browseBtn?.addEventListener('click', () => {
      document.getElementById('sound-file').click();
  });
  
  // Afficher le nom du fichier sélectionné
  const soundFileInput = document.getElementById('sound-file');
  soundFileInput?.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
          document.getElementById('selected-file').textContent = e.target.files[0].name;
      }
  });
  
  // Configuraton de l'input de raccourci clavier
  const shortcutInput = document.getElementById('sound-shortcut');
  shortcutInput?.addEventListener('keydown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Ignorer les touches de modification seules
      if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
          return;
      }
      
      // Enregistrer la touche
      e.target.value = e.key;
  });
}