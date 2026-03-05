export interface Track {
	readonly id: string; //videoId를 기반으로 지정된 곡 전용 id
	url: string;
	title?: string;
}
