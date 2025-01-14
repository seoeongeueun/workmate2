import {NextResponse} from "next/server";
import {Playlist as PlaylistModel} from "@/app/models/Playlist";
import mongoose from "mongoose";
import Playlist, {Track} from "@/app/classes/Playlist";

const handleAdd = async (id: string, track: Track) => {
	return await PlaylistModel.findByIdAndUpdate(id, {$addToSet: {tracks: track}}, {new: true});
};

const handleRemove = async (id: string, trackId: string) => {
	return await PlaylistModel.findByIdAndUpdate(id, {$pull: {tracks: {id: trackId}}}, {new: true});
};

export async function POST(request: Request) {
	try {
		const {id, track, isRemove} = (await request.json()) as {
			id: string;
			track: Track;
			isRemove: boolean;
		};

		let updatedPlaylist;

		if (isRemove) {
			updatedPlaylist = await handleRemove(id, track.id);
		} else {
			updatedPlaylist = await handleAdd(id, track);
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

		const item = await PlaylistModel.findById(id);

		if (!item || !mongoose.Types.ObjectId.isValid(id)) {
			return NextResponse.json({error: "No matching playlist was found"}, {status: 404});
		}
		return NextResponse.json({title: item.title, tracks: item.tracks});
	} catch (error) {
		console.error("Error fetching playlist:", error);
		return NextResponse.json({error: "Internal server error"}, {status: 500});
	}
}
