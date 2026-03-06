import {queryOptions} from "@tanstack/react-query";
import {fetchPlaylist} from "@/actions";

const playlistKeys = {
	all: ["playlist"] as const,
	detail: (id: string, userId: string) => [...playlistKeys.all, userId, id] as const,
};

export const playlistQueries = {
	detail: (id: string, userId: string) =>
		queryOptions({
			queryKey: playlistKeys.detail(id, userId),
			queryFn: async () => fetchPlaylist(id),
			refetchOnWindowFocus: true,
			enabled: !!id,
		}),
};
