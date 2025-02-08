import React, {useState, useEffect, useRef, useCallback} from "react";
import {Battery100Icon} from "@heroicons/react/24/solid";
import {PlayIcon, PauseCircleIcon, BackwardIcon, ForwardIcon, PlusCircleIcon} from "@heroicons/react/16/solid";
import Playlist, {Track} from "../classes/Playlist";
import {apiRequest} from "../lib/tools";
import {Triggers} from "../page";

declare global {
	interface Window {
		onYouTubeIframeAPIReady: () => void;
	}
}

type PlayScreenProps = {
	playlist: Playlist;
	triggers: Triggers;
	chosenTrack: string;
};

//세부 메뉴 선택지
const modeValues: string[] = ["remove", "shuffle", "empty", "logout"];
type ModeIndex = -1 | Extract<keyof typeof modeValues, number>;
const messages: Partial<Record<(typeof modeValues)[number], string>> = {
	remove: "Remove current track from playlist?",
	empty: "Empty current playlist?",
	logout: "Log out from current account?",
	shuffle: "",
	none: "Playlist is already empty",
};

export default function PlayScreen({playlist, triggers, chosenTrack}: PlayScreenProps) {
	const [currentTrack, setCurrentTrack] = useState<Track | undefined>(undefined);
	const [isPlay, setIsPlay] = useState<boolean>(false);
	const [progressTime, setProgressTime] = useState<number>(0);
	const [currentTime, setCurrentTime] = useState<Date>(new Date());
	const [showPopup, setShowPopup] = useState<boolean>(false);
	const [trackIndex, setTrackIndex] = useState<string>("0 out of 0");
	const [shuffleMode, setShuffleMode] = useState<boolean>(false);
	const [mode, setMode] = useState<ModeIndex>(0);
	const [popupType, setPopupType] = useState<ModeIndex>(-1);
	const [specialTrackInfo, setSpecialTrackInfo] = useState<string>("");
	const playerRef = useRef<any>(null);

	const defaultIconSize = "size-6";

	//유저가 직접 재생/일시중지를 트리거 할 때만 사용하지만
	//player를 initialize할 때 자동 재생 효과를 주기 위해 예외로 사용
	const playVideo = useCallback(() => {
		if (!playerRef.current) {
			return;
		}
		if (!isPlay) {
			playerRef.current.playVideo();
		} else {
			playerRef.current.pauseVideo();
		}
		setIsPlay(!isPlay);
	}, [isPlay]);

	/* cue 과정은 동영상의 제목을 가져오기 위해 거쳐가는 필수 단계
	cue 상태만 트리거하고 여기서 재생에는 관여하지 않는다 */
	const cueVideo = useCallback(
		(id: string) => {
			if (!playerRef.current) return;
			playerRef.current.cueVideoById(id); //yt api의 method를 통해 cued 상태로 전환
		},
		[playerRef]
	);

	const handleAddSong = async (): Promise<void> => {
		const songToAdd = document.getElementById("newSong") as HTMLInputElement;
		const url = songToAdd.value;
		if (url) {
			songToAdd.value = "Music Added!";

			const newTrack = playlist.addTrack(url);
			setTrackIndex(playlist.getTrackIndex());

			//재생 중인 곡이 없다면 바로 새로 추가된 곡을 재생
			console.log(playlist.extractVideoId(url), currentTrack, playerRef.current);
			if (!currentTrack && !specialTrackInfo) {
				console.log("load doesnt work?", playerRef.current);
				if (playerRef.current) playerRef.current?.cueVideoById(playlist.extractVideoId(url));
				else setCurrentTrack(newTrack); //player가 initialized 되지 않았으므로 트리거
			}

			const response = await apiRequest("/api/playlist", "POST", {
				id: playlist.getObjectId(),
				track: newTrack,
				mode: "add",
			});
			if (response?.error) {
				console.error("Failed to update playlist:", response.error);
				songToAdd.value = "Error saving changes";
			}
		} else {
			songToAdd.value = "Enter a valid URL";
		}
		setTimeout(() => {
			songToAdd.value = "";
		}, 1500);
	};

	const handlePlayNext = useCallback(() => {
		//스페셜 곡을 재생 중인 경우는 다음 곡을 재생하는게 아니라 플레이리스트의 첫 곡을 재생한다
		if (specialTrackInfo) {
			const next = playlist.getCurrentTrack();
			if (next) cueVideo(playlist.extractVideoId(next.url));
		} else {
			const nextTrack = playlist.playNext();
			if (nextTrack) {
				cueVideo(nextTrack);
			}
		}
		// *중요*: 스페셜 곡은 하나기 때문에 다음 곡 재생인 경우 스페셜 곡 정보를 제거
		setSpecialTrackInfo("");
	}, [playlist, cueVideo, specialTrackInfo]);

	const handlePlayPrev = () => {
		if (!specialTrackInfo) {
			const prevTrack = playlist.playPrevious();
			if (prevTrack) {
				cueVideo(prevTrack);
			}
		}
	};

	const handleRemoveTrack = async (isRemove: boolean = true) => {
		if (isRemove && currentTrack) {
			const response = await apiRequest("/api/playlist", "POST", {
				id: playlist.getObjectId(),
				track: playlist.getCurrentTrack(),
				mode: "remove",
			});

			if (response?.error) {
				const songToAdd = document.getElementById("newSong") as HTMLInputElement;
				console.error("Failed to update playlist:", response.error);
				songToAdd.value = "Error saving changes";
			} else {
				const nextTrack = playlist.removeTrack(currentTrack?.id);
				if (nextTrack) {
					playerRef.current.cueVideoById(nextTrack);
				} else {
					playerRef.current.destroy();
					playerRef.current = null;
					setIsPlay(false);
					setCurrentTrack(undefined);
				}
			}
		}
		setShowPopup(false);
	};

	const formatDate = (date: Date): string => {
		const options: Intl.DateTimeFormatOptions = {
			month: "2-digit",
			day: "2-digit",
			weekday: "short",
		};
		return new Intl.DateTimeFormat("en-US", options).format(date).replace(/\//g, ".");
	};

	const formatTime = (date: Date): string => {
		const options: Intl.DateTimeFormatOptions = {
			hour: "2-digit",
			minute: "2-digit",
			hour12: true, // AM/PM format
		};
		return new Intl.DateTimeFormat("en-US", options).format(date);
	};

	useEffect(() => {
		const timer = setInterval(() => {
			setCurrentTime(new Date());
		}, 1000);
		return () => clearInterval(timer);
	}, []);

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

		if ((!window.YT?.Player || !playerRef.current) && playlist) {
			loadYTScript();
		}

		if (chosenTrack) console.log("🍀 Today's special track - ", chosenTrack);

		let intervalId;

		function onYouTubeIframeAPIReady() {
			console.log("API Ready - Initializing player");
			const track = chosenTrack || currentTrack?.url || playlist.tracks[0]?.url;
			if (track) initializePlayer(playlist.extractVideoId(track));
			// const initialVideoId = playlist.extractVideoId(track); // 첫번째 트랙의 동영상 id를 가져오기
			// if (initialVideoId) {
			// 	playerRef.current = new YT.Player("player", {
			// 		height: "50",
			// 		width: "50",
			// 		videoId: initialVideoId,
			// 		events: {
			// 			onReady: event => {
			// 				console.log("Player Ready");
			// 				var videoData = event.target.getVideoData();
			// 				var title = videoData.title;
			// 				if (!chosenTrack) {
			// 					playlist.updateTrackTitle(initialVideoId, title);
			// 					setCurrentTrack(playlist.getCurrentTrack());
			// 					setTrackIndex(playlist.getTrackIndex());
			// 				} else {
			// 					// 이벤트 곡의 타이틀을 별도로 저장
			// 					setSpecialTrackInfo(title);
			// 				}
			// 				playVideo();
			// 				intervalId = setInterval(() => {
			// 					if (playerRef.current) {
			// 						const duration = playerRef.current.getDuration();
			// 						const currentTime = playerRef.current.getCurrentTime();
			// 						setProgressTime(Math.min((currentTime / duration) * 100, 100));
			// 					}
			// 				}, 1000);
			// 			},
			// 			onError: event => {
			// 				console.log("❌ Video unavailable");
			// 				//스페셜 곡이 에러난 경우에만 삭제 처리
			// 				if (chosenTrack.includes(initialVideoId)) playerRef.current.destroy();
			// 			},
			// 			onStateChange: handlePlayerStateChange,
			// 		},
			// 	});
			//}
		}

		// const handlePlayerStateChange = (event: YT.OnStateChangeEvent) => {
		// 	//이전 곡 재생 완료 시 다음 곡 자동 재생
		// 	if (event.data === YT.PlayerState.ENDED) {
		// 		console.log("video ended");
		// 		//스페셜 곡이 재생 완료 된 것을 확인 후 원래 플레이리스트의 첫 곡을 재생
		// 		if (event.target.getVideoData()?.video_id === playlist.extractVideoId(chosenTrack)) {
		// 			setSpecialTrackInfo("");
		// 			cueVideo(playlist.extractVideoId(playlist.tracks[0].url));
		// 		} else handlePlayNext();
		// 	} else if (event.data === YT.PlayerState.CUED) {
		// 		console.log("video cued");
		// 		var videoData = event.target.getVideoData();
		// 		var title = videoData.title;
		// 		const current = playlist.getCurrentTrack();
		// 		console.log(playlist.getTrackIndex());
		// 		if (current?.url) {
		// 			playlist.updateTrackTitle(current.url, title);
		// 			setCurrentTrack({...current, title: title});
		// 			setTrackIndex(playlist.getTrackIndex());
		// 			playerRef.current.playVideo();
		// 		}
		// 	}
		// };

		window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
	}, [playlist]);

	useEffect(() => {
		if (!playerRef.current && currentTrack) {
			initializePlayer(playlist.extractVideoId(currentTrack.url));
		}
	}, [currentTrack, playerRef.current]);

	const initializePlayer = (initialVideoId: string) => {
		let intervalId;
		playerRef.current = new YT.Player("player", {
			height: "50",
			width: "50",
			videoId: initialVideoId,
			events: {
				onReady: event => {
					console.log(`✅ Video ${initialVideoId} is Ready`);
					var videoData = event.target.getVideoData();
					var title = videoData.title;
					if (!chosenTrack) {
						playlist.updateTrackTitle(initialVideoId, title);
						setCurrentTrack(playlist.getCurrentTrack());
						setTrackIndex(playlist.getTrackIndex());
					} else {
						// 이벤트 곡의 타이틀을 별도로 저장
						setSpecialTrackInfo(title);
					}
					playVideo();
					intervalId = setInterval(() => {
						if (playerRef.current) {
							const duration = playerRef.current.getDuration();
							const currentTime = playerRef.current.getCurrentTime();
							setProgressTime(Math.min((currentTime / duration) * 100, 100));
						}
					}, 1000);
				},
				onError: event => {
					console.log("❌ Video unavailable");
					//스페셜 곡이 에러난 경우에만 삭제 처리
					if (chosenTrack.includes(initialVideoId)) playerRef.current.destroy();
				},
				onStateChange: (event: YT.OnStateChangeEvent) => {
					//이전 곡 재생 완료 시 다음 곡 자동 재생
					if (event.data === YT.PlayerState.ENDED) {
						//스페셜 곡이 재생 완료 된 것을 확인 후 원래 플레이리스트의 첫 곡을 재생
						if (event.target.getVideoData()?.video_id === playlist.extractVideoId(chosenTrack)) {
							setSpecialTrackInfo("");
							cueVideo(playlist.extractVideoId(playlist.tracks[0].url));
						} else handlePlayNext();
					} else if (event.data === YT.PlayerState.CUED) {
						var videoData = event.target.getVideoData();
						var title = videoData.title;
						const current = playlist.getCurrentTrack();
						console.log(playlist.getTrackIndex());
						if (current?.url) {
							playlist.updateTrackTitle(current.url, title);
							setCurrentTrack({...current, title: title});
							setTrackIndex(playlist.getTrackIndex());
							playerRef.current.playVideo();
						}
					}
				},
			},
		});
	};

	// useEffect(() => {
	// 	const current = playlist.getCurrentTrack();
	// 	console.log("current: ", current?.title);
	// 	if (current) {
	// 		setCurrentTrack(current);
	// 		setTrackIndex(playlist.getTrackIndex());
	// 	}
	// }, [playlist, playlist.currentTrack]);

	// useEffect(() => {
	// 	const {prev, current} = triggers;
	// 	if (!current) return;
	// 	if (current === "select" && currentTrack) {
	// 		setShowPopup(true);
	// 		return;
	// 	}

	// 	//추후 다른 케이스 추가 가능성 있음
	// 	// if (prev === "select") {
	// 	// 	switch (current) {
	// 	// 		case "a":
	// 	// 			if (modeValues === "remove") handleRemoveTrack();
	// 	// 			else if (mode === "shuffle") setShuffleMode(prev => !prev);
	// 	// 			else if (mode === "empty") handleEmptyPlaylist();
	// 	// 			else if (mode === "logout") handleLogout();
	// 	// 			break;
	// 	// 		case "b":
	// 	// 			setShowPopup(false);
	// 	// 			break;
	// 	// 		default:
	// 	// 			break;
	// 	// 	}
	// 	// } else {
	// 	// 	switch (current) {
	// 	// 		case "right":
	// 	// 			handlePlayNext();
	// 	// 			break;
	// 	// 		case "left":
	// 	// 			handlePlayPrev();
	// 	// 			break;
	// 	// 		default:
	// 	// 			break;
	// 	// 	}
	// 	// }
	// 	const isSecondPopup = mode === popupType;

	// 	if (prev === "select") {
	// 		if (current === "a") {
	// 			//이미 상세 팝업이 떠있는 경우와 아직 기본 메뉴창인 경우로 분리
	// 			if (!isSecondPopup) {
	// 				if (modeValues[mode] === "shuffle") setShuffleMode(prev => !prev);
	// 				else setPopupType(mode);
	// 			} else {
	// 				handlePopAction(current);
	// 			}
	// 		} else if (current === "b") {
	// 			if (!isSecondPopup) {
	// 				setShowPopup(false);
	// 			} else setPopupType(-1);
	// 		} else if (current === "down") {
	// 			if (!isSecondPopup) setMode(mode === modeValues.length - 1 ? 0 : mode + 1);
	// 		} else if (current === "up") {
	// 			if (!isSecondPopup) setMode(mode === 0 ? modeValues.length - 1 : mode - 1);
	// 		} else if (current === "right") {
	// 			if (!showPopup) handlePlayNext();
	// 		} else if (current === "left") {
	// 			if (!showPopup) handlePlayPrev();
	// 		}
	// 	} else if (prev === "a" && isSecondPopup) {
	// 		if (current == "a" || current === "b") handlePopAction(current);
	// 	}
	// }, [triggers]);

	useEffect(() => {
		const {prev, current} = triggers;

		if (current === "select") {
			setShowPopup(true);
			return;
		}

		const isSecondPopup = mode === popupType;
		// 2dpeth 메뉴창이 켜진 경우
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
		} else if (showPopup) {
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
		} else {
			if (current === "left") handlePlayPrev();
			else if (current === "right") handlePlayNext();
		}
	}, [showPopup, triggers]);

	// const handleTriggers = (current: "a" | "b" | "up" | "down" | "left" | "right" | "select" | "power") => {
	// 	const isSecondPopup = mode === popupType && popupType !== -1;
	// 	switch (current) {
	// 		case "a":
	// 			if (isSecondPopup) handlePopAction(current);
	// 			else setPopupType(mode);
	// 			break;
	// 		case "b":
	// 			console.log("huh");
	// 			if (isSecondPopup) handlePopAction(current);
	// 			else setPopupType(-1);
	// 			break;
	// 		case "up":
	// 			if (!isSecondPopup) setMode(mode === 0 ? modeValues.length - 1 : mode - 1);
	// 			break;
	// 		case "down":
	// 			if (!isSecondPopup) setMode(mode === modeValues.length - 1 ? 0 : mode + 1);
	// 			break;
	// 		case "right":
	// 			if (!showPopup) handlePlayNext();
	// 			break;
	// 		case "left":
	// 			if (!showPopup) handlePlayPrev();
	// 			break;
	// 		default:
	// 			break;
	// 	}
	// };

	useEffect(() => {
		//메뉴창이 닫히면 무조건 mode => 0, popuptype => -1로 지정
		if (!showPopup) {
			setMode(0);
			setPopupType(-1);
		}
	}, [showPopup]);

	useEffect(() => {
		if (shuffleMode) playlist.shuffleTracks();
		else playlist.unshuffleTracks();
	}, [shuffleMode]);

	const handleLogout = async () => {};

	const handleEmptyPlaylist = async () => {
		try {
			const response = await apiRequest("/api/playlist", "POST", {
				id: playlist.getObjectId(),
				track: undefined,
				mode: "empty",
			});
			if (response?.error) {
				console.error("Failed to empty playlist:", response.error);
			} else {
				playlist.empty();
				setCurrentTrack(undefined);
				setShowPopup(false);
				if (playerRef?.current) playerRef.current.destroy();
			}
		} catch (error) {
			console.error("Failed to empty playlist:", error);
		}
	};

	const handlePopAction = (type: "a" | "b") => {
		if (type === "a") {
			switch (modeValues[popupType]) {
				case "remove":
					handleRemoveTrack();
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

	return (
		<div className="flex flex-col items-center w-full h-full justify-between gap-spacing-10 bg-gray-2 p-spacing-10 text-black relative">
			<div className="flex flex-row w-full justify-end items-center gap-2">
				<span className="mr-auto">{formatDate(currentTime)}</span>
				<span>{formatTime(currentTime)}</span>
				<Battery100Icon className="mb-px size-8" />
			</div>
			<div className="flex flex-row w-full text-s gap-spacing-4">
				<input id="newSong" type="text" placeholder="Enter a Youtube Url" className="w-full text-xs bg-gray-1 border border-black rounded-[1px] px-3" />
				<button onClick={handleAddSong}>
					<PlusCircleIcon className={defaultIconSize} />
				</button>
			</div>
			<div className="track-info flex flex-row w-full items-center justify-start gap-spacing-10">
				<div id="player"></div>
				<p className="text-xs line-clamp-2">{specialTrackInfo || currentTrack?.title}</p>
			</div>
			<span className="text-xxs mt-auto">{specialTrackInfo ? "special track" : `track ${trackIndex}`}</span>
			<div className="flex flex-row w-full justify-between items-center">
				<button onClick={handlePlayPrev}>
					<BackwardIcon className={defaultIconSize} />
				</button>
				<button onClick={playVideo}>{!isPlay ? <PlayIcon className={defaultIconSize} /> : <PauseCircleIcon className={defaultIconSize} />}</button>
				<button onClick={handlePlayNext}>
					<ForwardIcon className={defaultIconSize} />
				</button>
			</div>
			<div className="w-full p-px border border-px rounded-[1px] border-black">
				<div className="bg-black h-px" style={{width: progressTime.toFixed(2) + "%"}} />
			</div>
			{showPopup && (
				<div className="absolute bg-transparent w-full h-full flex items-center justify-center bottom-spacing-2">
					<div className="border border-px border-black w-2/3 h-2/3 rounded-[1px] p-spacing-16 bg-gray-2 flex flex-col justify-between items-center">
						<div className="flex flex-col items-start justify-start">
							<button className="leading-8 flex flex-row items-center gap-2">
								<PlayIcon className={`size-5 animate-blink ${modeValues[mode] === "remove" ? "h-fit" : "h-0"}`} />
								Remove
							</button>
							<button className="leading-8 flex flex-row items-center gap-2" onClick={() => setShuffleMode(prev => !prev)}>
								<PlayIcon className={`size-5 animate-blink ${modeValues[mode] === "shuffle" ? "h-fit" : "h-0"}`} />
								{`Shuffle <${shuffleMode ? "on" : "off"}>`}
							</button>
							<button className="leading-8 flex flex-row items-center gap-2">
								<PlayIcon className={`size-5 animate-blink ${modeValues[mode] === "empty" ? "h-fit" : "h-0"}`} />
								Empty
							</button>
							<button className="leading-8 flex flex-row items-center gap-2">
								<PlayIcon className={`size-5 animate-blink ${modeValues[mode] === "logout" ? "h-fit" : "h-0"}`} />
								Log out
							</button>
						</div>
						<div className="w-full flex flex-row items-center justify-between">
							<div className="flex flex-row items-center gap-spacing-4" onClick={() => setShowPopup(false)}>
								<span className="border-px border-black rounded-full border p-px flex items-center justify-center w-6 h-6 bg-gray-1">B</span>
								<span>close</span>
							</div>
							<div className="flex flex-row items-center gap-spacing-4" onClick={() => setPopupType(mode)}>
								<span className="border-px border-black rounded-full border p-px flex items-center justify-center w-6 h-6 bg-gray-1">A</span>
								<span>confirm</span>
							</div>
						</div>
						{/* <div className="w-full flex flex-row items-center justify-between">
							<div className="flex flex-row items-center gap-spacing-4" onClick={() => handleRemoveTrack(false)}>
								<span className="border-px border-black rounded-full border p-px flex items-center justify-center w-6 h-6 bg-gray-1">B</span>
								<span>close</span>
							</div>
						</div> */}
					</div>
				</div>
			)}
			{showPopup && modeValues[popupType] && (
				<div className="absolute bg-transparent w-full h-full flex items-center justify-center bottom-spacing-2">
					<div className="border border-px border-black w-2/3 h-2/3 rounded-[1px] text-center p-spacing-16 py-spacing-24 bg-gray-2 flex flex-col justify-between items-center">
						<span className="leading-8">{playlist.tracks?.length === 0 ? messages.none : messages[modeValues[popupType]]}</span>
						<div className="w-full flex flex-row items-center justify-between">
							<div className="flex flex-row items-center gap-spacing-4" onClick={() => handlePopAction("b")}>
								<span className="border-px border-black rounded-full border p-px flex items-center justify-center w-6 h-6 bg-gray-1">B</span>
								<span>cancel</span>
							</div>
							{playlist.tracks?.length !== 0 && (
								<div className="flex flex-row items-center gap-spacing-4" onClick={() => handlePopAction("a")}>
									<span className="border-px border-black rounded-full border p-px flex items-center justify-center w-6 h-6 bg-gray-1">A</span>
									<span>confirm</span>
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
