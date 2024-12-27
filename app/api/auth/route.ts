import {NextResponse} from "next/server";
import dbConnect from "@/app/lib/dbConnect";
import {User} from "@/app/models/User";
import bcrypt from "bcrypt";
import {getIronSession} from "iron-session";
import {sessionOptions} from "@/app/lib/session";

export async function POST(request: Request, response: Response) {
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
		const session = await getIronSession<{user?: {id: string; username: string}}>(request, response, sessionOptions);

		session.user = {
			id: user._id.toString(),
			username: user.username,
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
	const session = await getIronSession<{user?: {id: string; username: string}}>(request, response, sessionOptions);

	if (session?.user) {
		return NextResponse.json({isValid: true});
	} else {
		return NextResponse.json({isValid: false});
	}
}
