import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/app/lib/tools";

export function useSessionExpiration(enabled: boolean) {
    return useQuery({
        queryKey: ["sessionExpiration"],
        queryFn: async () => {
            const res = await apiRequest("/api/logout");
            return res?.timeLeft ?? {};
        },
        enabled,
    })
}