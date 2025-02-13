import {contextBridge, ipcRenderer, IpcRendererEvent} from "electron";

export {};

contextBridge.exposeInMainWorld("electron", {
	send: (channel: string, data: any) => ipcRenderer.send(channel, data),
	receive: (channel: string, func: (data: unknown) => void) => {
		ipcRenderer.on(channel, (_event: IpcRendererEvent, data: unknown) => {
			func(data);
		});
	},
});

// const {contextBridge, ipcRenderer} = require("electron");

// contextBridge.exposeInMainWorld("electron", {
// 	send: (channel, data) => ipcRenderer.send(channel, data),
// 	receive: (channel, func) => ipcRenderer.on(channel, (_event, data) => func(data)),
// });
