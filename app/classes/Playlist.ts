export interface Track {
	readonly id: string; //videoId를 기반으로 지정된 곡 전용 id
	url: string;
	title?: string;
}
export default class Playlist {
	objectId?: string;
	title?: string;
	tracks: Track[];
	backup: Track[]; //플레이리스트 셔플시 원본 플레이리스트 저장용
	currentTrack: Track | undefined = undefined;
	nextTrack: Track | undefined = undefined;

	constructor(title: string, objectId: string, tracks: Track[] = []) {
		this.title = title;
		this.objectId = objectId;
		this.tracks = tracks;
		this.backup = tracks;
		// *중요* 첫 곡은 무조건 첫번째 트랙으로 설정
		if (tracks?.length > 0) this.currentTrack = tracks[0];
	}

	getObjectId() {
		return this.objectId;
	}

	extractVideoId = (url: string) => {
		const idMatch = url.match(/(?:youtube\.com\/(?:[^\/\n\s]+\/\s*[^\/\n\s]+\/|(?:v|e(?:mbed)?)\/|\S*?watch\?v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
		return idMatch ? idMatch[1] : "";
	};

	addTrack(url: string, title?: string) {
		// 신규 트랙 추가시 항상 플레이리스트의 마지막에 추가
		const id = this.extractVideoId(url) + this.tracks.length; //동영상 아이디를 기반으로 아이디 생성
		const track: Track = {id, url, title};
		this.tracks.push(track);
		if (!this.currentTrack) {
			this.currentTrack = track;
		}
		return track;
	}

	removeTrack(id: string) {
		const currentIndex = this.tracks.findIndex(x => x.id === id);

		// 현재 트랙 삭제 후 전 트랙으로 이동
		if (this.currentTrack?.id === id) {
			//전 트랙이 있다면 다음 트랙으로 이동 | 없다면 재생 중지
			if (currentIndex < this.tracks.length - 1) {
				this.currentTrack = this.tracks[currentIndex + 1];
			} else {
				this.currentTrack = undefined;
			}
		}
		if (this.nextTrack?.id === id) {
			this.nextTrack = undefined;
		}
		this.tracks.splice(currentIndex, 1);
		return this.extractVideoId(this.currentTrack?.url ?? "");
	}

	playNext() {
		if (!this.tracks.length) return;
		if (this.currentTrack) {
			const currentIndex = this.tracks.findIndex(track => track.id === this.currentTrack?.id);

			//현재 트랙이 마지막 트랙이 아닌 경우 다음 트랙을 현재 트랙으로 지정
			if (currentIndex >= 0 && currentIndex < this.tracks.length - 1) {
				this.currentTrack = this.tracks[currentIndex + 1];
			} else {
				this.currentTrack = undefined;
			}
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
			const currentIndex = this.tracks.findIndex(track => track.id === this.currentTrack?.id);
			if (currentIndex > 0) {
				this.currentTrack = this.tracks[currentIndex - 1];
			}
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
			const currentIndex = this.tracks.findIndex(track => track.id === this.currentTrack?.id);
			const nextTrack = this.tracks[currentIndex + 1];
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

	shuffleTracks() {
		this.backup = [...this.tracks];
		//Fisher-Yates 셔플
		for (let i = this.tracks.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[this.tracks[i], this.tracks[j]] = [this.tracks[j], this.tracks[i]];
		}
	}

	unshuffleTracks() {
		this.tracks = [...this.backup];
	}

	getTrackIndex() {
		const currentIndex = this.tracks.findIndex(track => track.id === this.currentTrack?.id);
		return `${currentIndex + 1} out of ${this.tracks.length}`;
	}
}
