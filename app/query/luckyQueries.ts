import {queryOptions} from "@tanstack/react-query";
import {fetchLuckyTracks} from "@/actions";

const luckyKeys = {
	all: ["lucky"] as const,
};

export const luckyQueries = {
	all: () =>
		queryOptions({
			queryKey: luckyKeys.all,
			queryFn: async () => await fetchLuckyTracks(),
			//거의 바뀌지 않기 때문에 긴 캐싱 타임
			staleTime: 1000 * 60 * 60 * 24, //하루
			gcTime: 1000 * 60 * 60 * 24 * 7, //일주일
			refetchOnWindowFocus: false,
			retry: 1,
		}),
};
