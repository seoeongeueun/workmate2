import {create} from "zustand";
import {extractVideoId} from "@/lib";
import type {Track, Playlist} from "@/types";

/**
 * 플레이리스트 상태 관리를 위한 zustand 스토어
 * - objectId: 데이터베이스에 저장된 플레이리스트의 고유 ID
 * - title: 플레이리스트 제목
 * - tracks: 플레이리스트에 포함된 트랙들의 배열
 * - backup: 플레이리스트 셔플 시 원본 트랙 순서를 보존하기 위한 배열
 * - currentTrack: 현재 재생 중인 트랙
 * - nextTrack: 다음에 재생될 트랙 (playPrevious 기능에서 사용)
 *
 * 주요 메서드:
 * - initialize: 플레이리스트 초기화 (제목, ID, 트랙 목록 설정)
 * - reset: 플레이리스트 상태 초기화
 * - setTitle: 플레이리스트 제목 설정
 * - setObjectId: 플레이리스트 ID 설정
 * - addTrack: 새로운 트랙 추가 (URL과 선택적 제목)
 * - removeTrack: 특정 트랙 제거 (ID로 식별)
 * - playNext: 다음 트랙으로 이동 (특수 트랙 재생 중일 때는 현재 트랙 유지)
 * - playPrevious: 이전 트랙으로 이동 (현재 트랙이 없을 때는 nextTrack 재생)
 * - shuffleTracks: 트랙 순서 섞기 (현재 트랙을 첫 번째로 유지)
 * - unshuffleTracks: 원래 트랙 순서로 복원 (셔플 중 추가/삭제된 곡 반영)
 * - updateTrackTitle: 특정 트랙의 제목 업데이트 (videoId로 식별)
 * - getTrackIndex: 현재 트랙의 인덱스와 전체 트랙 수 반환
 * - getTrackIndexWithId: 특정 트랙 ID의 인덱스와 전체 트랙 수 반환
 * - getVideoIdFromUrl: YouTube URL에서 videoId 추출
 * - getNextTrackVideoId: 다음 트랙의 videoId 반환
 * - empty: 플레이리스트 완전히 비우기
 */

interface PlaylistState extends Playlist {
	initialize: (title: string, objectId: string, tracks: Track[]) => void;
	reset: () => void;
	setTitle: (title: string) => void;
	setObjectId: (id: string) => void;
	addTrack: (url: string, title?: string) => Track;
	removeTrack: (id: string) => Track | undefined;
	playNext: (wasSpecialTrack?: boolean) => Track | undefined;
	playPrevious: () => Track | undefined;
	shuffleTracks: (currentTrackId?: string) => void;
	unshuffleTracks: () => void;
	updateTrackTitle: (videoId: string, title: string) => void;

	getTrackIndex: () => string;
	getTrackIndexWithId: (id: string) => string;
	getVideoIdFromUrl: (url: string) => string;
	getNextTrackVideoId: () => string | undefined;
	empty: () => void;
}

