import React, {useState, useEffect, useRef, useCallback} from "react";
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
import Playlist, {Track} from "../classes/Playlist";
import {apiRequest} from "../lib/tools";
import {Triggers} from "../page";
import Image from "next/image";

declare global {
	interface Window {
		onYouTubeIframeAPIReady: () => void;
	}
}

type PlayScreenProps = {
	playlist: Playlist;
	triggers: Triggers;
	chosenTrack: string;
	setIsLogin: React.Dispatch<React.SetStateAction<boolean | undefined>>;
	expiration: string;
};

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

export default function PlayScreen({playlist, triggers, chosenTrack, setIsLogin, expiration}: PlayScreenProps) {
	const [isPlay, setIsPlay] = useState<boolean>(false);
	const [progressTime, setProgressTime] = useState<number>(0);
	const [currentTime, setCurrentTime] = useState<Date>(new Date());
	const [showPopup, setShowPopup] = useState<boolean>(false);
	const [trackIndex, setTrackIndex] = useState<string>("0 out of 0");
	const [shuffleMode, setShuffleMode] = useState<boolean>(false);
	const [mode, setMode] = useState<ModeIndex>(0);
	const [popupType, setPopupType] = useState<ModeIndex>(-1);
	const [specialTrackInfo, setSpecialTrackInfo] = useState<string>("");
	const [isError, setIsError] = useState<boolean>(false); //TODO:에러시 메세지창을 위해
	const [isVideoError, setIsVideoError] = useState<boolean>(false); // 동영상 재생 에러인 경우
	const [isMute, setIsMute] = useState<boolean>(false);
	const [showStopIcon, setShowStopIcon] = useState<boolean>(false);
	const playerRef = useRef<any>(null);
	const currentTrackRef = useRef<Track | undefined>(undefined);

	const defaultIconSize = "size-6";

	// useEffect(() => {
	// 	console.log("📀 Playlist instance changed:", playlist);
	// }, [playlist]);

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
	const cueVideo = useCallback(
		(id: string) => {
			if (!playerRef.current || !(playerRef.current instanceof YT.Player)) return;
			playerRef.current.cueVideoById(id); //yt api의 method를 통해 cued 상태로 전환
		},
		[playlist]
	);

	const handleAddSong = async (): Promise<void> => {
		const songToAdd = document.getElementById("newSong") as HTMLInputElement;
		const url = songToAdd.value;
		if (url) {
			//연달아 더하기를 누른 경우는 무시
			if (muiscAddMessages.includes(url)) return;

			songToAdd.value = "Music Added!";

			const newTrack = playlist.addTrack(url);
			setTrackIndex(playlist.getTrackIndex());
			setShowStopIcon(false);

			const container = document.getElementById("player");
			if (container) container.style.display = "block";

			//재생 중인 곡이 없다면 바로 새로 추가된 곡을 재생
			if ((!currentTrackRef.current && !specialTrackInfo) || showStopIcon) {
				if (playerRef.current) {
					currentTrackRef.current = newTrack;
					playerRef.current.cueVideoById(playlist.extractVideoId(url));
				} else initializePlayer(playlist.extractVideoId(newTrack?.url));
			}

			const response = await apiRequest("/api/playlist", "POST", {id: playlist.getObjectId(), track: newTrack, mode: "add"});
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

	const handlePlayNext = (wasSpecialTrack: boolean = false) => {
		if (showStopIcon) return;
		// 에러난 동영상을 처리 중인 경우는 스킵 조작을 무시
		if (!wasSpecialTrack && isVideoError) return;
		//스페셜 곡을 재생 중인 경우는 다음 곡을 재생하는게 아니라 플레이리스트의 첫 곡을 재생한다
		const nextTrack = specialTrackInfo ? playlist.getCurrentTrack() : playlist.playNext(wasSpecialTrack);
		if (!nextTrack) {
			console.log("✋ End of playlist");
			return;
		}

		setSpecialTrackInfo("");
		currentTrackRef.current = nextTrack;
		cueVideo(playlist.extractVideoId(nextTrack.url));
	};

	const handlePlayPrev = () => {
		setShowStopIcon(false);
		//스페셜 곡은 항상 첫번째 곡이기 때문에 이전으로 넘길 수 없음
		if (specialTrackInfo) return;
		if (isVideoError) return;

		const prevTrack = playlist.playPrevious();
		if (prevTrack) {
			currentTrackRef.current = prevTrack;
			cueVideo(playlist.extractVideoId(prevTrack.url));
		}
	};

	const handleRemoveTrack = async (isRemove: boolean = true) => {
		if (isRemove && currentTrackRef.current) {
			const response = await apiRequest("/api/playlist", "POST", {id: playlist.getObjectId(), track: currentTrackRef.current, mode: "remove"});
			if (response?.error) {
				const songToAdd = document.getElementById("newSong") as HTMLInputElement;
				console.error("Failed to update playlist:", response.error);
				songToAdd.value = "Error saving changes";

				setTimeout(() => {
					songToAdd.value = "";
				}, 2000);
			} else {
				setIsVideoError(false);
				const nextTrack = playlist.removeTrack(currentTrackRef.current?.id);
				if (nextTrack) {
					currentTrackRef.current = nextTrack;
					cueVideo(playlist.extractVideoId(nextTrack.url));
					setShowStopIcon(false);
					// playerRef.current.stopVideo();
					// playerRef.current.loadVideoById(nextTrack);
				} else {
					// 남은 곡이 없는 경우: player 삭제 + 재생 상태 변경 + index를 0으로 재지정 + currenttrack 초기화
					cleanUpPlaylist();
				}
			}
		}
		setShowPopup(false);
	};

	const cleanUpPlaylist = () => {
		console.log("🧹 Cleaning up the playlist");

		//플레이어가 사라진 것처럼 보이게
		const container = document.getElementById("player");
		if (container) container.style.display = "none";

		if (playerRef.current) {
			setSpecialTrackInfo("");
			playerRef.current.cueVideoById("");
			// playerRef.current.destroy();
			// playerRef.current = null;
		}
		setShowStopIcon(false);
		setIsPlay(false);
		setTrackIndex("0 out of 0");
		currentTrackRef.current = undefined;
	};

	const formatDate = (date: Date): string => {
		const options: Intl.DateTimeFormatOptions = {month: "2-digit", day: "2-digit", weekday: "short"};
		return new Intl.DateTimeFormat("en-US", options).format(date).replace(",", ".").replace(/\//g, ".");
	};

	const formatTime = (date: Date): string => {
		const options: Intl.DateTimeFormatOptions = {
			hour: "2-digit",
			minute: "2-digit",
			hour12: true, // AM/PM format
		};
		return new Intl.DateTimeFormat("en-US", options).format(date);
	};

	const handleMute = () => {
		if (!playerRef.current) return;

		if (!isMute) playerRef.current.mute();
		else playerRef.current.unMute();
		setIsMute(prev => !prev);
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

		function onYouTubeIframeAPIReady() {
			console.log("API Ready - Initializing player");
			const track = chosenTrack || currentTrackRef.current?.url || playlist.tracks[0]?.url;
			if (track) initializePlayer(playlist.extractVideoId(track));
		}

		window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;
	}, [playlist]);

	useEffect(() => {
		if (!playerRef.current && window.YT?.Player) {
			// 보통 전원을 껐다킨 경우에 발동 되는데 chosenTrack은 빈 값일 것임
			// 하지만 스페셜 트랙은 휘발성이라 다시 이어서 재생 되지 않아도 괜찮음
			const initialTrack = currentTrackRef.current?.url || chosenTrack || playlist.getCurrentTrack()?.url;
			if (initialTrack) initializePlayer(playlist.extractVideoId(initialTrack));
		}
	}, [currentTrackRef, playerRef.current]);

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
					if (!chosenTrack) {
						playlist.updateTrackTitle(initialVideoId, title);
						currentTrackRef.current = playlist.getCurrentTrack();
						setTrackIndex(playlist.getTrackIndex());
					} else {
						// 이벤트 곡의 타이틀을 별도로 저장
						setSpecialTrackInfo(title);
					}
					playVideo();
				},
				onError: event => {
					console.log(`❌ Video ${initialVideoId} is unavailable`);
					setIsVideoError(true);

					//에러난 곡을 삭제 시도
					setTimeout(() => {
						if (chosenTrack.includes(initialVideoId)) {
							// 스페셜 곡은 유저에 원래 플레이리스트에 들어있지 않기 때문에 삭제 호출을 할 필요가 없다
							handlePlayNext(true);
						} else handleRemoveTrack();
					}, 1700);
				},
				onStateChange: (event: YT.OnStateChangeEvent) => {
					switch (event.data) {
						//이전 곡 재생 완료 시 다음 곡 자동 재생
						case YT.PlayerState.ENDED:
							const isSpecialTrack = event.target.getVideoData()?.video_id === playlist.extractVideoId(chosenTrack);
							const firstTrack = playlist.tracks[0];
							//스페셜 곡이 재생 완료 된 것을 확인 후 원래 플레이리스트의 첫 곡을 재생
							if (isSpecialTrack) {
								setSpecialTrackInfo("");
								if (firstTrack) {
									currentTrackRef.current = firstTrack;
									cueVideo(playlist.extractVideoId(firstTrack.url));
								} else {
									const container = document.getElementById("player");
									if (container) container.style.display = "none";
								}
							} else {
								if (!playlist.getNextTrackVideoId()) {
									setShowStopIcon(true);
									return;
								}
								console.log("Playing next - ", playlist.getNextTrackVideoId());
								handlePlayNext();
							}
							break;
						case YT.PlayerState.CUED:
							var videoData = event.target.getVideoData();
							var title = videoData.title;
							const current = currentTrackRef.current;
							if (current?.url) {
								playlist.updateTrackTitle(playlist.extractVideoId(current.url), title);
								currentTrackRef.current = {...current, title: title};
								setIsVideoError(false);
								playerRef.current.playVideo();
								setTrackIndex(playlist.getTrackIndexWithId(current.id));
							}
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
	}, [playerRef.current, currentTrackRef.current]);

	// useEffect(() => {
	// 	const current = currentTrackRef.current;
	// 	if (current) setTrackIndex(playlist.getTrackIndexWithId(current.id));
	// }, [currentTrackRef.current]);

	useEffect(() => {
		const {prev, current} = triggers;

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
	}, [showPopup, triggers, playerRef]);

	useEffect(() => {
		//메뉴창이 닫히면 무조건 mode => 0, popuptype => -1로 지정
		if (!showPopup) {
			setMode(0);
			setPopupType(-1);
		}
	}, [showPopup]);

	useEffect(() => {
		if (shuffleMode) {
			const current = currentTrackRef.current;
			if (showStopIcon) {
				setShowStopIcon(false);
				playlist.shuffleTracks(undefined);
				if (playerRef.current) {
					playerRef.current.seekTo(0);
					playerRef.current.playVideo();
				}
			} else {
				const index = playlist.shuffleTracks(current?.id);
				//if (index) setTrackIndex(index);
				//셔플 중에는 index 대신 셔플 메시지가 뜨는 것으로 변경
			}
		} else {
			const newIndex = playlist.unshuffleTracks();
			setTrackIndex(newIndex);
		}
	}, [shuffleMode]);

	const handleLogout = async () => {
		try {
			const response = await apiRequest("/api/logout", "POST");
			if (response?.error) {
				setIsError(true);
			} else {
				//로그아웃 성공시 스페셜 이벤트 기록을 초기화
				localStorage.removeItem("interactionOver");
				setIsLogin(false);
			}
		} catch (error) {
			console.log("Error logging out");
		}
	};

	const handleEmptyPlaylist = async () => {
		try {
			const response = await apiRequest("/api/playlist", "POST", {id: playlist.getObjectId(), track: undefined, mode: "empty"});
			if (response?.error) {
				console.error("Failed to empty playlist:", response.error);
			} else {
				playlist.empty();
				cleanUpPlaylist();
				setShowPopup(false);
				setShowStopIcon(false);
				setIsPlay(true);
			}
		} catch (error) {
			console.error("Failed to empty playlist:", error);
		}
	};

	const handlePopAction = (type: "a" | "b") => {
		if (type === "a") {
			switch (modeValues[popupType]) {
				case "remove":
					if (!specialTrackInfo) handleRemoveTrack();
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
		if (modeValues[popupType] === "remove" && specialTrackInfo) return messages.special;
		if (playlist.tracks?.length === 0) return messages.none;
		else return messages[modeValues[popupType]];
	};

	const showConfirm = () => {
		const mode = modeValues[popupType];
		if (mode === "logout") return true;
		else if (playlist.tracks?.length === 0) return false;
		else if (specialTrackInfo && modeValues[popupType] === "remove") return false;
		else return true;
	};

	return (
		<div className="flex flex-col items-center w-full h-full justify-between gap-spacing-10 bg-gray-2 p-spacing-10 text-black relative">
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
				<button onClick={handleAddSong}>
					<PlusCircleIcon className={defaultIconSize} />
				</button>
			</div>
			<div className="track-info flex flex-row w-full items-center justify-start gap-spacing-10">
				<div id="player"></div>
				{isVideoError ? (
					<p className="text-xs line-clamp-2 whitespace-pre-line">{`⚠️ Video not available:\n removing from playlist...`}</p>
				) : (
					<p className="text-xs line-clamp-2">{specialTrackInfo || currentTrackRef.current?.title}</p>
				)}
			</div>
			<span className="text-xxs mt-auto">{shuffleMode ? "shuffle on" : specialTrackInfo ? "special track" : `track ${trackIndex}`}</span>
			<div className="flex flex-row w-full justify-between items-center">
				<button onClick={handlePlayPrev}>
					<BackwardIcon className={defaultIconSize} />
				</button>
				<button onClick={playVideo} disabled={showStopIcon || isVideoError}>
					{showStopIcon || isVideoError ? (
						<XCircleIcon className={defaultIconSize} />
					) : !isPlay ? (
						<PlayCircleIcon className={defaultIconSize} />
					) : (
						<PauseCircleIcon className={defaultIconSize} />
					)}
				</button>
				<button onClick={() => handlePlayNext()}>
					<ForwardIcon className={defaultIconSize} />
				</button>
			</div>
			<div className="w-full p-[2px] border border-px rounded-[1px] border-black">
				<div className="bg-black h-px" style={{width: progressTime.toFixed(2) + "%"}} />
			</div>
			{showPopup && (
				<div className="absolute bg-transparent w-full h-full flex items-center justify-center bottom-spacing-2">
					<div className="border border-px border-black w-2/3 h-2/3 rounded-[1px] p-spacing-16 bg-gray-2 flex flex-col justify-between items-center">
						<div className="flex flex-col items-start justify-start h-fit">
							<button disabled={!specialTrackInfo} className="h-8 leading-8 flex flex-row items-center gap-2">
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
						{specialTrackInfo && modeValues[popupType] === "remove" && <img src="./icon/alien.gif" alt="alien" className="w-5 h-5 mt-4" />}

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
		</div>
	);
}
