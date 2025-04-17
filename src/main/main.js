const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { registerIpcHandlers } = require('./ipcHandlers');

// Garder une référence globale de l'objet window
let mainWindow;

function createWindow() {
  // Créer la fenêtre du navigateur.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // Charger le fichier HTML de l'application.
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  
  // Ouvrir les DevTools en développement.
  // mainWindow.webContents.openDevTools();
  
  // Émis lorsque la fenêtre est fermée.
  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// Cette méthode sera appelée quand Electron aura fini
// de s'initialiser et sera prêt à créer des fenêtres.
app.whenReady().then(() => {
  createWindow();
  
  // Enregistrer les gestionnaires IPC
  registerIpcHandlers();
  
  app.on('activate', function () {
    // Sur macOS, il est courant de recréer une fenêtre dans l'application quand
    // l'icône du dock est cliquée et qu'il n'y a pas d'autres fenêtres ouvertes.
    if (mainWindow === null) createWindow();
  });
});

// Quitter quand toutes les fenêtres sont fermées, sauf sur macOS.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});