"use client";

import {useEffect, useState} from "react";
import lucky from "../data/lucky.json";
import {apiRequest} from "../lib/tools";

const videoData: Record<string, string[]> = lucky;

const categoryKeys = Object.keys(videoData);

export default function VideoChecker() {
	const [videoStatuses, setVideoStatuses] = useState<Record<string, Record<string, string>>>({});
	const [apiLoaded, setApiLoaded] = useState(false);
	const [currentRowIndex, setCurrentRowIndex] = useState(0);
	const [message, setMessage] = useState<string>("");

	useEffect(() => {
		const waitForYT = () => {
			if (window.YT && window.YT.Player) {
				console.log("✅ YouTube API is ready!");
				setApiLoaded(true);
			} else {
				setTimeout(waitForYT, 500);
			}
		};

		if (!window.YT) {
			console.log("🔄 Loading YouTube API...");
			const script = document.createElement("script");
			script.src = "https://www.youtube.com/iframe_api";
			script.async = true;
			script.onload = () => {
				console.log("✅ YouTube script loaded!");
				setTimeout(waitForYT, 1000);
			};
			document.body.appendChild(script);
		} else {
			waitForYT();
		}
	}, []);

	const checkRow = (key: string) => {
		if (!apiLoaded) return;

		console.log("🚀 Checking video statuses...");

		videoData[key].forEach(url => {
			const videoId = extractVideoId(url);
			if (!videoId) return;

			console.log(`🔍 Checking ${videoId}...`);

			const player = new window.YT.Player(`player-${key}-${videoId}`, {
				height: "30",
				width: "30",
				videoId,
				events: {
					onReady: event => {
						event.target.mute();
						event.target.playVideo();
					},
					onStateChange: event => {
						if (event.data === window.YT.PlayerState.PLAYING) {
							console.log(`✅ ${videoId} is available!`);
							setVideoStatuses(prev => ({
								...prev,
								[key]: {...prev[key], [videoId]: "Available"},
							}));
							setTimeout(() => event.target.stopVideo(), 2000);
						}
					},
					onError: event => {
						console.error(`❌ ${videoId} is unavailable`, event.data);
						setVideoStatuses(prev => ({
							...prev,
							[key]: {...prev[key], [videoId]: "Unavailable"},
						}));
					},
				},
			});
		});
	};

	const extractVideoId = (url: string): string => {
		const match = url.match(/[?&]v=([^&]+)/);
		return match ? match[1] : "";
	};

	const handleNextRow = () => {
		if (currentRowIndex < categoryKeys.length - 1) {
			setCurrentRowIndex(prev => prev + 1);
			setMessage("");
		}
	};

	useEffect(() => {
		const currentKey = categoryKeys[currentRowIndex];
		if (currentKey) {
			checkRow(currentKey);
		}
	}, [currentRowIndex, apiLoaded]);

	const handleRemove = async (categoryKey: string) => {
		const unavailableVideos = Object.entries(videoStatuses[categoryKey] || {})
			.filter(([_, status]) => status === "Unavailable")
			.map(([videoId]) => {
				return videoData[categoryKey].find(url => url.includes(videoId));
			})
			.filter(Boolean) as string[];

		if (unavailableVideos.length === 0) {
			setMessage("오류난 동영상이 없습니다");
			return;
		}

		try {
			const response = await apiRequest("/api/lucky", "POST", {
				categoryKey,
				unavailableVideos,
			});

			if (response?.error) throw new Error("Failed to update JSON");
			setVideoStatuses(prev => {
				const updatedCategory = {...prev[categoryKey]};
				unavailableVideos.forEach(url => {
					const videoId = extractVideoId(url);
					delete updatedCategory[videoId];
				});
				return {...prev, [categoryKey]: updatedCategory};
			});
			setMessage("✅ 오류 동영상 삭제 완료");
		} catch (error) {
			console.error("Error removing video:", error);
		}
	};

	return (
		<div className="w-full h-full p-8 gap-2 flex flex-col ">
			<h1>YouTube Video Checker</h1>

			{categoryKeys.map((key, index) =>
				index === currentRowIndex ? (
					<div key={key} className="flex flex-col justify-start items-start gap-4">
						<h2 className="text-md font-semibold">Category {key}</h2>
						<div className="flex flex-wrap gap-2">
							{videoData[key].map(url => {
								const videoId = extractVideoId(url);
								return (
									<div
										key={videoId}
										className={`flex flex-col min-w-[14rem] gap-4 ${videoStatuses[key]?.[videoId] === "Unavilable" ? "bg-gray-2" : "bg-gray-1"} rounded-px p-2 text-center`}
									>
										<div id={`player-${key}-${videoId}`} className="mx-auto"></div>
										<p className="text-sm">
											<a href={url} target="_blank" rel="noopener noreferrer">
												{videoId}
											</a>{" "}
											- {videoStatuses[key]?.[videoId] || "Checking..."}
										</p>
									</div>
								);
							})}
						</div>
					</div>
				) : null
			)}
			<div className="flex flex-row items-center gap-2">
				{currentRowIndex < categoryKeys.length - 1 && (
					<button className="mt-4 px-4 py-2 justify-center w-fit bg-gray-3 text-white rounded-px" onClick={handleNextRow}>
						Next Category
					</button>
				)}
				<button onClick={() => handleRemove(categoryKeys[currentRowIndex])} className="mt-4 px-4 py-2 justify-center w-fit bg-gray-3 text-white rounded-px">
					오류 동영상 제거
				</button>
			</div>
			<p>{message}</p>
		</div>
	);
}
