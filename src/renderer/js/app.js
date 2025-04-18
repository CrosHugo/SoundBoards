// Attendre que le DOM soit chargé
document.addEventListener('DOMContentLoaded', async () => {
    // Créer l'instance de Soundboard
    const soundboard = new Soundboard();
    
    // Initialiser la soundboard
    await soundboard.initialize();
    
    // Créer l'interface utilisateur
    const ui = new SoundboardUI(soundboard);
    
    // Afficher la soundboard
    await ui.renderSoundboard();
    
    // Initialiser les événements de la modal
    initModalEvents();
    
    // Exposer les instances globalement pour le débogage (à retirer en production)
    window.appSoundboard = soundboard;
    window.appUI = ui;
  });
  
  // Fonction pour initialiser les événements de la modal
  function initModalEvents() {
    // Gestion du bouton parcourir
    document.getElementById('browse-btn').addEventListener('click', () => {
      document.getElementById('sound-file').click();
    });
    
    // Afficher le nom du fichier sélectionné
    document.getElementById('sound-file').addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        document.getElementById('selected-file').textContent = e.target.files[0].name;
      }
    });
    
    // Gestion de l'input de raccourci clavier
    document.getElementById('sound-shortcut').addEventListener('keydown', (e) => {
      e.preventDefault();
      e.target.value = e.key;
    });
  }