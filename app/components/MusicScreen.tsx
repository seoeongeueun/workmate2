import React, {useState, useEffect, useRef, useCallback, useMemo, useReducer, use} from "react";
import {
	PlayIcon,
	PauseCircleIcon,
	BackwardIcon,
	ForwardIcon,
	PlusCircleIcon,
	PlayCircleIcon,
	SpeakerWaveIcon,
	SpeakerXMarkIcon,
	XCircleIcon,
	NoSymbolIcon,
} from "@heroicons/react/16/solid";
import type {Track, Playlist, PlaylistInfo} from "@/types";
import {apiRequest, extractVideoId, DEFAULT_ICON_SIZE, formatDate, formatTime} from "@/lib";
import {calcExpiration} from "@/lib/tools";
import {useQueryClient} from "@tanstack/react-query";
import {useQuery} from "@tanstack/react-query";
import {playlistQueries, sessionQueries} from "@/query";
import {useLuckyTrackStore, useButtonStore} from "@/stores";
declare global {
	interface Window {
		onYouTubeIframeAPIReady: () => void;
	}
}

type PlaylistAction =
	| {type: "INIT"; payload: PlaylistInfo}
	| {type: "RESET"}
	| {type: "SET_AS_FIRST"}
	| {type: "SET_TITLE"; payload: {title: string}}
	| {type: "SET_OBJECT_ID"; payload: {id: string}}
	| {type: "ADD_TRACK"; payload: {url: string; title?: string; isLucky?: boolean}}
	| {type: "UPDATE_TRACK_TITLE"; payload: {videoId: string; title: string}}
	| {type: "PLAY_NEXT"}
	| {type: "PLAY_PREVIOUS"}
	| {type: "SHUFFLE_TRACKS"; payload?: {currentTrackId?: string}}
	| {type: "UNSHUFFLE_TRACKS"}
	| {type: "REMOVE_TRACK"; payload: {id: string}}
	| {type: "EMPTY"};

const initialPlaylist: Playlist = {
	objectId: "",
	title: "",
	tracks: [],
	backup: [],
	currentTrack: undefined,
	nextTrack: undefined,
};

