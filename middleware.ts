// proxy.ts
import {NextResponse} from "next/server";
import type {NextRequest} from "next/server";
import {sessionOptions} from "@/lib";

// 세션이 없으면 홈으로 리다리엑트
const protectedRoutes = ["/manage", "/play"];

export function middleware(req: NextRequest) {
	const {pathname} = req.nextUrl;

	// 홈은 항상 허용
	if (pathname === "/") return NextResponse.next();

	const hasSessionCookie = req.cookies.has(sessionOptions.cookieName);
	if (!hasSessionCookie) {
		return NextResponse.redirect(new URL("/", req.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/manage/:path*", "/play/:path*"],
};
