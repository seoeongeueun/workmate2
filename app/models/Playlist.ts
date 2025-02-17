import mongoose, {Schema, Model, Document} from "mongoose";
import {Track} from "../classes/Playlist.js";

export interface IPlaylist extends Document {
	_id: mongoose.Types.ObjectId;
	title: string;
	tracks: Track[];
}

const PlaylistSchema = new Schema<IPlaylist>({
	title: {type: String, required: true},
	tracks: [
		{
			id: {type: String, required: true},
			url: {type: String, required: true},
			title: {type: String},
		},
	],
});

export const Playlist: Model<IPlaylist> = mongoose.models.Playlist || mongoose.model<IPlaylist>("Playlist", PlaylistSchema);
