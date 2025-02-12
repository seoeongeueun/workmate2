export interface ElectronAPI {
	send: (channel: string, data: unknown) => void;
	receive: (channel: string, func: (data: unknown) => void) => void;
	invoke: (channel: string, data: unknown) => Promise<any>;
}

declare global {
	interface Window {
		electron: ElectronAPI;
	}
}
