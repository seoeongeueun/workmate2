import {app, BrowserWindow} from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null = null;

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 600,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js');
        },
    });

    mainWindow.loadURL('http://localhost:3000');

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
})