import React, {useState, useEffect, useRef, useCallback} from "react";
import {usePlaylistContext} from "../context/playlistContext";
import {Battery100Icon} from "@heroicons/react/24/solid";
import {PlayIcon, PauseCircleIcon, BackwardIcon, ForwardIcon, PlusCircleIcon} from "@heroicons/react/16/solid";

declare global {
	interface Window {
		onYouTubeIframeAPIReady: () => void;
	}
}

type MusicPlayerProps = {
	buttonPressed: string | undefined;
};

export default function MusicPlayer({buttonPressed}: MusicPlayerProps) {
	const {playlist} = usePlaylistContext();
	const [currentTrack, setCurrentTrack] = useState(playlist.getCurrentTrack());
	const [isEmpty, setIsEmpty] = useState<boolean>(true);
	const [isPlay, setIsPlay] = useState<boolean>(false);
	const [progressTime, setProgressTime] = useState<number>(0);
	const [currentTime, setCurrentTime] = useState<Date>(new Date());
	const [showPopup, setShowPopup] = useState<boolean>(false);
	const [trackIndex, setTrackIndex] = useState<string>("0 out of 0");
	const playerRef = useRef<any>(null);

	const defaultIconSize = "size-6";

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

	const cueVideo = useCallback(
		(id: string) => {
			if (!playerRef.current) return;
			playerRef.current.cueVideoById(id); //yt api의 method
			setTrackIndex(playlist.getTrackIndex());
		},
		[playerRef]
	);

	const handleAddSong = (): void => {
		const songToAdd = document.getElementById("newSong") as HTMLInputElement;
		const url = songToAdd.value;
		if (url) {
			playlist.addTrack(url);
			songToAdd.value = "Music Added!";
			setTrackIndex(playlist.getTrackIndex());
			if (!currentTrack) {
				setCurrentTrack(playlist.getCurrentTrack());
				setIsEmpty(false);
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

		if (!window.YT?.Player && !isEmpty) {
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
							if (currentTrack) playVideo();
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
			if (event.data === YT.PlayerState.ENDED) {
				handlePlayNext();
			} else if (event.data === YT.PlayerState.CUED) {
				var videoData = event.target.getVideoData();
				var title = videoData.title;
				const current = playlist.getCurrentTrack();
				if (current?.url) {
					playlist.updateTrackTitle(current.url, title);
					setCurrentTrack({...current, title: title});
				}
				playVideo();
			}
		};

		window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

		return () => {
			if (playerRef.current) {
				playerRef.current.destroy();
				playerRef.current = null;
			}
		};
	}, [isEmpty]);

	useEffect(() => {
		setCurrentTrack(playlist.getCurrentTrack());
	}, [playlist, playlist.currentTrack]);

	useEffect(() => {
		if (buttonPressed === "select") {
			setShowPopup(true);
		}
	}, [buttonPressed]);

	useEffect(() => {
		console.log(buttonPressed);
		if (showPopup && (buttonPressed === "a" || buttonPressed === "b")) {
			handleRemoveTrack(buttonPressed);
		}
	}, [buttonPressed, showPopup]);

	const handleRemoveTrack = (type: string) => {
		if (type === "a" && currentTrack) {
			const nextTrack = playlist.removeTrack(currentTrack?.id);
			if (nextTrack) {
				playerRef.current.cueVideoById(nextTrack);
			} else {
				playerRef.current.destroy();
			}
		}
		setTrackIndex(playlist.getTrackIndex());
		setShowPopup(false);
	};

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.code === "KeyA") {
				handleRemoveTrack("a");
			} else if (event.code === "KeyB") {
				handleRemoveTrack("b");
			}
		};

		if (showPopup) {
			window.addEventListener("keydown", handleKeyDown);
		}

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [showPopup]);

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
							<div className="flex flex-row items-center gap-spacing-4" onClick={() => handleRemoveTrack("a")}>
								<span className="border-px border-black rounded-full border p-px flex items-center justify-center w-6 h-6 bg-gray-1">A</span>
								<span>yes</span>
							</div>
							<div className="flex flex-row items-center gap-spacing-4" onClick={() => handleRemoveTrack("b")}>
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
