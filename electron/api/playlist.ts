import {Playlist as PlaylistModel} from "../../app/models/Playlist.js";
import mongoose from "mongoose";
import Playlist from "../../app/classes/Playlist.js";
import type {Track} from "../../app/classes/Playlist.js";

const handleAdd = async (id: string, track: Track) => {
	return await PlaylistModel.findByIdAndUpdate(id, {$addToSet: {tracks: track}}, {new: true});
};

const handleRemove = async (id: string, trackId: string) => {
	return await PlaylistModel.findByIdAndUpdate(id, {$pull: {tracks: {id: trackId}}}, {new: true});
};

const handleEmptyTracks = async (id: string) => {
	return await PlaylistModel.findByIdAndUpdate(id, {$set: {tracks: []}}, {new: true});
};

export async function postPlaylist(data: {id: string; track?: Track; mode: "add" | "remove" | "empty"}) {
	if (data.mode !== "empty" && !data.track) {
		throw new Error("Track not provided");
	}

	let updatedPlaylist;

	switch (data.mode) {
		case "remove":
			updatedPlaylist = await handleRemove(data.id, data.track!.id);
			break;
		case "add":
			updatedPlaylist = await handleAdd(data.id, data.track!);
			break;
		case "empty":
			updatedPlaylist = await handleEmptyTracks(data.id);
			break;
		default:
			throw new Error(`Invalid mode: ${data.mode}`);
	}
	if (!updatedPlaylist) {
		throw new Error("Playlist not found");
	}

	return updatedPlaylist;
}

export async function getPlaylist(id: string) {
	if (!id) {
		throw new Error("Playlist id is needed");
	}

	if (!mongoose.Types.ObjectId.isValid(id)) {
		throw new Error("Invalid playlist id");
	}

	const item = await PlaylistModel.findById(id);

	if (!item) {
		throw new Error("No matching playlist was found");
	}
	return {title: item.title, tracks: item.tracks};
}
