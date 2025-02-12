import {app, BrowserWindow, ipcMain} from "electron";
import path from "path";
import {handleApiRequest} from "./api";

let mainWindow: BrowserWindow | null = null;

app.whenReady().then(() => {
	mainWindow = new BrowserWindow({
		width: 1000,
		height: 600,
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			preload: path.join(__dirname, "preload.js"),
		},
	});

	mainWindow.loadURL("http://localhost:3000");

	mainWindow.on("closed", () => {
		mainWindow = null;
	});
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});

ipcMain.on("api-request", async (event, {url, method, data}) => {
	try {
		const result = handleApiRequest(url, data);
		return {data: result};
	} catch (error) {
		return {error: error};
	}
});
