import type {SessionOptions} from "iron-session";
import mongoose from "mongoose";
import {MAX_AGE} from "./index";

export const sessionOptions: SessionOptions = {
	password: process.env.IRON_SESSION_PASSWORD as string,
	cookieName: "workmate-session",
	cookieOptions: {
		secure: process.env.NODE_ENV === "production",
		maxAge: MAX_AGE / 1000, //이틀
	},
};
