import {NextResponse} from "next/server";
import dbConnect from "@/app/lib/dbConnect";
import {User} from "@/app/models/User";
import {Playlist} from "@/app/models/Playlist";
import bcrypt from "bcrypt";

export async function POST(request: Request) {
	try {
		const {username, password} = (await request.json()) as {
			username: string;
			password: string;
		};

		if (!username || !password) {
			return NextResponse.json({error: "Missing input"}, {status: 400});
		}

		await dbConnect();

		//중복 이름 확인
		const exists = await User.findOne({username});
		if (exists) {
			return NextResponse.json({error: "Username taken"}, {status: 409});
		}

		//플레이리스트 먼저 생성
		const playlist = await Playlist.create({
			name: `${username}'s Playlist`,
		});

		const hashed = await bcrypt.hash(password, 10);

		await User.create({
			username,
			password: hashed,
			playlistIds: [playlist._id],
		});

		return NextResponse.json({success: true}, {status: 201});
	} catch (error: any) {
		return NextResponse.json({error: error}, {status: 500});
	}
}
