const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { registerIpcHandlers } = require('./ipcHandlers');

// Référence globale à la fenêtre principale
let mainWindow;

// Créer la fenêtre principale
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 600,
    minHeight: 400,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, '../renderer/assets/icons/app-icon.png'),
    title: 'SoundPad'
  });

  // En développement, ouvrir les DevTools
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Charger l'interface HTML
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // Lorsque la fenêtre est fermée
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Initialiser l'application
app.whenReady().then(() => {
  createWindow();
  
  // Enregistrer les gestionnaires de communication IPC
  registerIpcHandlers();
  
  // Sur macOS, recréer une fenêtre quand l'icône du dock est cliquée
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quitter quand toutes les fenêtres sont fermées (sauf sur macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});