import {NextResponse} from "next/server";
import {dbConnect} from "@/providers/dbConnect";
import {Lucky} from "@/models";

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

export async function POST(request: Request): Promise<Response> {
	try {
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
