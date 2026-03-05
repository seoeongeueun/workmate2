import mongoose from "mongoose";

// 세션 데이터 구조
export interface SessionData {
	user?: {
		id: string;
		username: string;
		playlistId: mongoose.Types.ObjectId;
		expiresAt?: number;
	};
}

// 세션 응답 구조 -> sessiondata에서 필요한 정보만 추출하여 반환
// 정보가 없는 경우는 isvalid: false로 반환하고, 해당 정보는 undefined로 처리
export type SessionResponse =
	| {
			isValid: true;
			userId: NonNullable<SessionData["user"]>["id"];
			username: NonNullable<SessionData["user"]>["username"];
			playlistId: NonNullable<SessionData["user"]>["playlistId"];
	  }
	| {
			isValid: false;
			userId?: undefined;
			username?: undefined;
			playlistId?: undefined;
	  };
