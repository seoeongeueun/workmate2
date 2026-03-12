import type {SessionOptions} from "iron-session";
import {MAX_AGE} from "./constants";

export const sessionOptions: SessionOptions = {
	password: process.env.IRON_SESSION_PASSWORD as string,
	cookieName: "workmate-session",
	cookieOptions: {
		secure: process.env.NODE_ENV === "production",
		maxAge: MAX_AGE / 1000, //이틀
	},
};
