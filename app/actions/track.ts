"use server";

import {apiRequest} from "@/lib";
import type {ApiResponse, LuckyTracks} from "@/types";

// lucky 트랙 리스트
export async function fetchLuckyTracks() {
	const res = await apiRequest<ApiResponse<LuckyTracks>>("/api/lucky");

	if (!res.success) {
		throw new Error(res.error.message);
	}
	return res.data as LuckyTracks;
}
