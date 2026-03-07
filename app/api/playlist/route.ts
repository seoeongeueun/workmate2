import {NextResponse} from "next/server";
import mongoose from "mongoose";
import type {Track} from "@/types";
import {dbConnect} from "@/providers/dbConnect";
import {Playlist} from "@/models";

const handleAdd = async (id: string, track: Track) => {
	return await Playlist.findByIdAndUpdate(id, {$addToSet: {tracks: track}}, {new: true});
};

const handleRemove = async (id: string, trackId: string) => {
	return await Playlist.findByIdAndUpdate(id, {$pull: {tracks: {id: trackId}}}, {new: true});
};

const handleEmptyTracks = async (id: string) => {
	return await Playlist.findByIdAndUpdate(id, {$set: {tracks: []}}, {new: true});
};

export async function POST(request: Request): Promise<Response> {
	try {
		const {id, track, mode} = (await request.json()) as {
			id: string;
			track: Track | undefined;
			mode: "add" | "remove" | "empty";
		};

		//플레이리스트를 완전히 비우는 경우만 track이 없어도 된다
		if (mode !== "empty" && !track) {
			return NextResponse.json({success: false, error: {message: "Track not provided", code: "TRACK_NOT_PROVIDED"}}, {status: 404});
		}

		let updatedPlaylist;

		switch (mode) {
			case "remove":
				updatedPlaylist = await handleRemove(id, track!.id);
				break;
			case "add":
				updatedPlaylist = await handleAdd(id, track!);
				break;
			case "empty":
				updatedPlaylist = await handleEmptyTracks(id);
				break;
			default:
				break;
		}

		if (!updatedPlaylist) {
			return NextResponse.json({success: false, error: {message: "Playlist not found", code: "PLAYLIST_NOT_FOUND"}}, {status: 404});
		}

		return NextResponse.json({success: true, data: updatedPlaylist});
	} catch (error) {
		console.error("Error handling playlist:", error);
		return NextResponse.json({success: false, error: {message: "Internal server error", code: "INTERNAL"}}, {status: 500});
	}
}

export async function GET(request: Request) {
	try {
		await dbConnect();
		const {searchParams} = new URL(request.url);
		const id = searchParams.get("id");

		if (!id) {
			return NextResponse.json({success: false, error: {message: "Playlist id is needed", code: "MISSING_ID"}}, {status: 400});
		}

		if (!mongoose.Types.ObjectId.isValid(id)) {
			return NextResponse.json({success: false, error: {message: "Invalid playlist id", code: "INVALID_ID"}}, {status: 400});
		}

		const item = await Playlist.findById(id);

		if (!item) {
			return NextResponse.json({success: false, error: {message: "No matching playlist was found", code: "PLAYLIST_NOT_FOUND"}}, {status: 404});
		}
		return NextResponse.json({success: true, data: {title: item.title, tracks: item.tracks}});
	} catch (error) {
		console.error("Error fetching playlist:", error);
		return NextResponse.json({success: false, error: {message: "Internal server error", code: "INTERNAL"}}, {status: 500});
	}
}
