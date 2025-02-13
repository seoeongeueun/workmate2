import dbConnect from "../../app/lib/dbConnect.js";
import {User} from "../../app/models/User.js";
import bcrypt from "bcrypt";
import {Playlist} from "../../app/models/Playlist.js";
import {MAX_AGE} from "../../app/lib/session.js";
import {saveSession, getSession, clearSession} from "../lib/session.js";

/* /api/auth 시작*/
//로그인
export async function loginUser(data: {username: string; password: string}) {
	const {username, password} = data;

	if (!username || !password) {
		throw new Error("Inputs missing");
	}

	await dbConnect();

	//대소문자 무시한 동일 유저네임 찾기
	const user = await User.findOne({username: {$regex: new RegExp(`^${username}$`, "i")}}).lean();
	if (!user) {
		throw new Error("Username does not exist");
	}

	const isMatch = await bcrypt.compare(password, user.password);
	if (!isMatch) {
		throw new Error("Password does not match");
	}

	saveSession({
		id: user._id.toString(),
		username: user.username,
		playlistId: user.playlistIds[0],
		expiresAt: Date.now() + MAX_AGE,
	});

	return {success: true};
}

//로그인 유지 확인용 세션 반환
export async function getUserSession() {
	const session = getSession();

	if (!session) {
		return {isValid: false};
	}

	if (session.username && session?.playlistId) {
		return {isValid: true, playlistId: session.playlistId, username: session.username};
	} else {
		return {isValid: false};
	}
}
/* /api/auth 끝*/

/* /api/logout 시작*/
//로그아웃
export async function logoutUser(request: Request) {
	clearSession();
	return {success: true};
}

//배터리 잔량 표시용 남은 세션 시간 반환
export async function getSessionTimeLeft() {
	const session = getSession();

	if (!session) {
		return {timeLeft: 0, expired: true};
	}

	const now = Date.now();
	const expiresAt = session.expiresAt ?? now;
	const remainingMs = Math.max(0, expiresAt - now);

	return {
		timeLeft: remainingMs,
		expired: remainingMs <= 0,
	};
}

/* /api/logout 끝*/

/* /api/signup 시작*/
export async function registerUser(data: {username: string; password: string}) {
	const {username, password} = data;

	if (!username || !password) {
		throw new Error("ErrorCode: 0 - Missing input");
	}

	await dbConnect();

	//중복 이름 확인 (대소문자 무시)
	const exists = await User.findOne({username: {$regex: new RegExp(`^${username}$`, "i")}}).lean();
	if (exists) {
		throw new Error("ErrorCode: 1 - Username taken");
	}

	//플레이리스트 먼저 생성
	const playlist = await Playlist.create({
		title: `${username}'s Playlist`,
		tracks: [],
	});

	const hashed = await bcrypt.hash(password, 10);

	const user = await User.create({
		username,
		password: hashed,
		playlistIds: [playlist._id],
	});

	//유저 생성 후 바로 로그인 처리
	saveSession({
		id: user._id.toString(),
		username: user.username,
		playlistId: playlist._id,
		expiresAt: Date.now() + MAX_AGE,
	});

	return {success: true};
}
/* /api/signup 시작*/
