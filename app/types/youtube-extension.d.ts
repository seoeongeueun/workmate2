//동영상 타이틀을 가져오는 함수를 선언

declare namespace YT {
	interface Player {
		getVideoData(): {
			video_id: string;
			author: string;
			title: string;
		};
	}
}
