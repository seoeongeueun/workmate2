import dbConnect from "@/app/lib/dbConnect";
import {Lucky} from "@/app/models/Lucky";

dbConnect().catch(err => console.error("Database connection error:", err));

export async function getLuckyData() {
	try {
		const luckyData = await Lucky.findOne();
		if (!luckyData) {
			throw new Error("No data found");
		}

		return {success: true, data: luckyData};
	} catch (error) {
		console.error("Error fetching data:", error);
		throw new Error("Servor Error");
	}
}

export async function postLuckyData(data: {categoryKey: string; unavailableVideos: string[]}) {
	try {
		const {categoryKey, unavailableVideos} = data;

		if (!categoryKey || !Array.isArray(unavailableVideos) || unavailableVideos.length === 0) {
			throw new Error("Invalid parameters");
		}

		const updatedDoc = await Lucky.findOneAndUpdate({}, {$pullAll: {[categoryKey]: unavailableVideos.map(url => url.trim())}}, {new: true});

		if (!updatedDoc) {
			throw new Error("Update failed");
		}

		return {success: true, updatedCategory: updatedDoc[categoryKey]};
	} catch (error) {
		throw new Error("Server Error");
	}
}
