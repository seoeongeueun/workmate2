import {NextResponse} from "next/server";
import {User} from "@//models";
import bcrypt from "bcrypt";
import {getIronSession} from "iron-session";
import type {SessionData, SessionInfo} from "@/types";
import {sessionOptions, MAX_AGE} from "@/lib";
import {dbConnect} from "@/providers/dbConnect";
import mongoose from "mongoose";

export async function POST(request: Request): Promise<Response> {
	try {
		const {username, password} = (await request.json()) as {
			username: string;
			password: string;
		};

		if (!username || !password) {
			return NextResponse.json({success: false, error: {message: "Inputs missing", code: "MISSING_INPUT"}}, {status: 400});
		}

		await dbConnect();

		//대소문자 무시한 동일 유저네임 찾기
		const user = await User.findOne({username: {$regex: new RegExp(`^${username}$`, "i")}}).lean();
		if (!user) {
			return NextResponse.json({success: false, error: {message: "Username does not exist", code: "USER_NOT_FOUND"}}, {status: 401});
		}

		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return NextResponse.json({success: false, error: {message: "Password does not match", code: "PASSWORD_MISMATCH"}}, {status: 401});
		}

		const response = NextResponse.json({success: true, data: {}});
		const session = await getIronSession<SessionData>(request, response, sessionOptions);

		session.user = {
			id: user._id.toString(),
			username: user.username,
			playlistId: user.playlistIds[0],
			expiresAt: Date.now() + MAX_AGE,
		};

		await session.save();

		return response;
	} catch (error: any) {
		console.error("Login error:", error);
		return NextResponse.json({success: false, error: {message: "Internal server error", code: "INTERNAL"}}, {status: 500});
	}
}

export async function GET(request: Request): Promise<Response> {
	const response = new Response();
	const session: SessionData = await getIronSession<{user?: {id: string; username: string; playlistId: mongoose.Types.ObjectId}}>(
		request,
		response,
		sessionOptions
	);

	let data: SessionInfo = {isValid: false};
	if (session?.user?.username && session.user?.playlistId) {
		data = {
			isValid: true,
			playlistId: session.user.playlistId,
			username: session.user.username,
			userId: session.user.id,
		};
	}

	return NextResponse.json({success: true, data});
}
