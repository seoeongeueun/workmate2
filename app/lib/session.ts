import type {SessionOptions} from "iron-session";
import mongoose from "mongoose";

export const MAX_AGE = 1 * 24 * 60 * 60 * 1000; //하루
//export const MAX_AGE = 2 * 60 * 1000; //테스트용 2분

export interface SessionData {
	user?: {
		id: string;
		username: string;
		playlistId: mongoose.Types.ObjectId;
		expiresAt?: number;
	};
}

export const sessionOptions: SessionOptions = {
	password: process.env.IRON_SESSION_PASSWORD as string,
	cookieName: "workmate-session",
	cookieOptions: {
		secure: process.env.NODE_ENV === "production",
		maxAge: MAX_AGE / 1000, //이틀
	},
};
