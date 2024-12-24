import mongoose, {Schema, Model, Document} from "mongoose";

export interface IUser extends Document {
	username: string;
	password: string;
	playlistIds: mongoose.Types.ObjectId[];
}

const UserSchema = new Schema<IUser>({
	username: {type: String, required: true, unique: true},
	password: {type: String, required: true},
	playlistIds: [{type: mongoose.Schema.Types.ObjectId, ref: "Playlist"}],
});

export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
