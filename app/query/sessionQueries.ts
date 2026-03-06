import {queryOptions} from "@tanstack/react-query";
import {fetchSession, fetchSessionExpiration} from "@/actions";

export const sessionKeys = {
	all: ["session"] as const,
	session: () => [...sessionKeys.all] as const,
	expiration: () => [...sessionKeys.all, "expiration"] as const,
};

export const sessionQueries = {
	session: () =>
		queryOptions({
			queryKey: ["session"],
			queryFn: async () => await fetchSession(),
			refetchOnWindowFocus: true,
		}),

	expiration: () =>
		queryOptions({
			queryKey: sessionKeys.expiration(),
			queryFn: async () => await fetchSessionExpiration(),
			refetchOnWindowFocus: true,
		}),
};
