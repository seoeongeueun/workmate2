import {Conf} from "electron-conf/main";

import {SessionData} from "../../app/lib/session";

const sessionStore = new Conf<{userSession?: SessionData["user"]}>({
	name: "workmate",
	defaults: {
		userSession: undefined,
	},
});

export function saveSession(user: SessionData["user"]) {
	if (!user) return;
	sessionStore.set("userSession", user);
}

export function getSession(): SessionData["user"] | null {
	const session = sessionStore.get("userSession");
	if (!session) return null;

	if (session.expiresAt && Date.now() > session.expiresAt) {
		sessionStore.delete("userSession");
		return null;
	}

	return session;
}

export function clearSession() {
	sessionStore.delete("userSession");
}
