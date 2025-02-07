import {NextResponse} from "next/server";
import dbConnect from "@/app/lib/dbConnect";
import {Lucky} from "@/app/models/Lucky";
import mongoose from "mongoose";

export async function GET() {
	try {
		await dbConnect();
		const luckyData = await Lucky.findOne();
		if (!luckyData) {
			return NextResponse.json({success: false, error: "No data found"}, {status: 404});
		}

		return NextResponse.json({success: true, data: luckyData});
	} catch (error) {
		console.error("Error fetching data:", error);
		return NextResponse.json({success: false, error: "Server Error"}, {status: 500});
	}
}

export async function POST(request: Request) {
	try {
		await dbConnect();
		const {categoryKey, unavailableVideos} = await request.json();

		if (!categoryKey || !Array.isArray(unavailableVideos) || unavailableVideos.length === 0) {
			return NextResponse.json({success: false, error: "Invalid parameters"}, {status: 400});
		}

		const updatedDoc = await Lucky.findOneAndUpdate(
			{}, // Find the document by ID
			{$pullAll: {[categoryKey]: unavailableVideos.map(url => url.trim())}}, // Remove unavailable URLs
			{new: true} // Return updated document
		);

		if (!updatedDoc) {
			return NextResponse.json({success: false, error: "Update failed"}, {status: 500});
		}

		return NextResponse.json({success: true, updatedCategory: updatedDoc[categoryKey]});

		return NextResponse.json({success: true, updatedCategory: luckyDoc[categoryKey]});
	} catch (error) {
		return NextResponse.json({success: false, error: "Server Error"}, {status: 500});
	}
}
