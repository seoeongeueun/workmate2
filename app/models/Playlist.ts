import mongoose, {Schema, Model, Document} from "mongoose";

export interface IPlaylist extends Document {
	_id: mongoose.Types.ObjectId;
	title: string;
	tracks: string[];
}

const PlaylistSchema = new Schema<IPlaylist>({
	title: {type: String, required: true},
	tracks: {type: [String], required: true},
});

export const Playlist: Model<IPlaylist> = mongoose.models.Playlist || mongoose.model<IPlaylist>("Playlist", PlaylistSchema);
