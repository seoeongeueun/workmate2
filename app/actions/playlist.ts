"use server";

import {apiRequest} from "@/lib";
import type {PlaylistInfo, ApiResponse} from "@/types";

//주어진 플레이리스트 ID로 플레이리스트 정보를 가져오는 함수
export async function fetchPlaylist(id: string) {
	const res = await apiRequest<ApiResponse<PlaylistInfo>>("/api/playlist");
	if (!res.success) {
		throw new Error(res.error.message);
	}
	return res.data as PlaylistInfo;
}
