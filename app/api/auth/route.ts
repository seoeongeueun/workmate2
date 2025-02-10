import {NextResponse} from "next/server";
import dbConnect from "@/app/lib/dbConnect";
import {User} from "@/app/models/User";
import bcrypt from "bcrypt";
import {getIronSession} from "iron-session";
import {sessionOptions, SessionData, MAX_AGE} from "@/app/lib/session";
import mongoose from "mongoose";

export async function POST(request: Request) {
	try {
		const {username, password} = (await request.json()) as {
			username: string;
			password: string;
		};

		if (!username || !password) {
			return NextResponse.json({error: "Inputs missing"}, {status: 400});
		}

		await dbConnect();

		//대소문자 무시한 동일 유저네임 찾기
		const user = await User.findOne({username: {$regex: new RegExp(`^${username}$`, "i")}}).lean();
		if (!user) {
			return NextResponse.json({error: "Username does not exist"}, {status: 401});
		}

		const isMatch = await bcrypt.compare(password, user.password);
		if (!isMatch) {
			return NextResponse.json({error: "Password does not match"}, {status: 401});
		}

		const response = NextResponse.json({success: true});
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
		return NextResponse.json({error: "Internal Server Error"}, {status: 500});
	}
}

export async function GET(request: Request) {
	const response = new Response();
	const session = await getIronSession<{user?: {id: string; username: string; playlistId: mongoose.Types.ObjectId}}>(request, response, sessionOptions);

	if (session?.user?.username && session?.user?.playlistId) {
		return NextResponse.json({isValid: true, playlistId: session.user.playlistId, username: session.user.username});
	} else {
		return NextResponse.json({isValid: false});
	}
}
