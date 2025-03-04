import mongoose, {ConnectOptions} from "mongoose";

export default async function dbConnect() {
	const MONGODB_URI = process.env.MONGODB_URI;
	if (!MONGODB_URI) {
		throw new Error("Missing Mongodb_uri env variable");
	}

	if (mongoose.connection.readyState === 1) {
		return mongoose;
	}

	const opts: ConnectOptions = {bufferCommands: false};
	await mongoose.connect(MONGODB_URI, opts);
	return mongoose;
}