function playlistReducer(state: Playlist, action: PlaylistAction): Playlist {
	switch (action.type) {
		case "INIT": {
			const tracks = action.payload.tracks ?? [];
			return {
				objectId: action.payload.objectId,
				title: action.payload.title ?? "",
				tracks,
				backup: tracks,
				currentTrack: undefined,
				nextTrack: tracks[0],
			};
		}
		case "RESET": {
			return initialPlaylist;
		}
		// lucky가 없는 경우 특수한 케이스에서만 쓰는 첫번째 지정 리듀서
		case "SET_AS_FIRST": {
			return {
				...state,
				currentTrack: state.tracks[0],
				nextTrack: state.tracks[1] ?? undefined,
			};
		}
		case "SET_TITLE": {
			return {...state, title: action.payload.title};
		}
		case "SET_OBJECT_ID": {
			return {...state, objectId: action.payload.id};
		}
		case "ADD_TRACK": {
			const id = extractVideoId(action.payload.url) + state.tracks.length + new Date().getSeconds();
			const newTrack: Track = {id, url: action.payload.url, title: action.payload.title};
			// 신규 트랙 추가시 항상 플레이리스트의 마지막에 추가
			const tracks = [...state.tracks, newTrack];
			return {
				...state,
				tracks,
				currentTrack: action.payload.isLucky ? state.currentTrack : state.currentTrack || state.nextTrack || newTrack,
				nextTrack: state.nextTrack,
			};
		}
		//id를 가지고 업데이트할 트랙을 찾아 제목 업데이트 (굳이 currentTrack일 필요 없다)
		case "UPDATE_TRACK_TITLE": {
			const updatedTracks = state.tracks.map(track => (extractVideoId(track.url) === action.payload.videoId ? {...track, title: action.payload.title} : track));

			//get the updated track
			const newTrack = updatedTracks.find(t => extractVideoId(t.url) === action.payload.videoId);

			return {
				...state,
				tracks: updatedTracks,
				currentTrack: state.currentTrack ? {...state.currentTrack, title: action.payload.title} : undefined,
				nextTrack: !state.currentTrack ? newTrack : state.nextTrack,
			};
		}
		case "PLAY_NEXT": {
			if (!state.tracks.length) return state;

			const nextTrack = state.nextTrack;
			const currentTrack = state.currentTrack;

			if (!nextTrack)
				return {
					...state,
					currentTrack: undefined,
					nextTrack: currentTrack,
				};

			const idx = state.tracks.findIndex(t => t.id === nextTrack?.id);
			return {
				...state,
				currentTrack: nextTrack,
				nextTrack: state.tracks[idx + 1],
			};
			// if (!nextTrack) {
			// 	// currentTrack이 없다는 것은 플레이리스트 실행 전인 것으로 판단해, 리스트의 첫곡을 현재곡으로 지정
			// 	console.log("no current track - setting first track as current");
			// 	return {
			// 		...state,
			// 		currentTrack: state.tracks[0],
			// 		nextTrack: state.tracks[1],
			// 	};
			// }
			// if (nextTrack) {

			// } else {

			// }

			// const idx = state.tracks.findIndex(t => t.id === state.currentTrack?.id);
			// //현재 트랙이 마지막 트랙이 아닌 경우 다음 트랙을 현재 트랙으로 지정
			// if (idx >= 0 && idx < state.tracks.length - 1) currentTrack = state.tracks[idx + 1];
			// else return {...state, nextTrack: undefined};

			// return {
			// 	...state,
			// 	currentTrack,
			// 	nextTrack: state.tracks[idx + 1],
			// };
		}
		case "PLAY_PREVIOUS": {
			if (state.tracks.length <= 0) return state;

			let currentTrack = state.currentTrack;
			if (state.currentTrack) {
				const idx = state.tracks.findIndex(t => t.id === state.currentTrack?.id);
				if (idx > 0) currentTrack = state.tracks[idx - 1];
				return {
					...state,
					currentTrack,
					//현재 곡을 다음 곡으로 지정
					nextTrack: state.currentTrack,
				};
			}

			/* 현재 곡이 없는 경우의 의미
					1. 마지막 곡인데 재생이 끝났다 => nextTrack으로 지정된 곡을 재생
					2. 첫 곡이다 => 첫 곡을 다시 재생
				*/
			const fallbackCurrent = state.nextTrack ?? state.tracks[0];

			return {
				...state,
				currentTrack: fallbackCurrent,
				nextTrack: undefined,
			};
		}
		case "SHUFFLE_TRACKS": {
			const copy = [...state.tracks];
			//Fisher-Yates 셔플
			const currentIndex = copy.findIndex(t => t.id === state.currentTrack?.id);
			const current = currentIndex !== -1 ? copy.splice(currentIndex, 1)[0] : undefined;

			for (let i = copy.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[copy[i], copy[j]] = [copy[j], copy[i]];
			}

			//현재 곡이 있다면 현재 곡을 셔플된 플레이리스트의 첫 번째 곡으로 지정
			const tracks = current ? [current, ...copy] : copy;
			return {
				...state,
				tracks,
				backup: state.tracks,
				currentTrack: tracks[0],
				nextTrack: tracks[1],
			};
		}
		//TODO: 셔플 해제시 다른 제목이 보여지는 문제 수정 필요
		case "UNSHUFFLE_TRACKS": {
			const backupIds = new Set(state.backup.map(t => t.id));
			const tracksIds = new Set(state.tracks.map(t => t.id));

			//셔플 모드 중 추가된 곡이 있는지 확인 후 반영
			const addedTracks = state.tracks.filter(t => !backupIds.has(t.id));
			//반대로 삭제된 곡이 있다면 backup에서도 삭제
			const cleanedBackup = state.backup.filter(t => tracksIds.has(t.id));
			const restored = [...cleanedBackup, ...addedTracks];
			const currentTrack = restored.find(t => t.id === state.currentTrack?.id);

			return {
				...state,
				tracks: restored,
				backup: restored,
				currentTrack,
				nextTrack: restored[restored.indexOf(currentTrack!) + 1],
			};
		}
		case "REMOVE_TRACK": {
			const idx = state.tracks.findIndex(t => t.id === action.payload.id);
			if (idx === -1) return state;

			const tracks = [...state.tracks];
			tracks.splice(idx, 1);
			let currentTrack = state.currentTrack;

			// 현재 트랙 삭제 후 하나 전 트랙으로 이동 || 없다면 재생 중지
			if (state.currentTrack?.id === action.payload.id) {
				currentTrack = tracks[idx] || tracks[idx - 1] || undefined;
			}

			return {
				...state,
				tracks,
				currentTrack,
				nextTrack: state.nextTrack?.id === action.payload.id ? undefined : state.nextTrack,
			};
		}
		case "EMPTY": {
			return {
				...state,
				tracks: [],
				backup: [],
				currentTrack: undefined,
				nextTrack: undefined,
			};
		}
		default:
			return state;
	}
}

