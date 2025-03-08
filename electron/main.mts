import {app, BrowserWindow, ipcMain} from "electron";
import {handleApiRequest} from "./api/index.js";
import path from "path";
import {loadEncryptedEnv} from "./lib/decrypt-env.js";
import dbConnect from "./api/dbConnect.js";
import {fileURLToPath} from "url";
import express from "express";
import getPort from "get-port";

let mainWindow: BrowserWindow | null = null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//gpu 제한
app.disableHardwareAcceleration();

app.whenReady().then(() => {
	// env 먼저 복호화 후 윈도우 생성
	loadEncryptedEnv();

	mainWindow = new BrowserWindow({
		width: 800,
		height: 500,
		alwaysOnTop: true,
		icon: path.join(__dirname, "icons/icon48x48.png"),
		webPreferences: {
			nodeIntegration: false,
			contextIsolation: true,
			sandbox: false,
			preload: path.join(__dirname, "preload.cjs"),
		},
	});

	const isDev = !app.isPackaged;
	if (isDev) {
		mainWindow.loadURL("http://localhost:3000");
	} else {
		//단순 index.html를 사용할 경우 file://에서 동영상 임베드 제한이 걸려 express로 실행
		const server = express();
		const outPath = path.join(__dirname, "../out");
		server.use(express.static(outPath));

		(async () => {
			// 3000, 3001, 3002 순으로 가능한 포트 찾기
			const port = await getPort({port: [3000, 3001, 3002]});

			server.listen(port, () => {
				console.log(`Running on port ${port}`);
				if (mainWindow) {
					mainWindow.loadURL(`http://localhost:${port}`);
				}
			});
		})();
	}

	dbConnect()
		.then(() => console.log("Mongoose connected"))
		.catch(err => console.error("DB connect error", err));

	mainWindow.on("closed", () => {
		mainWindow = null;
	});
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("api-request", async (event, {url, method, data}) => {
	try {
		if (url.includes("/api/always-on-top") && method === "POST" && mainWindow) {
			mainWindow.setAlwaysOnTop(data.alwaysOnTop);
			return {success: true};
		} else {
			const result = await handleApiRequest(url, {method, body: data});

			return JSON.parse(JSON.stringify(result));
		}
	} catch (error) {
		return {error: error};
	}
});
