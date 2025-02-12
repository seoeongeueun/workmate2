import {postPlaylist, getPlaylist} from "./playlist";
import {postLuckyData, getLuckyData} from "./lucky";

const apiHandlers: Record<string, (data: any) => Promise<any>> = {
	"/api/playlist": async data => {
		if (data.method === "POST") {
			return await postPlaylist(data.body);
		} else if (data.method === "GET") {
			return await getPlaylist(data.body.id);
		}
		throw new Error(`Unsupported method: ${data.method}`);
	},
	"/api/lucky": async data => {
		if (data.method === "POST") {
			return await postLuckyData(data.body);
		} else if (data.method === "GET") {
			return await getLuckyData();
		}
		throw new Error(`Unsupported method: ${data.method}`);
	},
};

export async function handleApiRequest(url: string, data: any) {
	const handler = apiHandlers[url];

	if (!handler) {
		throw new Error(`Unknown API endpoint: ${url}`);
	}

	return await handler(data);
}
