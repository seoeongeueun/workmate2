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

// 세션 정보 구조 -> sessiondata에서 필요한 정보만 추출하여 반환
export type SessionInfo =
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

// 세션 만료 응답 구조
export interface SessionExpirationResponse {
	timeLeft: number; //세션이 만료되기까지 남은 시간 (ms)
	expired: boolean; //세션이 이미 만료되었는지 여부
}
