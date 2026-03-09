import {create} from "zustand";

interface LuckyTrackState {
	luckyTrack: string;
	setLuckyTrack: (track: string) => void;
	reset: () => void;
}

export const useLuckyTrackStore = create<LuckyTrackState>(set => ({
	luckyTrack: "",
	setLuckyTrack: track => set({luckyTrack: track}),
	reset: () => set({luckyTrack: ""}),
}));
