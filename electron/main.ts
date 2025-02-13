// import dotenv from "dotenv";
// import path from "path";
// import {fileURLToPath} from "url";

// // ✅ Get the correct directory path
// const __dirname = path.dirname(fileURLToPath(import.meta.url));

// // ✅ FORCE Electron to load `.env`
// dotenv.config({path: path.join(__dirname, "../.env")});

// // 🚨 Debugging: Print to ensure `MONGODB_URI` is actually loaded
// console.log("MONGODB_URI Loaded in Electron:", process.env.MONGODB_URI);

// if (!process.env.MONGODB_URI) {
// 	console.error("❌ ERROR: MONGODB_URI is still missing! Electron is NOT loading .env.");
// 	process.exit(1); // 🔥 Stop execution if .env is not loaded
// }

import {app, BrowserWindow} from "electron";
import {handleApiRequest} from "./api/index.js";
import {ipcMain} from "electron";
import path from "path";
import {fileURLToPath} from "url";

let mainWindow: BrowserWindow | null = null;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

ipcMain.on("api-request", async (event, {url, method, data}) => {
	try {
		const result = handleApiRequest(url, data);
		return {data: result};
	} catch (error) {
		return {error: error};
	}
});