//세부 메뉴 선택지
const modeValues: string[] = ["remove", "shuffle", "empty", "logout"];
type ModeIndex = -1 | Extract<keyof typeof modeValues, number>;
const messages: Partial<Record<(typeof modeValues)[number], string>> = {
	remove: "Remove current track from playlist?",
	empty: "Empty your entire playlist?",
	logout: "Log out from current account?",
	shuffle: "",
	none: "Playlist is already empty",
	error: "There's was an error. Please try again.",
	special: "Special tracks aren't added to your playlist, so no worries!",
};

const muiscAddMessages = ["Music added!", "Error saving changes"];

/**
 * MusicScreen 컴포넌트는 플레이리스트의 트랙을 관리하고 유튜브 플레이어를 제어하는 역할을 담당한다.
 *
 * 플로우
 * 1. 플레이리스트 초기화: 컴포넌트가 마운트될 때 서버에서 플레이리스트 정보를 가져와 상태를 지정한다.
 * 2. lucky 곡 재생: 기존 dialogue에서 선택된 스페셜 곡이 있으면 그걸 먼저 재생한다 (유저 플레이리스트에 추가하지 않고 일회성)
 * 3. 플레이리스트 곡을 재생 대기: 플레이리스트의 곡을 cue 하고 cue 정보로 title을 업데이트한다
 * 4. 곡 재생: cue 된 곡을 재생한다.
 * 5. 에러 처리: 에러시 isVideoError 상태를 업데이트해서 처리
 */
