import {NextResponse} from "next/server";
import {Playlist} from "@/app/models/Playlist";
import mongoose from "mongoose";

const handleAdd = async (id: string, trackUrl: string) => {
	return await Playlist.findByIdAndUpdate(id, {$addToSet: {tracks: trackUrl}}, {new: true});
};

const handleRemove = async (id: string, trackUrl: string) => {
	return await Playlist.findByIdAndUpdate(id, {$pull: {tracks: trackUrl}}, {new: true});
};

export async function POST(request: Request) {
	try {
		const {id, trackUrl, isRemove} = (await request.json()) as {
			id: string;
			trackUrl: string;
			isRemove: boolean;
		};

		let updatedPlaylist;

		if (isRemove) {
			updatedPlaylist = await handleRemove(id, trackUrl);
		} else {
			updatedPlaylist = await handleAdd(id, trackUrl);
		}

		if (!updatedPlaylist) {
			return NextResponse.json({error: "Playlist not found"}, {status: 404});
		}

		return NextResponse.json(updatedPlaylist);
	} catch (error) {
		console.error("Error handling playlist:", error);
		return NextResponse.json({error: "Internal server error"}, {status: 500});
	}
}

export async function GET(request: Request) {
	try {
		const {searchParams} = new URL(request.url);
		const id = searchParams.get("id");

		if (!id) {
			return NextResponse.json({error: "Playlist id is needed"}, {status: 400});
		}

		const playlist = await Playlist.findById(id);

		if (!playlist || !mongoose.Types.ObjectId.isValid(id)) {
			return NextResponse.json({error: "No matching playlist was found"}, {status: 404});
		}
		return NextResponse.json(playlist);
	} catch (error) {
		console.error("Error fetching playlist:", error);
		return NextResponse.json({error: "Internal server error"}, {status: 500});
	}
}
