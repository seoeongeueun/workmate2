import {NextResponse} from "next/server";
import mongoose from "mongoose";
import type {Track} from "@/types";
import {dbConnect} from "@/lib";
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

export async function POST(request: Request) {
	try {
		const {id, track, mode} = (await request.json()) as {
			id: string;
			track: Track | undefined;
			mode: "add" | "remove" | "empty";
		};

		//플레이리스트를 완전히 비우는 경우만 track이 없어도 된다
		if (mode !== "empty" && !track) {
			return NextResponse.json({error: "Track not provided"}, {status: 404});
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
		await dbConnect();
		const {searchParams} = new URL(request.url);
		const id = searchParams.get("id");

		if (!id) {
			return NextResponse.json({error: "Playlist id is needed"}, {status: 400});
		}

		if (!mongoose.Types.ObjectId.isValid(id)) {
			return NextResponse.json({error: "Invalid playlist id"}, {status: 400});
		}

		const item = await Playlist.findById(id);

		if (!item) {
			return NextResponse.json({error: "No matching playlist was found"}, {status: 404});
		}
		return NextResponse.json({title: item.title, tracks: item.tracks});
	} catch (error) {
		console.error("Error fetching playlist:", error);
		return NextResponse.json({error: "Internal server error"}, {status: 500});
	}
}
