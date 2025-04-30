import { useQuery } from "@tanstack/react-query";
import {apiRequest} from "@/app/lib/tools";

export function useSession() {
    return useQuery({
        queryKey: ["session"],
        queryFn: async() => {
            const res = await apiRequest("/api/auth");
            const data = res?.data;
            if (!data) throw new Error("Session fetch failed");
            return data;
        },
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000,
    })
}