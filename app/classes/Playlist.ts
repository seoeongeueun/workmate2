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
		const id = this.extractVideoId(url) + this.tracks.length + new Date().getSeconds(); //동영상 아이디를 기반으로 아이디 생성 + 랜덤 요소
		const track: Track = {id, url, title};
		this.tracks.push(track);
		if (!this.currentTrack) {
			this.currentTrack = track;
		}
		return track;
	}

	removeTrack(id: string) {
		console.log("called");
		const currentIndex = this.tracks.findIndex(x => x.id === id);
		if (currentIndex === -1) return;

		this.tracks.splice(currentIndex, 1);
		let newCurrentTrack: typeof this.currentTrack | undefined;

		// 현재 트랙 삭제 후 전 트랙으로 이동
		if (this.currentTrack?.id === id) {
			//전 트랙이 있다면 다음 트랙으로 이동 | 없다면 재생 중지
			if (this.tracks[currentIndex]) {
				newCurrentTrack = this.tracks[currentIndex];
			} else if (currentIndex > 0) {
				newCurrentTrack = this.tracks[currentIndex - 1];
			} else {
				newCurrentTrack = undefined;
			}
		} else {
			newCurrentTrack = this.currentTrack;
		}
		if (this.nextTrack?.id === id) {
			this.nextTrack = undefined;
		}
		this.currentTrack = newCurrentTrack;
		return newCurrentTrack;
	}

	empty() {
		this.tracks = [];
		this.backup = [];
	}

	playNext() {
		if (!this.tracks.length) return;
		if (this.currentTrack) {
			const currentIndex = this.tracks.findIndex(track => track.id === this.currentTrack?.id);

			//현재 트랙이 마지막 트랙이 아닌 경우 다음 트랙을 현재 트랙으로 지정
			if (currentIndex >= 0 && currentIndex < this.tracks.length - 1) {
				this.currentTrack = this.tracks[currentIndex + 1];
			} else {
				this.nextTrack = undefined;
			}
		} else {
			this.currentTrack = this.tracks[0]; //currentTrack이 없는 경우 플레이리스트 실행 전인 것으로 판단, 리스트의 첫 번째 곡을 현재 곡으로 지정
			this.nextTrack = undefined;
		}
		return this.currentTrack;
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
			/* 현재 곡이 없는 경우의 의미
				1. 마지막 곡인데 재생이 끝났다 => nextTrack으로 지정된 곡을 재생
				2. 첫 곡이다 => 첫 곡을 다시 재생
			*/
			if (this.nextTrack) this.currentTrack = this.nextTrack;
			else this.currentTrack = this.tracks[0];
			this.nextTrack = undefined;
		}
		// if (this.currentTrack?.url) {
		// 	return this.extractVideoId(this.currentTrack.url);
		// }
		return this.currentTrack;
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
			if (this.currentTrack?.id === track.id) this.currentTrack.title = title;
		}
	}

	shuffleTracks(id: string | undefined) {
		this.backup = [...this.tracks];

		//현재 곡이 없다면 전체를 다 Fisher-Yates 셔플
		if (!id) {
			for (let i = this.tracks.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[this.tracks[i], this.tracks[j]] = [this.tracks[j], this.tracks[i]];
			}
			return;
		}

		//현재 곡이 있다면 현재 곡을 셔플된 플레이리스트의 첫 번째 곡으로 지정
		const index = this.tracks.findIndex(track => track.id === id);
		let currentTrack: typeof this.currentTrack | null = null;

		if (index !== -1) {
			currentTrack = this.tracks.splice(index, 1)[0]; // Remove the current track from the list
		}

		for (let i = this.tracks.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[this.tracks[i], this.tracks[j]] = [this.tracks[j], this.tracks[i]];
		}

		if (currentTrack) {
			this.tracks.unshift(currentTrack);
		}
		return this.getTrackIndex();
	}

	unshuffleTracks() {
		const backupIds = new Set(this.backup.map(track => track.id));
		const tracksIds = new Set(this.tracks.map(track => track.id));

		//셔플 모드 중 추가된 곡이 있는지 확인 후 반영
		const addedTracks = this.tracks.filter(track => !backupIds.has(track.id));
		this.backup.push(...addedTracks);

		//반대로 삭제된 곡이 있다면 backup에서도 삭제
		this.backup = this.backup.filter(track => tracksIds.has(track.id));

		this.tracks = [...this.backup];

		return this.getTrackIndex();
	}

	getTrackIndex() {
		const currentIndex = this.tracks.findIndex(track => track.id === this.currentTrack?.id);
		return `${currentIndex + 1} out of ${this.tracks.length}`;
	}

	getTrackIndexWithId(id: string) {
		const currentIndex = this.tracks.findIndex(track => track.id === id);
		return `${currentIndex + 1} out of ${this.tracks.length}`;
	}
}
