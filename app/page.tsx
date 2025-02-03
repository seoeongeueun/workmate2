"use client";
import {useState, useEffect} from "react";
import audioControls from "./lib/audioControls";
import MusicPlayer from "./components/musicPlayer";
import {PlaylistProvider} from "./context/playlistContext";
import {PaintBrushIcon} from "@heroicons/react/24/solid";
import "./global.scss";

/* 
	a => 확인
	b => 취소
	select => 메뉴 / 액션
*/
type ButtonValue = "a" | "b" | "up" | "down" | "left" | "right" | "select" | "power";

export interface Triggers {
	prev: ButtonValue | undefined;
	current: ButtonValue | undefined;
}

const keyToButtonValue: Record<string, ButtonValue> = {
	KeyA: "a",
	KeyB: "b",
	ArrowUp: "up",
	ArrowDown: "down",
	ArrowLeft: "left",
	ArrowRight: "right",
};

const themeColors: string[] = ["rgb(79, 82, 147)", "rgb(83, 83, 83)", "rgb(236, 122, 147)"];
const colorNames: string[] = ["blue", "gray", "pink"];
type ColorIndex = Extract<keyof typeof themeColors, number>;

export default function Home() {
	const [power, setPower] = useState<boolean>(false);
	const [loading, setLoading] = useState<boolean>(false);
	const [triggers, setTriggers] = useState<Triggers>({prev: undefined, current: undefined});
	const [colorIndex, setColorIndex] = useState<ColorIndex>(0);

	const handleGlobalClick = (event: MouseEvent) => {
		const target = event.target as HTMLElement;

		if (target.classList.contains("trigger")) {
			const buttonValue = target.getAttribute("data-button-type") as ButtonValue | undefined;
			console.log("Button clicked:", buttonValue);

			if (buttonValue) {
				setTriggers(prevState => ({
					prev: prevState.prev === "select" && buttonValue !== "b" ? "select" : prevState.current,
					current: buttonValue,
				}));
			}
		}
	};

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			const buttonValue = keyToButtonValue[event.code];
			if (buttonValue) {
				setTriggers(prevState => ({
					prev: prevState.prev === "select" && buttonValue !== "b" ? "select" : prevState.current,
					current: buttonValue,
				}));
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		document.addEventListener("click", handleGlobalClick);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			document.removeEventListener("click", handleGlobalClick);
		};
	}, []);

	useEffect(() => {
		const current = triggers.current;
		if (current === "power") {
			setPower(prev => !prev);
			setLoading(!power);
		}
	}, [triggers]);

	useEffect(() => {
		if (power) audioControls.play("power");
	}, [power]);

	const handleColorChange = () => {
		const newIndex = (colorIndex + 1) % themeColors.length;
		setColorIndex(newIndex);
		document.documentElement.setAttribute("data-theme", colorNames[newIndex]);
	};

	return (
		<div className="font-galmuri font-semibold">
			<div className="fixed right-4 top-4">
				<button
					className="transition-colors duration-300 border border-px border-white flex w-fit h-fit p-spacing-6 justify-center items-center rounded-full shadow-md shadow-gray-400"
					onClick={handleColorChange}
					style={{backgroundColor: themeColors[colorIndex]}}
				>
					<PaintBrushIcon className="size-6 fill-white"></PaintBrushIcon>
				</button>
			</div>
			<div className="gameboy-body">
				<div className="gameboy-frames flex flex-row items-center position-center">
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
								<div className="tip trigger" data-button-type="up"></div>
								<div className="tip trigger opacity-0" data-button-type="down"></div>
							</div>
							<div className="horizontal">
								<div className="tip trigger" data-button-type="left"></div>
								<div className="tip trigger" data-button-type="right"></div>
							</div>
							<div className="rect pointer-events-none"></div>
						</div>
						<div className="start-buttons">
							<div className="border">
								<div className="start trigger" data-button-type="power"></div>
								<span>START</span>
							</div>
							<div className="border">
								<div className="select trigger" data-button-type="select"></div>
								<span>MENU</span>
							</div>
						</div>
					</div>
					<div className="flex flex-col items-center justify-center z-20">
						<div className="body-frame relative bg-body"></div>
						<div className="body-bottom">
							<div className="base absolute bg-body w-full h-full z-20"></div>
						</div>
						{/* <div className="logo">
							<span>Workmate</span>
						</div> */}
					</div>
					<div className="body-right">
						<div className="body-side right">
							<div className="inner"></div>
							<div className="shadow"></div>
							<div className="inner bottom"></div>
							<div className="corner"></div>
						</div>
						<div className="body-wing right">
							<div className="wing"></div>
							<div className="shadow"></div>
							<div className="corner"></div>
						</div>
						<div className="power-button">
							<div className={`power ${power || loading ? "on animate-flicker" : ""}`}></div>
							<span>POWER</span>
						</div>
						<div className="ab-buttons">
							<div className="b-button trigger" data-button-type="b">
								<span className="pointer-events-none">B</span>
							</div>
							<div className="a-button trigger" data-button-type="a">
								<span className="pointer-events-none">A</span>
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
							<PlaylistProvider initialTitle="My Playlist">
								<div className={`w-full h-full flex flex-col justify-center items-center ${loading ? "bg-gray-2 animate-fadeIn" : ""}`}>
									{power && <MusicPlayer triggers={triggers} />}
								</div>
								{/* {power ? (
									isLogin ? (
										<MusicPlayer buttonPressed={buttonPressed} />
									) : (
										<LoginScreen setIsLogin={setIsLogin} />
									)
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
								)} */}
							</PlaylistProvider>
						</div>
					</div>
					<div className="frame-side left">
						<div></div>
					</div>
					<div className="frame-bottom">
						<div className="base">
							<div></div>
							<span className="playlist-title text-nowrap">WORKMATE</span>
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
