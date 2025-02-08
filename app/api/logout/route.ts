import {NextResponse} from "next/server";
import {getIronSession} from "iron-session";
import {sessionOptions} from "@/app/lib/session";
import mongoose from "mongoose";

export async function POST(request: Request) {
	try {
		const intermediateResponse = NextResponse.next();
		const session = await getIronSession<{user?: {id: string; username: string; playlistId: mongoose.Types.ObjectId}}>(
			request,
			intermediateResponse,
			sessionOptions
		);
		if (session) session.destroy();

		const result = NextResponse.json({success: true});
		const setCookie = intermediateResponse.headers.get("Set-Cookie");

		if (setCookie) {
			result.headers.set("Set-Cookie", setCookie);
		}
		return result;
	} catch (error) {
		console.log("Error logging out");
		return NextResponse.json({error: "Error Logging out"}, {status: 500});
	}
}
