import {contextBridge, ipcRenderer, IpcRendererEvent} from "electron";

contextBridge.exposeInMainWorld("electron", {
	send: (channel: string, data: any) => ipcRenderer.send(channel, data),
	receive: (channel: string, func: (data: unknown) => void) => {
		ipcRenderer.on(channel, (_event: IpcRendererEvent, data: unknown) => {
			func(data);
		});
	},
});