export const usePlaylistStore = create<PlaylistState>((set, get) => ({
	objectId: undefined,
	title: "",
	tracks: [],
	backup: [],
	currentTrack: undefined,
	nextTrack: undefined,

	initialize: (title, objectId, tracks) => {
		set({
			title,
			objectId,
			tracks,
			backup: tracks,
			currentTrack: tracks[0], // *중요* 첫 곡은 무조건 첫번째 트랙으로 설정
		});
	},

	reset: () => {
		set({
			title: "",
			objectId: undefined,
			tracks: [],
			backup: [],
			currentTrack: undefined,
			nextTrack: undefined,
		});
	},

	setTitle: title => set({title}),
	setObjectId: id => set({objectId: id}),

	addTrack: (url, title) => {
		const state = get();
		const id = extractVideoId(url) + state.tracks.length + new Date().getSeconds();
		const newTrack: Track = {id, url, title};
		// 신규 트랙 추가시 항상 플레이리스트의 마지막에 추가
		const updatedTracks = [...state.tracks, newTrack];
		set({
			tracks: updatedTracks,
			currentTrack: state.currentTrack ?? newTrack,
		});
		return newTrack;
	},

	removeTrack: id => {
		const {tracks, currentTrack, nextTrack} = get();
		const idx = tracks.findIndex(t => t.id === id);
		if (idx === -1) return;

		const newTracks = [...tracks];
		newTracks.splice(idx, 1);
		let newCurrent: Track | undefined = currentTrack;

		// 현재 트랙 삭제 후 하나 전 트랙으로 이동 || 없다면 재생 중지
		if (currentTrack?.id === id) {
			newCurrent = newTracks[idx] || newTracks[idx - 1] || undefined;
		}

		set({
			tracks: newTracks,
			currentTrack: newCurrent,
			nextTrack: nextTrack?.id === id ? undefined : nextTrack,
		});

		return newCurrent;
	},

	playNext: (wasSpecial = false) => {
		const {tracks, currentTrack} = get();
		if (!tracks.length) return;

		//스페셜 트랙 재생 중에 playnext가 호출될 경우 아무런 추가 행동 필요 없이 현재 첫 곡을 리턴한다
		if (wasSpecial) return currentTrack;

		let newCurrent = currentTrack;
		if (currentTrack) {
			const idx = tracks.findIndex(t => t.id === currentTrack.id);
			//현재 트랙이 마지막 트랙이 아닌 경우 다음 트랙을 현재 트랙으로 지정
			if (idx >= 0 && idx < tracks.length - 1) newCurrent = tracks[idx + 1];
			else set({nextTrack: undefined});
		} else {
			// currentTrack이 없다는 것은 플레이리스트 실행 전인 것으로 판단해, 리스트의 첫곡을 현재곡으로 지정
			newCurrent = tracks[0];
		}

		set({currentTrack: newCurrent});
		return newCurrent;
	},

	playPrevious: () => {
		const {tracks, currentTrack, nextTrack} = get();
		if (!tracks.length) return;

		let newCurrent = currentTrack;
		if (currentTrack) {
			const idx = tracks.findIndex(t => t.id === currentTrack.id);
			if (idx > 0) newCurrent = tracks[idx - 1];
			set({nextTrack: currentTrack}); //현재 곡을 다음 곡으로 지정
		} else {
			/* 현재 곡이 없는 경우의 의미
				1. 마지막 곡인데 재생이 끝났다 => nextTrack으로 지정된 곡을 재생
				2. 첫 곡이다 => 첫 곡을 다시 재생
			*/
			newCurrent = nextTrack ?? tracks[0];
			set({nextTrack: undefined});
		}
		set({currentTrack: newCurrent});
		return newCurrent;
	},

	shuffleTracks: id => {
		const {tracks} = get();
		const copy = [...tracks];
		//Fisher-Yates 셔플
		const currentIndex = copy.findIndex(t => t.id === id);
		const current = currentIndex !== -1 ? copy.splice(currentIndex, 1)[0] : undefined;
		for (let i = copy.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[copy[i], copy[j]] = [copy[j], copy[i]];
		}
		//현재 곡이 있다면 현재 곡을 셔플된 플레이리스트의 첫 번째 곡으로 지정
		const final = current ? [current, ...copy] : copy;
		set({
			tracks: final,
			backup: tracks,
			currentTrack: final[0],
			nextTrack: final[1],
		});
	},

	unshuffleTracks: () => {
		const {backup, tracks, currentTrack} = get();

		const backupIds = new Set(backup.map(t => t.id));
		const tracksIds = new Set(tracks.map(t => t.id));

		//셔플 모드 중 추가된 곡이 있는지 확인 후 반영
		const addedTracks = tracks.filter(t => !backupIds.has(t.id));
		//반대로 삭제된 곡이 있다면 backup에서도 삭제
		const cleanedBackup = backup.filter(t => tracksIds.has(t.id));

		const restored = [...cleanedBackup, ...addedTracks];

		const newCurrent = restored.find(t => t.id === currentTrack?.id);

		set({
			tracks: restored,
			backup: restored,
			currentTrack: newCurrent,
			nextTrack: restored[restored.indexOf(newCurrent!) + 1],
		});
	},

	updateTrackTitle: (videoId, title) => {
		const {tracks, currentTrack} = get();
		const updatedTracks = tracks.map(track => (track.url.includes(videoId) ? {...track, title} : track));
		const updatedCurrent = updatedTracks.find(t => t.id === currentTrack?.id);

		set({
			tracks: updatedTracks,
			currentTrack: updatedCurrent,
		});
	},

	getTrackIndex: () => {
		const {tracks, currentTrack} = get();
		const idx = tracks.findIndex(t => t.id === currentTrack?.id);
		return `${idx + 1} out of ${tracks.length}`;
	},

	getTrackIndexWithId: id => {
		const {tracks} = get();
		const idx = tracks.findIndex(t => t.id === id);
		return `${idx + 1} out of ${tracks.length}`;
	},

	getVideoIdFromUrl: url => extractVideoId(url),
	getNextTrackVideoId: () => {
		const {tracks, currentTrack, nextTrack} = get();
		if (nextTrack?.url) return extractVideoId(nextTrack.url);
		const idx = tracks.findIndex(t => t.id === currentTrack?.id);
		const next = tracks[idx + 1];
		if (next?.url) return extractVideoId(next.url);
	},

	empty: () => {
		set({
			tracks: [],
			backup: [],
			currentTrack: undefined,
			nextTrack: undefined,
		});
	},
}));