export default function MusicScreen() {
	const [isPlay, setIsPlay] = useState<boolean>(false); //재생 상태
	const [isMute, setIsMute] = useState<boolean>(false); //음소거 상태
	const [shuffleMode, setShuffleMode] = useState<boolean>(false);
	const [showStopIcon, setShowStopIcon] = useState<boolean>(false); //마지막 트랙이거나 일시중지일 때 play 아이콘을 stop 아이콘으로 변경하기 위한 상태

	const [showPopup, setShowPopup] = useState<boolean>(false); // 메뉴창 표시 여부
	const [popupType, setPopupType] = useState<ModeIndex>(-1);
	const [mode, setMode] = useState<ModeIndex>(0);

	const [progressTime, setProgressTime] = useState<number>(0);
	const [currentTime, setCurrentTime] = useState<Date>(new Date());
	const [isVideoError, setIsVideoError] = useState<boolean>(false);

	// dialogue에서 고른 스페셜 트랙 => 플레이리스트에 추가되지 않고 일시적으로 재생만 한다
	const luckyTrack = useLuckyTrackStore(state => state.luckyTrack);
	const updateLuckyTrackTitle = useLuckyTrackStore(state => state.updateLuckyTrackTitle);
	const reset = useLuckyTrackStore(state => state.reset);

	const pressedButton = useButtonStore(state => state.pressedButton);
	const isPowerOn = useButtonStore(state => state.isPowerOn);

	//세션 만료 시간 계산
	const {data: expirationData} = useQuery(sessionQueries.expiration());
	const expiration = useMemo(() => (expirationData ? calcExpiration(expirationData.timeLeft) : ""), [expirationData]);

	//플레이리스트 상태 관리
	const [playlist, dispatchPlaylist] = useReducer(playlistReducer, initialPlaylist);
	const {data: playlistInfo} = useQuery(playlistQueries.detail());

	const queryClient = useQueryClient();

	const playerRef = useRef<any>(null);

	// 현재 시간 업데이트용 타이머
	useEffect(() => {
		const timer = setInterval(() => {
			setCurrentTime(new Date());
		}, 1000);
		return () => clearInterval(timer);
	}, []);

	useEffect(() => {
		if (!isPowerOn) playerRef.current?.pauseVideo();
	}, [isPowerOn]);

	useEffect(() => {
		if (playlistInfo) {
			dispatchPlaylist({type: "INIT", payload: playlistInfo});
		}
	}, [playlistInfo]);

	useEffect(() => {
		const {prev, current} = pressedButton;

		if (current === "select") {
			setShowPopup(true);
			return;
		}

		const isSecondPopup = mode === popupType;

		if (showPopup) {
			if (isSecondPopup) {
				// 두번 째 메뉴창이 켜진 경우 a/b 버튼 외는 기능 없음
				if (current === "a") handlePopAction(current);
				else if (current === "b") setPopupType(-1);
				return;
				/* 1depth 기본 메뉴창이 켜진 경우
					유효한 기능은 a => 2depth 메뉴 오픈 (셔플 모드 제외)
					b => 메뉴창 닫기
					up => 상단 선택지로 이동
					down => 하단 선택지로 이동
				*/
			} else {
				switch (current) {
					case "a":
						if (modeValues[mode] === "shuffle") setShuffleMode(prev => !prev);
						else setPopupType(mode);
						break;
					case "b":
						setShowPopup(false);
						break;
					case "up":
						setMode(mode === 0 ? modeValues.length - 1 : mode - 1);
						break;
					case "down":
						setMode(mode === modeValues.length - 1 ? 0 : mode + 1);
						break;
					default:
						break;
				}
				return;
			}
		} else {
			if (typeof playerRef.current?.cueVideoById !== "function") return;

			if (current === "left") handlePlayPrev();
			else if (current === "right") handlePlayNext();
		}
	}, [showPopup, pressedButton, playerRef]);

	//현재 재생 중인 트랙의 번호
	const trackIndexLabel = useMemo(() => {
		if (playlist.tracks.length === 0) return "0 out of 0";
		const idx = playlist.tracks.findIndex(t => t.id === playlist.currentTrack?.id);

		//tracks 길이가 0이 아니면 최소 1부터 시작하도록
		return `${Math.max(1, idx + 1)} out of ${playlist.tracks.length}`;
	}, [playlist]);

	//유저가 직접 재생/일시중지를 트리거 할 때만 사용하지만
	//player를 initialize할 때 자동 재생 효과를 주기 위해 예외로 사용
	const playVideo = useCallback(() => {
		if (!playerRef.current || showStopIcon) {
			return;
		}
		if (!isPlay) {
			playerRef.current.playVideo();
		} else {
			playerRef.current.pauseVideo();
		}
		//setIsPlay(!isPlay);
	}, [isPlay]);

	/* cue 과정은 동영상의 제목을 가져오기 위해 거쳐가는 필수 단계
	cue 상태만 트리거하고 여기서 재생에는 관여하지 않는다 */
	const cueVideo = (id: string) => {
		if (!playerRef.current || !(playerRef.current instanceof YT.Player) || typeof playerRef.current.cueVideoById !== "function") return;
		playerRef.current.cueVideoById(id); //yt api의 method를 통해 cued 상태로 전환
	};

	//음소거 토글 함수
	const handleMute = () => {
		if (!playerRef.current) return;

		if (!isMute) playerRef.current.mute();
		else playerRef.current.unMute();
		setIsMute(prev => !prev);
	};

	// stop 아이콘인 경우 강제로 플레이 중지
	useEffect(() => {
		if (showStopIcon) {
			if (playerRef.current) playerRef.current.pauseVideo();
		}
	}, [showStopIcon]);

	useEffect(() => {
		const loadYTScript = () => {
			const scriptTag = document.getElementById("youtube-iframe-script");
			if (!scriptTag) {
				const tag = document.createElement("script");
				tag.src = "https://www.youtube.com/iframe_api";
				tag.id = "youtube-iframe-script";
				const firstScriptTag = document.getElementsByTagName("script")[0];
				if (firstScriptTag.parentNode) firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
			}
		};

		if ((!window.YT?.Player || !playerRef.current) && playlist.objectId) {
			loadYTScript();
		}

		if (luckyTrack) console.log("🍀 Today's special track - ", luckyTrack.url);

		function onYouTubeIframeAPIReady() {
			console.log("API Ready - Initializing player");
			const track = luckyTrack?.url || playlist.currentTrack?.url || playlist.tracks[0]?.url;
			if (!luckyTrack && !playlist.currentTrack) dispatchPlaylist({type: "SET_AS_FIRST"});

			if (track) initializePlayer(extractVideoId(track));
		}

		window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
	}, [playlist]);

	const initializePlayer = (initialVideoId: string) => {
		playerRef.current = new YT.Player("player", {
			height: "54",
			width: "54",
			videoId: initialVideoId,
			events: {
				onReady: event => {
					console.log(`✅ Video ${initialVideoId} is Ready`);
					var videoData = event.target.getVideoData();
					var title = videoData.title;

					if (!luckyTrack) {
						dispatchPlaylist({type: "UPDATE_TRACK_TITLE", payload: {videoId: initialVideoId, title}});
					} else {
						// 이벤트 곡의 타이틀을 별도로 저장
						updateLuckyTrackTitle(title);
					}
					playVideo();
				},
				onError: event => {
					console.log(`❌ Video ${initialVideoId} is unavailable`);
					setIsVideoError(true);

					//에러난 곡을 삭제 시도
					setTimeout(() => {
						handleRemoveTrack();
					}, 1700);
				},
				onStateChange: (event: YT.OnStateChangeEvent) => {
					switch (event.data) {
						//이전 곡 재생 완료 시 다음 곡 자동 재생
						case YT.PlayerState.ENDED:
							dispatchPlaylist({type: "PLAY_NEXT"});

							//스페셜 곡이 재생 완료 된 경우 원래 플레이리스트의 첫 곡을 재생하고 스페셜 곡 정보 초기화
							if (luckyTrack) {
								reset();

								//만약 플레이리스트에 곡이 하나도 없는 상태였다면 플레이어 숨김 처리
								if (!playlist.tracks[0]) {
									const container = document.getElementById("player");
									if (container) container.style.display = "none";
								}
							}

							if (!playlist.currentTrack && !playlist.nextTrack) setShowStopIcon(true);
							break;
						case YT.PlayerState.CUED:
							var videoData = event.target.getVideoData();
							var title = videoData.title;

							const current = playlist.currentTrack || playlist.nextTrack;
							if (current) dispatchPlaylist({type: "UPDATE_TRACK_TITLE", payload: {videoId: extractVideoId(current.url), title}});

							setIsVideoError(false);
							playerRef.current.playVideo();
							break;
						case YT.PlayerState.PAUSED:
							setIsPlay(false);
							break;
						case YT.PlayerState.PLAYING:
							setIsPlay(true);
							break;
						default:
							break;
					}
				},
			},
		});
	};

	// 현재 재생 중인 곡의 url이 업데이트될때마다 재생 큐 (제목 업데이트 시에는 트리거 되지 않게 dependency를 세분화함)
	const currentVideoId = useMemo(() => extractVideoId(playlist.currentTrack?.url ?? ""), [playlist.currentTrack?.url]);

	useEffect(() => {
		if (!playlist.currentTrack || !currentVideoId) return;

		cueVideo(currentVideoId);
	}, [currentVideoId]);

	//곡 재생 중 progress bar 업데이트를 위한 타이머
	useEffect(() => {
		if (!playerRef.current || !(playerRef.current instanceof YT.Player)) return;

		const intervalId = setInterval(() => {
			if (playerRef.current && typeof playerRef.current.getDuration === "function") {
				const duration = playerRef.current.getDuration();
				const currentTime = playerRef.current.getCurrentTime();
				setProgressTime(Math.min((currentTime / duration) * 100, 100));
			}
		}, 1000);

		return () => clearInterval(intervalId);
	}, [playerRef.current, currentVideoId]);

	useEffect(() => {
		if (shuffleMode) {
			//const current = currentTrackRef.current;

			dispatchPlaylist({type: "SHUFFLE_TRACKS"});

			if (showStopIcon) {
				setShowStopIcon(false);

				if (playerRef.current) {
					playerRef.current.seekTo(0);
					playerRef.current.playVideo();
				}
			}
		} else {
			dispatchPlaylist({type: "UNSHUFFLE_TRACKS"});
		}
	}, [shuffleMode]);

	const handlePlayNext = () => {
		if (showStopIcon) return;

		// 에러난 동영상을 처리 중인 경우는 스킵 조작을 무시
		if (!luckyTrack && isVideoError) return;

		const nextTrack = playlist.nextTrack;
		if (!nextTrack) {
			console.log("✋ End of playlist");
			setShowStopIcon(true);

			if (playlist.tracks.length === 0) cleanUpPlaylist();
		}

		dispatchPlaylist({type: "PLAY_NEXT"});
		reset(); //다음 곡 재생인 경우 스페셜 트랙 정보 초기화
	};

	const handlePlayPrev = () => {
		setShowStopIcon(false);

		//스페셜 곡은 항상 첫번째 곡이기 때문에 이전으로 넘길 수 없음
		if (luckyTrack || isVideoError) return;

		dispatchPlaylist({type: "PLAY_PREVIOUS"});
	};

	//TODO: luckytrack 재생 중에 곡이 추가되면 다음 곡이 재생되는 문제
	const handleAddTrack = async (): Promise<void> => {
		const trackToAdd = document.getElementById("newSong") as HTMLInputElement;
		const url = trackToAdd.value;

		if (url) {
			//연달아 더하기를 누른 경우는 무시
			const id = extractVideoId(url);

			//url에서 id가 추출되지 않거나 유튜브 url이 아닌 경우는 에러 메시지 출력
			const youtubeUrlPattern = /^(https?\:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$/;
			if (!id || !youtubeUrlPattern.test(url)) {
				trackToAdd.value = "Not a valid Youtube url";
			} else {
				trackToAdd.value = "Adding track...";

				//lucky track이 있는 경우는 현재 재생 곡을 방해하지 않게 따로 플래그 추가
				dispatchPlaylist({type: "ADD_TRACK", payload: {url, title: "", isLucky: !!luckyTrack}});
				setShowStopIcon(false);

				const container = document.getElementById("player");
				if (container) container.style.display = "block";

				const newTrack = {id: extractVideoId(url) + playlist.tracks.length + new Date().getSeconds(), url, title: ""};
				try {
					await apiRequest("/api/playlist", {
						method: "POST",
						data: {id: playlist.objectId, track: newTrack, mode: "add"},
					});
					// *중요* reducer로 트랙을 ui에 반영하고 있기 때문에 굳이 mutation 후 서버에서 다시 플레이리스트 정보를 가져올 필요 없이, 쿼리 무효화로 다른 컴포넌트에서 최신 정보가 반영되도록 처리
					await queryClient.invalidateQueries({queryKey: ["playlist"], refetchType: "none"});
					trackToAdd.value = "Track added!";
				} catch (error) {
					console.error("Failed to update playlist:", error);
					trackToAdd.value = "Error saving changes";
				}
			}
		} else {
			trackToAdd.value = "Entered url is empty";
		}

		setTimeout(() => {
			trackToAdd.value = "";
		}, 1500);
	};

	const handleRemoveTrack = async () => {
		const currentTrack = playlist.currentTrack;

		if (currentTrack) {
			try {
				await apiRequest("/api/playlist", {
					method: "POST",
					data: {id: playlist.objectId, track: currentTrack, mode: "remove"},
				});
				await queryClient.invalidateQueries({queryKey: ["playlist"], refetchType: "none"});

				setIsVideoError(false);
				dispatchPlaylist({type: "REMOVE_TRACK", payload: {id: currentTrack.id}});

				//곡이 제거된 후 다음 곡이 있으면 재생, 없으면 플레이어 초기화
				const nextTrack = playlist.nextTrack;
				if (nextTrack) {
					cueVideo(extractVideoId(nextTrack.url));
					setShowStopIcon(false);
				} else {
					// 남은 곡이 없는 경우: player 삭제 + 재생 상태 변경 + index를 0으로 재지정 + currenttrack 초기화
					cleanUpPlaylist();
				}
			} catch (error) {
				const trackToAdd = document.getElementById("newSong") as HTMLInputElement;
				console.error("Failed to update playlist:", error);
				trackToAdd.value = "Error removing track";

				setTimeout(() => {
					trackToAdd.value = "";
				}, 2000);
			}
		}
		setShowPopup(false);
	};

	const handleEmptyPlaylist = async () => {
		try {
			await apiRequest("/api/playlist", {
				method: "POST",
				data: {id: playlist.objectId, track: undefined, mode: "empty"},
			});
			await queryClient.invalidateQueries({queryKey: ["playlist"], refetchType: "none"});

			dispatchPlaylist({type: "EMPTY"});
			cleanUpPlaylist();
			setShowPopup(false);
			setShowStopIcon(false);
			setIsPlay(true);
		} catch (error) {
			console.error("Failed to empty playlist:", error);
		}
	};

	const cleanUpPlaylist = () => {
		console.log("🧹 Cleaning up the playlist");

		//플레이어가 사라진 것처럼 보이게
		const container = document.getElementById("player");
		if (container) container.style.display = "none";

		if (playerRef.current) {
			reset(); //스페셜 트랙 정보 초기화
			playerRef.current.cueVideoById("");
			// playerRef.current.destroy();
			// playerRef.current = null;
		}
		setShowStopIcon(false);
		setIsPlay(false);
		//currentTrackRef.current = undefined;
	};

	const handleLogout = async () => {
		try {
			await apiRequest("/api/logout", {method: "POST"});
			localStorage.removeItem("interactionOver");
			await queryClient.invalidateQueries({queryKey: ["session"], refetchType: "none"});

			window.location.href = "/";
		} catch (error) {
			console.log("Error logging out", error);
		}
	};

	const handlePopAction = (type: "a" | "b") => {
		if (type === "a") {
			switch (modeValues[popupType]) {
				case "remove":
					if (!luckyTrack) handleRemoveTrack();
					break;
				case "empty":
					handleEmptyPlaylist();
					break;
				case "logout":
					handleLogout();
					break;
				default:
					break;
			}
		} else {
			setPopupType(-1);
		}
	};

	const getPopupMessage = () => {
		if (modeValues[popupType] === "logout") return messages.logout;
		if (modeValues[popupType] === "remove" && luckyTrack) return messages.special;
		if (playlist.tracks?.length === 0) return messages.none;
		else return messages[modeValues[popupType]];
	};

	const showConfirm = () => {
		const mode = modeValues[popupType];
		if (mode === "logout") return true;
		else if (playlist.tracks?.length === 0) return false;
		else if (luckyTrack && modeValues[popupType] === "remove") return false;
		else return true;
	};

	return (
		<section className="flex flex-col items-center w-full h-full justify-between gap-spacing-10 bg-gray-2 p-spacing-10 text-black relative">
			<div className="flex flex-row w-full justify-between items-center gap-2">
				<div className="flex flex-row gap-2 items-center">
					<span>{formatDate(currentTime)}</span>
					<button onClick={() => handleMute()}>{!isMute ? <SpeakerWaveIcon className="size-4 mb-px" /> : <SpeakerXMarkIcon className="size-4 mb-px" />}</button>
				</div>
				<div className="flex flex-row items-center gap-2">
					<span>{formatTime(currentTime)}</span>
					<div id="battery" className="flex flex-row w-fit items-center">
						<div className="relative border border-px border-black w-[1.6rem] h-[0.8rem] bg-transparent rounded-[0.2rem]">
							<div className="absolute rounded-xs max-w-[1.2rem] max-h-[0.4rem] w-full h-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
								<div
									className={`h-full ${parseFloat(expiration) <= 15 ? (parseFloat(expiration) <= 5 ? "bg-red-700 animate-blink" : "bg-red-700") : "bg-black"}`}
									style={{width: expiration || "100%"}}
								></div>
							</div>
						</div>
						<div className="w-[0.15rem] h-[0.5rem] bg-black rounded-r-sm"></div>
					</div>
				</div>
			</div>
			<div className="flex flex-row w-full text-s gap-spacing-4">
				<input id="newSong" type="text" placeholder="Enter a Youtube Url" className="w-full text-xs bg-gray-1 border border-black rounded-[1px] px-3" />
				<button onClick={handleAddTrack}>
					<PlusCircleIcon className={DEFAULT_ICON_SIZE} />
				</button>
			</div>
			<div className="track-info flex flex-row w-full items-center justify-start gap-spacing-10">
				<div id="player" className="pointer-events-none"></div>
				{isVideoError ? (
					<p className="text-xs line-clamp-2 whitespace-pre-line">{`⚠️ Video not available:\n removing from playlist...`}</p>
				) : (
					<p className="text-xs line-clamp-2">{luckyTrack?.title || playlist.currentTrack?.title || playlist.nextTrack?.title}</p>
				)}
			</div>
			<span className="text-xxs mt-auto">
				{shuffleMode ? "shuffle on" : luckyTrack ? "special track" : showStopIcon ? "end of playlist" : `track ${trackIndexLabel}`}
			</span>
			<div className="flex flex-row w-full justify-between items-center">
				<button onClick={handlePlayPrev}>
					<BackwardIcon className={DEFAULT_ICON_SIZE} />
				</button>
				<button onClick={playVideo} disabled={showStopIcon || isVideoError}>
					{showStopIcon || isVideoError ? (
						<XCircleIcon className={DEFAULT_ICON_SIZE} />
					) : !isPlay ? (
						<PlayCircleIcon className={DEFAULT_ICON_SIZE} />
					) : (
						<PauseCircleIcon className={DEFAULT_ICON_SIZE} />
					)}
				</button>
				<button onClick={() => handlePlayNext()}>
					<ForwardIcon className={DEFAULT_ICON_SIZE} />
				</button>
			</div>
			<div className="w-full p-[2px] border border-px rounded-[1px] border-black">
				<div className="bg-black h-px" style={{width: progressTime.toFixed(2) + "%"}} />
			</div>
			{showPopup && (
				<div className="absolute bg-transparent w-full h-full flex items-center justify-center bottom-spacing-2">
					<div className="border border-px border-black w-2/3 h-2/3 rounded-[1px] p-spacing-16 bg-gray-2 flex flex-col justify-between items-center">
						<div className="flex flex-col items-start justify-start h-fit">
							<button disabled={!luckyTrack} className="h-8 leading-8 flex flex-row items-center gap-2">
								<PlayIcon className={`size-5 animate-blink fill-black ${modeValues[mode] === "remove" ? "h-fit" : "h-0"}`} />
								Remove
							</button>
							<button className="h-8 leading-8 flex flex-row items-center gap-2" onClick={() => setShuffleMode(prev => !prev)}>
								<PlayIcon className={`size-5 animate-blink ${modeValues[mode] === "shuffle" ? "h-fit" : "h-0"}`} />
								{`Shuffle <${shuffleMode ? "on" : "off"}>`}
							</button>
							<button className="h-8 leading-8 flex flex-row items-center gap-2">
								<PlayIcon className={`size-5 animate-blink ${modeValues[mode] === "empty" ? "h-fit" : "h-0"}`} />
								Empty
							</button>
							<button className="h-8 leading-8 flex flex-row items-center gap-2">
								<PlayIcon className={`size-5 animate-blink ${modeValues[mode] === "logout" ? "h-fit" : "h-0"}`} />
								Log out
							</button>
						</div>
						<div className="w-full flex flex-row items-center justify-between">
							<button className="flex flex-row items-center gap-spacing-4" onClick={() => setShowPopup(false)}>
								<span className="border-px border-black rounded-full border p-px flex items-center justify-center w-6 h-6 bg-gray-1">B</span>
								<span>close</span>
							</button>
							<button className="flex flex-row items-center gap-spacing-4" onClick={() => setPopupType(mode)}>
								<span className="border-px border-black rounded-full border p-px flex items-center justify-center w-6 h-6 bg-gray-1">A</span>
								<span>confirm</span>
							</button>
						</div>
					</div>
				</div>
			)}
			{showPopup && modeValues[popupType] && (
				<div className="absolute bg-transparent w-full h-full flex items-center justify-center bottom-spacing-2">
					<div className="border border-px border-black w-2/3 h-2/3 rounded-[1px] text-center p-spacing-16 py-spacing-24 bg-gray-2 flex flex-col justify-between items-center">
						<span className="leading-8 whitespace-pre-line">{getPopupMessage()}</span>
						{luckyTrack?.id && modeValues[popupType] === "remove" && <img src="./icon/alien.gif" alt="alien" className="w-5 h-5 mt-4" />}

						<div className="w-full flex flex-row items-center justify-between">
							<button className="flex flex-row items-center gap-spacing-4" onClick={() => handlePopAction("b")}>
								<span className="border-px border-black rounded-full border p-px flex items-center justify-center w-6 h-6 bg-gray-1">B</span>
								<span>cancel</span>
							</button>
							{showConfirm() && (
								<button className="flex flex-row items-center gap-spacing-4" onClick={() => handlePopAction("a")}>
									<span className="border-px border-black rounded-full border p-px flex items-center justify-center w-6 h-6 bg-gray-1">A</span>
									<span>confirm</span>
								</button>
							)}
						</div>
					</div>
				</div>
			)}
		</section>
	);
}
