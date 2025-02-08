import type {SessionOptions} from "iron-session";

export const sessionOptions: SessionOptions = {
	password: process.env.IRON_SESSION_PASSWORD as string,
	cookieName: "workmate-session",
	cookieOptions: {
		secure: process.env.NODE_ENV === "production",
		//maxAge: 60 * 60 * 24 * 2, //이틀
		maxAge: 2 * 60, //테스트용 2분
	},
};
