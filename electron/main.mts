import {app, BrowserWindow, ipcMain} from "electron";
import {handleApiRequest} from "./api/index.js";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

let mainWindow: BrowserWindow | null = null;

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

app.whenReady().then(() => {
	mainWindow = new BrowserWindow({
		width: 800,
		height: 500,
		alwaysOnTop: true,
		icon: path.join(__dirname, "icons/icon48x48.png"),
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			preload: path.join(__dirname, "preload.mjs"),
		},
	});

	const isDev = !app.isPackaged;
	if (isDev) {
		mainWindow.loadURL("http://localhost:3000");
	} else {
		mainWindow.loadFile(path.join(__dirname, "../out/index.html"));
	}

	mainWindow.on("closed", () => {
		mainWindow = null;
	});
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("api-request", async (event, {url, method, data}) => {
	try {
		const result = await handleApiRequest(url, {method, body: data});

		return JSON.parse(JSON.stringify(result));
	} catch (error) {
		return {error: error};
	}
});
