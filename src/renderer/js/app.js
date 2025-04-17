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
    
    // Exposer les instances globalement pour le débogage (à retirer en production)
    window.appSoundboard = soundboard;
    window.appUI = ui;
  });