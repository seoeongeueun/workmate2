import {NextResponse} from "next/server";
import {getIronSession} from "iron-session";
import {sessionOptions} from "@/lib";
import type {SessionData, SessionExpirationResponse} from "@/types";

export async function POST(request: Request): Promise<Response> {
	try {
		const intermediateResponse = NextResponse.next();
		const session = await getIronSession<SessionData>(request, intermediateResponse, sessionOptions);
		if (session) session.destroy();

		const result = NextResponse.json({success: true, data: {}});
		const setCookie = intermediateResponse.headers.get("Set-Cookie");

		if (setCookie) {
			result.headers.set("Set-Cookie", setCookie);
		}
		return result;
	} catch (error) {
		console.log("Error logging out");
		return NextResponse.json({success: false, error: {message: "Error logging out", code: "INTERNAL"}}, {status: 500});
	}
}

//로그아웃 전까지 남은 세션 유지 시간을 반환
export async function GET(request: Request): Promise<Response> {
	const intermediate = NextResponse.next();
	const session = await getIronSession<SessionData>(request, intermediate, sessionOptions);

	if (!session.user) {
		return NextResponse.json({success: true, data: {timeLeft: 0, expired: true}});
	}

	const now = Date.now();
	const expiresAt = session.user?.expiresAt ?? now;
	console.log(session.user?.expiresAt);
	const remainingMs = Math.max(0, expiresAt - now);

	const data: SessionExpirationResponse = {
		timeLeft: remainingMs,
		expired: remainingMs <= 0,
	};

	return NextResponse.json({success: true, data});
}
