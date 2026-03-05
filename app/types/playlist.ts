export interface Track {
	readonly id: string; //videoId를 기반으로 지정된 곡 전용 id
	url: string;
	title?: string;
}

export interface Playlist {
	objectId?: string;
	title: string;
	tracks: Track[];
	backup: Track[]; //플레이리스트 셔플시 원본 플레이리스트 저장용
	currentTrack?: Track;
	nextTrack?: Track;
}
