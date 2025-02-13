import {postPlaylist, getPlaylist} from "./playlist.js";
import {postLuckyData, getLuckyData} from "./lucky.js";
import {getUserSession, loginUser, logoutUser, registerUser, getSessionTimeLeft} from "./auth.js";

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
	"/api/auth": async data => {
		if (data.method === "POST") {
			return await loginUser(data.body);
		} else if (data.method === "GET") {
			return await getUserSession();
		}
		throw new Error(`Unsupported method: ${data.method}`);
	},
	"/api/logout": async data => {
		if (data.method === "POST") {
			return await logoutUser(data.body);
		} else if (data.method === "GET") {
			return await getSessionTimeLeft();
		}
		throw new Error(`Unsupported method: ${data.method}`);
	},
	"/api/signup": async data => {
		if (data.method === "POST") {
			return await registerUser(data.body);
		}
		throw new Error(`Unsupported method: ${data.method}`);
	},
};

export async function handleApiRequest(url: string, data: any) {
	const handler = apiHandlers[url];

	// /api/playlist는 ?id=값이 붙기 때문에 별도 케이스
	if (url.includes("/api/playlist") && data.method === "GET") {
		const {searchParams} = new URL(url, "http:placeholder");
		const id = searchParams.get("id");
		data.body = {...data.body, id};

		const playlistHandler = apiHandlers["/api/playlist"];
		if (playlistHandler) return await playlistHandler(data);
	}

	if (!handler) {
		throw new Error(`Unknown API endpoint: ${url}`);
	}
	return await handler(data);
}
