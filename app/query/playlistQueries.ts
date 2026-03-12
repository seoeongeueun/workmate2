import {queryOptions} from "@tanstack/react-query";
import {apiRequest} from "@/lib";
import {PlaylistInfo, ApiResponse} from "@/types";

const playlistKeys = {
	all: ["playlist"] as const,
	detail: () => [...playlistKeys.all] as const,
};

export const playlistQueries = {
	detail: () =>
		queryOptions({
			queryKey: playlistKeys.detail(),
			queryFn: async () => {
				const res = await apiRequest<ApiResponse<PlaylistInfo>>("/api/playlist");
				if (!res.success) {
					throw new Error(res.error.message);
				}
				return res.data as PlaylistInfo;
			},
		}),
};
