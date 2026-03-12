import {create} from "zustand";
import type {Track} from "@/types";
import {extractVideoId} from "@/lib";

interface LuckyTrackState {
	luckyTrack: Track | null;
	setLuckyTrack: (url: string) => void;
	updateLuckyTrackTitle: (title: string) => void;
	reset: () => void;
}

export const useLuckyTrackStore = create<LuckyTrackState>(set => ({
	luckyTrack: null,
	setLuckyTrack: url => {
		const videoId = extractVideoId(url);
		if (videoId) {
			set({luckyTrack: {id: videoId, url, title: ""}});
		}
	},
	updateLuckyTrackTitle: title =>
		set(state => {
			if (state.luckyTrack) {
				return {luckyTrack: {...state.luckyTrack, title}};
			}
			return state;
		}),
	reset: () => set({luckyTrack: null}),
}));
