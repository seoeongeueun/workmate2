import React, {useState, useEffect, useRef, useCallback} from "react";
import {usePlaylistContext} from "../context/playlistContext";
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
};

export default function PlayScreen({playlist, triggers}: PlayScreenProps) {
	const [currentTrack, setCurrentTrack] = useState<Track | undefined>(undefined);
	const [isEmpty, setIsEmpty] = useState<boolean>(true);
	const [isPlay, setIsPlay] = useState<boolean>(false);
	const [progressTime, setProgressTime] = useState<number>(0);
	const [currentTime, setCurrentTime] = useState<Date>(new Date());
	const [showPopup, setShowPopup] = useState<boolean>(false);
	const [trackIndex, setTrackIndex] = useState<string>("0 out of 0");
	const [shuffleMode, setShuffleMode] = useState<boolean>(false);
	const playerRef = useRef<any>(null);

	const defaultIconSize = "size-6";

	//유저가 직접 재생/일시중지를 트리거 할 때만 사용
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
			const newTrack = playlist.addTrack(url);
			songToAdd.value = "Music Added!";
			setTrackIndex(playlist.getTrackIndex());
			if (!currentTrack) {
				setCurrentTrack(playlist.getCurrentTrack());
				setIsEmpty(false);
			}

			const response = await apiRequest("/api/playlist", "POST", {
				id: playlist.getObjectId(),
				track: newTrack,
				isRemove: false,
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
		const nextTrack = playlist.playNext();
		if (nextTrack) {
			cueVideo(nextTrack);
		}
	}, [playlist, cueVideo]);

	const handlePlayPrev = () => {
		const prevTrack = playlist.playPrevious();
		if (prevTrack) {
			cueVideo(prevTrack);
		}
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

		if (!window.YT?.Player && playlist.tracks?.length > 0) {
			loadYTScript();
		}

		let intervalId;

		function onYouTubeIframeAPIReady() {
			console.log("API Ready - Initializing player");
			const initialVideoId = playlist.extractVideoId(playlist.tracks[0].url); // 첫번째 트랙의 동영상 id를 가져오기
			if (initialVideoId) {
				playerRef.current = new YT.Player("player", {
					height: "50",
					width: "50",
					videoId: initialVideoId,
					events: {
						onReady: event => {
							console.log("Player Ready");
							var videoData = event.target.getVideoData();
							var title = videoData.title;
							playlist.updateTrackTitle(initialVideoId, title);
							playVideo();
							intervalId = setInterval(() => {
								if (playerRef.current) {
									const duration = playerRef.current.getDuration();
									const currentTime = playerRef.current.getCurrentTime();
									setProgressTime(Math.min((currentTime / duration) * 100, 100));
								}
							}, 1000);
						},
						onStateChange: handlePlayerStateChange,
					},
				});
			}
		}

		const handlePlayerStateChange = (event: YT.OnStateChangeEvent) => {
			//이전 곡 재생 완료 시 다음 곡 자동 재생
			if (event.data === YT.PlayerState.ENDED) {
				handlePlayNext();
			} else if (event.data === YT.PlayerState.CUED) {
				var videoData = event.target.getVideoData();
				var title = videoData.title;
				const current = playlist.getCurrentTrack();
				if (current?.url) {
					playlist.updateTrackTitle(current.url, title);
					setCurrentTrack({...current, title: title});
					playerRef.current.playVideo();
				}
			}
		};

		window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

		return () => {
			if (playerRef.current) {
				playerRef.current.destroy();
				playerRef.current = null;
			}
		};
	}, [playlist]);

	useEffect(() => {
		const current = playlist.getCurrentTrack();
		console.log(current);
		if (current) {
			setCurrentTrack(current);
			setTrackIndex(playlist.getTrackIndex());
		}
	}, [playlist, playlist.currentTrack]);

	useEffect(() => {
		var current = triggers?.current;
		if (triggers?.prev === "select" && (current === "a" || current === "b")) {
			if (current === "a") handleRemoveTrack();
			setShowPopup(false);
		} else if (current === "select") {
			setShowPopup(true);
		}
	}, [triggers]);

	// useEffect(() => {
	// 	if (buttonPressed === "select") {
	// 		setShowPopup(true);
	// 	}
	// }, [buttonPressed]);

	// useEffect(() => {
	// 	console.log(buttonPressed);
	// 	if (showPopup && (buttonPressed === "a" || buttonPressed === "b")) {
	// 		handleRemoveTrack(buttonPressed);
	// 	}
	// }, [buttonPressed, showPopup]);

	const handleRemoveTrack = async (isRemove: boolean = true) => {
		if (isRemove && currentTrack) {
			const response = await apiRequest("/api/playlist", "POST", {
				id: playlist.getObjectId(),
				track: playlist.getCurrentTrack(),
				isRemove: true,
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
				}
			}
		}
		setTrackIndex(playlist.getTrackIndex());
		setShowPopup(false);
	};

	// useEffect(() => {
	// 	const handleKeyDown = (event: KeyboardEvent) => {
	// 		if (event.code === "KeyA") {
	// 			handleRemoveTrack("a");
	// 		} else if (event.code === "KeyB") {
	// 			handleRemoveTrack("b");
	// 		}
	// 	};

	// 	if (showPopup) {
	// 		window.addEventListener("keydown", handleKeyDown);
	// 	}

	// 	return () => {
	// 		window.removeEventListener("keydown", handleKeyDown);
	// 	};
	// }, [showPopup]);

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
				<p className="text-xs line-clamp-2">{currentTrack?.title}</p>
			</div>
			<span className="text-xxs mt-auto">track {trackIndex}</span>
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
					<div className="border border-px border-black w-2/3 h-2/3 rounded-[1px] text-center p-spacing-16 py-spacing-24 bg-gray-2 flex flex-col justify-between items-center">
						<span className="tracking-wider leading-8">Remove current track from playlist?</span>
						<div className="w-full flex flex-row items-center justify-between">
							<div className="flex flex-row items-center gap-spacing-4" onClick={() => handleRemoveTrack()}>
								<span className="border-px border-black rounded-full border p-px flex items-center justify-center w-6 h-6 bg-gray-1">A</span>
								<span>yes</span>
							</div>
							<div className="flex flex-row items-center gap-spacing-4" onClick={() => handleRemoveTrack(false)}>
								<span className="border-px border-black rounded-full border p-px flex items-center justify-center w-6 h-6 bg-gray-1">B</span>
								<span>no</span>
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
