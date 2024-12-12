"use client";
import {useState, useEffect} from "react";
import audioControls from "./modules/audioControls";
import "./global.scss";

export default function Home() {
	const [power, setPower] = useState<boolean>(false);
	const [loading, setLoading] = useState<boolean>(false);

	useEffect(() => {
		if (loading) {
			const t = setTimeout(() => {
				setPower(true);
				setLoading(false);
			}, 4000);

			return () => clearTimeout(t);
		}
	}, [loading]);

	const handlePowerOn = () => {
		if (power) {
			setPower(false);
			setLoading(false);
		} else {
			audioControls.play("power");
			setLoading(true);
		}
	};

	return (
		<div className="App font-galmuri font-semibold">
			<div className="gameboy-body">
				<div className="flex flex-row items-center position-center">
					<div className="body-left">
						<div className="body-wing left">
							<div className="wing"></div>
							<div className="corner"></div>
						</div>
						<div className="body-side left">
							<div className="inner"></div>
							<div className="shadow"></div>
							<div className="inner bottom"></div>
							<div className="shadow bottom"></div>
							<div className="shadow bottom right"></div>
						</div>
						<div className="move-button">
							<div className="vertical">
								<div className="tip"></div>
								{/* <div className="tip"></div> */}
							</div>
							<div className="horizontal">
								<div className="tip"></div>
								<div className="tip"></div>
							</div>
							<div className="rect"></div>
						</div>
						<div className="start-buttons">
							<div className="border">
								<div className="start" onClick={handlePowerOn}></div>
								<span>START</span>
							</div>
							<div className="border">
								<div className="select"></div>
								<span>SELECT</span>
							</div>
						</div>
					</div>
					<div className="flex flex-col items-center justify-center z-20">
						<div className="body-frame relative bg-body"></div>
						<div className="body-bottom">
							<div className="base absolute bg-body w-full h-full z-20"></div>
						</div>
						<div className="logo">
							<span>Workmate</span>
						</div>
					</div>
					<div className="body-right">
						<div className="body-side right">
							<div className="inner"></div>
							<div className="shadow"></div>
							<div className="inner bottom"></div>
						</div>
						<div className="body-wing right">
							<div className="wing"></div>
							<div className="corner"></div>
						</div>
						<div className="power-button">
							<div className={`power ${power || loading ? "on" : ""}`}></div>
							<span>POWER</span>
						</div>
						<div className="ab-buttons">
							<div className="b-button">
								<span>B</span>
							</div>
							<div className="a-button">
								<span>A</span>
							</div>
						</div>
						<div className="speaker">
							<div className="line"></div>
							<div className="line"></div>
							<div className="line"></div>
							<div className="line"></div>
							<div className="line"></div>
						</div>
					</div>
				</div>
				<div className="relative pointer-events-none top-[4rem] w-fit h-fit flex flex-col justify-center items-center">
					<div className="frame-top">
						<div className="top">
							<div></div>
						</div>
						<div className="base">
							<div></div>
						</div>
					</div>
					<div className="frame-side right">
						<div></div>
					</div>
					{/* 화면 영역 */}
					<div className="pointer-events-auto bg-black border border-black px-spacing-4 py-spacing-8 w-fit z-30">
						<div className="w-[32rem] h-[20rem] bg-off-screen">
							{/* <PlaylistProvider initialTitle="My Playlist">
								{power ? (
									<MusicPlayer />
								) : (
									<div className={`w-full h-full flex flex-col justify-center items-center ${loading ? "bg-gray-2 animate-fadeIn" : ""}`}>
										{loading && (
											<div className="flex flex-col h-full justify-center items-center">
												<div className="flex flex-row justify-between gap-2">
													<MusicalNoteIcon className="size-4 animate-bounce mt-2" />
													<img src="/icon/alien.gif" alt="alien" className="w-12 h-12" />
													<img src="/icon/song.png" alt="song" className="w-3 h-3 mt-2 animate-bounce"></img>
												</div>
												<span className="text-xxxs text-black tracking-widest ml-1 mt-2">workmate</span>
											</div>
										)}
									</div>
								)}
							</PlaylistProvider> */}
						</div>
					</div>
					<div className="frame-side left">
						<div></div>
					</div>
					<div className="frame-bottom">
						<div className="base">
							<div></div>
							<span className="playlist-title text-nowrap">USER1</span>
						</div>
						<div className="top">
							<div></div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
