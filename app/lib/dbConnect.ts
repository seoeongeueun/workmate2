import mongoose, {ConnectOptions} from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
	throw new Error("Missing Mongodb_uri env variable");
}

declare global {
	var mongooseCache:
		| {
				conn: typeof mongoose | null;
				promise: Promise<typeof mongoose> | null;
		  }
		| undefined;
}

const cached = global.mongooseCache ?? {conn: null, promise: null};
global.mongooseCache = cached;

export default async function dbConnect(): Promise<typeof mongoose> {
	if (cached.conn) {
		return cached.conn;
	}

	if (!cached.promise) {
		const opts: ConnectOptions = {bufferCommands: false};
		cached.promise = mongoose.connect(MONGODB_URI, opts).then(i => i);
	}

	cached.conn = await cached.promise;
	return cached.conn;
}
