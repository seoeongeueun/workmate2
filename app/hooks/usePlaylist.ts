import { useQuery } from "@tanstack/react-query";
import {apiRequest} from "@/app/lib/tools";

export function usePlaylist(id?: string, enabled = true) {
    return useQuery({
        queryKey: ["playlist", id],
        queryFn: async () => {
            const res = await apiRequest(`/api/playlist/?id=${id}`, "GET");
            const data = res?.data;
            if (!data) throw new Error("Playlist fetch failed");
            return data;
        },
        enabled: !!id && enabled,
    })
}