import {NextResponse} from "next/server";
import {dbConnect} from "@/providers/dbConnect";
import {Lucky} from "@/models";
import {getIronSession} from "iron-session";
import {sessionOptions} from "@/lib/session";
import {SessionData} from "@/types/session";

// 별도 인증 필요 없이 lucky 트랙 리스트를 반환하는 API
export async function GET() {
	try {
		await dbConnect();
		const luckyData = await Lucky.findOne();
		if (!luckyData) {
			return NextResponse.json({success: false, error: {message: "No data found", code: "NOT_FOUND"}}, {status: 404});
		}

		return NextResponse.json({success: true, data: luckyData});
	} catch (error) {
		console.error("Error fetching data:", error);
		return NextResponse.json({success: false, error: {message: "Server Error", code: "INTERNAL"}}, {status: 500});
	}
}

// manage에서만 사용되는 API로, lucky 트랙 리스트에서 특정 트랙을 제거하는 기능을 담당
export async function POST(request: Request): Promise<Response> {
	try {
		const session = await getIronSession<SessionData>(request, new Response(), sessionOptions);

		if (!session.user?.id) {
			return NextResponse.json({success: false, error: {message: "Unauthorized", code: "UNAUTHORIZED"}}, {status: 401});
		}

		await dbConnect();
		const {categoryKey, unavailableVideos} = await request.json();

		if (!categoryKey || !Array.isArray(unavailableVideos) || unavailableVideos.length === 0) {
			return NextResponse.json({success: false, error: {message: "Invalid parameters", code: "INVALID_PARAMS"}}, {status: 400});
		}

		const updatedDoc = await Lucky.findOneAndUpdate({}, {$pullAll: {[categoryKey]: unavailableVideos.map(url => url.trim())}}, {new: true});

		if (!updatedDoc) {
			return NextResponse.json({success: false, error: {message: "Update failed", code: "UPDATE_FAILED"}}, {status: 500});
		}

		return NextResponse.json({success: true, data: {updatedCategory: updatedDoc[categoryKey]}});
	} catch (error) {
		return NextResponse.json({success: false, error: {message: "Server Error", code: "INTERNAL"}}, {status: 500});
	}
}
