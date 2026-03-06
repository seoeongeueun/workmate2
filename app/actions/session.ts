"use server";

import {apiRequest} from "@/lib";
import type {ApiResponse, SessionInfo, SessionExpirationResponse} from "@/types";

//세션이 유효한지 확인하고, 유효하다면 세션 정보를 반환
export async function fetchSession() {
	const res = await apiRequest<ApiResponse<SessionInfo>>("/api/auth");
	if (!res.success) {
		throw new Error(res.error.message);
	}
	return res.data as SessionInfo;
}

//세션이 만료되기까지 남은 시간 반환
export async function fetchSessionExpiration() {
	const res = await apiRequest<ApiResponse<SessionExpirationResponse>>("/api/logout");
	if (!res.success) {
		throw new Error(res.error.message);
	}
	return res.data as SessionExpirationResponse;
}
