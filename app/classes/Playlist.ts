interface Track {
	readonly id: string; //videoId를 기반으로 지정된 곡 전용 id
	url: string;
	order: number;
	title?: string;
}
export default class Playlist {
	title?: string;
	tracks: Track[];
	currentTrack: Track | undefined = undefined;
	nextTrack: Track | undefined = undefined;

	constructor(title: string) {
		this.title = title;
		this.tracks = [];
	}

	extractVideoId = (url: string) => {
		const idMatch = url.match(/(?:youtube\.com\/(?:[^\/\n\s]+\/\s*[^\/\n\s]+\/|(?:v|e(?:mbed)?)\/|\S*?watch\?v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
		return idMatch ? idMatch[1] : "";
	};

	addTrack(url: string, title?: string) {
		const order = this.tracks.length; // 신규 트랙 추가시 항상 플레이리스트의 마지막에 추가
		const id = this.extractVideoId(url) + this.tracks.length; //동영상 아이디를 기반으로 아이디 생성
		const track: Track = {id, url, order, title};
		this.tracks.push(track);
		if (!this.currentTrack) {
			this.currentTrack = track;
		}
	}

	removeTrack(id: string) {
		//TODO: 로직 수정 필요
		const currentIndex = this.tracks.findIndex(x => x.id === id);
		//this.tracks = this.tracks.filter(x => x.id !== id);

		// 현재 트랙 삭제 후 전 트랙으로 이동
		if (this.currentTrack?.id === id) {
			const prevIndex = currentIndex - 1;
			//전 트랙이 있다면 전 트랙으로 이동 | 없다면 재생 중지
			if (prevIndex >= 0) {
				this.currentTrack = this.tracks[prevIndex];
			} else {
				this.currentTrack = undefined;
			}
		}
		// if (this.nextTrack?.id === id) {
		// 	this.nextTrack = undefined;
		// }
	}

	playNext() {
		if (!this.tracks.length) return;
		if (this.currentTrack) {
			const currentOrder = this.currentTrack.order;
			this.currentTrack = this.tracks.find(track => track.order === currentOrder + 1);
		} else {
			this.currentTrack = this.tracks[0]; //currentTrack이 없는 경우 플레이리스트 실행 전인 것으로 판단, 리스트의 첫 번째 곡을 현재 곡으로 지정
			this.nextTrack = undefined;
		}
		if (this.currentTrack?.url) {
			return this.extractVideoId(this.currentTrack.url);
		}
	}

	playPrevious() {
		if (!this.tracks.length) return;
		if (this.currentTrack) {
			this.nextTrack = this.currentTrack; //현재 곡을 다음 곡으로 지정
			const currentOrder = this.currentTrack.order;
			this.currentTrack = this.tracks.find(track => track.order === currentOrder - 1);
		} else {
			this.currentTrack = this.tracks[0];
			this.nextTrack = undefined;
		}
		if (this.currentTrack?.url) {
			return this.extractVideoId(this.currentTrack.url);
		}
	}

	getCurrentTrack() {
		return this.currentTrack;
	}

	getVideoIdFromUrl(url: string) {
		return this.extractVideoId(url);
	}

	getNextTrackVideoId() {
		if (!this.tracks.length) return;
		if (this.nextTrack?.url) return this.extractVideoId(this.nextTrack.url);
		if (this.currentTrack) {
			const currentOrder = this.currentTrack.order;
			const nextTrack = this.tracks.find(track => track.order === currentOrder + 1);
			if (nextTrack?.url) {
				return this.extractVideoId(nextTrack.url);
			}
		}
	}

	updateTrackTitle(videoId: string, title: string) {
		const track = this.tracks.find(track => track.url.includes(videoId));

		if (track) {
			track.title = title;
			console.log(this.tracks);
		}
	}
}
