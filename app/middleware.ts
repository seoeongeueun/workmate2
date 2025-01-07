import {getIronSession} from "iron-session";
import {NextResponse} from "next/server";
import {sessionOptions} from "./lib/session";

export async function middleware(req: Request) {
	const cookie = req.headers.get("cookie");

	// iron-session의 요구에 맞춰서 node.js 스타일의 req, res를 생성
	const node_res = NextResponse.next();
	const node_req = {headers: {cookie}} as any;

	const session = await getIronSession<{user?: {id: string; username: string}}>(node_req, node_res, sessionOptions);

	if (!session.user || !session.user.username) {
		node_res.headers.set("x-user-status", "unauthenticated");
	} else {
		node_res.headers.set("x-user-status", session.user.username);
	}
	return node_res;
}

export const config = {
	matcher: ["/api/:path*"],
};
