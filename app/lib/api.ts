import type {DefaultOptions} from "@tanstack/react-query";

export const QUERY_CLIENT_DEFAULT_OPTIONS: DefaultOptions = {
	queries: {
		staleTime: 60 * 1000 * 30, // 30분
		gcTime: 60 * 1000 * 60 * 2, // 2시간
		refetchOnWindowFocus: false,
		retry: 1,
	},
};
