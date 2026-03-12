import {queryOptions} from "@tanstack/react-query";
import {apiRequest} from "@/lib/tools";
import type {ApiResponse, SessionExpirationResponse, SessionInfo} from "@/types";

export const sessionKeys = {
	all: ["session"] as const,
	session: () => [...sessionKeys.all] as const,
	expiration: () => [...sessionKeys.all, "expiration"] as const,
};

export const sessionQueries = {
	session: () =>
		queryOptions({
			queryKey: ["session"],
			queryFn: async () => {
				const res = await apiRequest<SessionInfo>("/api/auth");
				if (!res.success) throw new Error(res.error.message);
				return res.data;
			},
			staleTime: 1000 * 60 * 15, //15분
			gcTime: 1000 * 60 * 60 * 4, //4시간
			refetchOnWindowFocus: true,
		}),

	expiration: () =>
		queryOptions({
			queryKey: sessionKeys.expiration(),
			queryFn: async () => {
				const res = await apiRequest<SessionExpirationResponse>("/api/logout");
				if (!res.success) throw new Error(res.error.message);
				return res.data;
			},
			staleTime: 1000 * 60, //1분
			gcTime: 1000 * 60 * 30, //30분
			refetchOnWindowFocus: true,
		}),
};
