"use client";
import {useState, useEffect} from "react";
import audioControls from "./lib/audioControls";
import MusicPlayer from "./components/musicPlayer";
import {PlaylistProvider} from "./context/playlistContext";
import {apiRequest} from "./lib/tools";
import {ExclamationTriangleIcon} from "@heroicons/react/24/solid";
import {Cog8ToothIcon} from "@heroicons/react/24/outline";
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

const keyToButtonValue: Record<string, ButtonValue> = {KeyA: "a", KeyB: "b", ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right"};

const themeColors: string[] = ["rgb(79, 82, 147)", "rgb(83, 83, 83)", "rgb(236, 122, 147)"];
const colorNames: string[] = ["blue", "gray", "pink"];
type ColorIndex = Extract<keyof typeof themeColors, number>;

export default function Home() {
	const [power, setPower] = useState<boolean>(false);
	const [loading, setLoading] = useState<boolean>(false);
	const [triggers, setTriggers] = useState<Triggers>({prev: undefined, current: undefined});
	const [colorIndex, setColorIndex] = useState<ColorIndex>(0);
	const [isKorean, setIsKorean] = useState<boolean | undefined>(undefined);
	const [showSettings, setShowSettings] = useState<boolean>(false);

	const handleGlobalClick = (event: MouseEvent) => {
		const target = event.target as HTMLElement;

		if (target.classList.contains("trigger")) {
			const buttonValue = target.getAttribute("data-button-type") as ButtonValue | undefined;
			console.log("Button clicked:", buttonValue);

			if (buttonValue) {
				setTriggers(prevState => ({prev: prevState.prev === "select" && buttonValue !== "b" ? "select" : prevState.current, current: buttonValue}));
			}
		}
	};

	useEffect(() => {
		const index = parseInt(localStorage.getItem("color") || "") || 0;
		setColorIndex(index);
		document.documentElement.setAttribute("data-theme", colorNames[index]);

		const handleKeyDown = (event: KeyboardEvent) => {
			const buttonValue = keyToButtonValue[event.code];
			if (buttonValue) {
				setTriggers(prevState => ({prev: prevState.prev === "select" && buttonValue !== "b" ? "select" : prevState.current, current: buttonValue}));
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		document.addEventListener("click", handleGlobalClick);

		if (navigator.language.startsWith("ko")) {
			setIsKorean(true);
		} else {
			setIsKorean(false);
		}

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			document.removeEventListener("click", handleGlobalClick);
		};
	}, []);

	useEffect(() => {
		const {prev, current} = triggers;
		if (current === "power") {
			setPower(old => !old);
			setLoading(!power);
		}
	}, [triggers]);

	useEffect(() => {
		if (power) audioControls.play("power");
	}, [power]);

	const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newIndex = colorNames.indexOf(e.target.value);
		setColorIndex(newIndex);
		document.documentElement.setAttribute("data-theme", colorNames[newIndex]);
		localStorage.setItem("color", newIndex.toString());
	};

	const handleAlwaysOnTop = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const alwaysOnTop = e.target.checked;
		const response = await apiRequest("/api/always-on-top", "POST", {alwaysOnTop});
		if (response.error) {
			console.error("Failed to change settings", response.error);
		}
	};

	return (
		<div className="font-galmuri font-semibold w-full h-full">
			{isKorean !== undefined && (
				<div className="fixed p-4 w-screen z-[999] pointer-events-none flex flex-row justify-between items-start gap-2">
					<div
						className={`transition-opacity ${showSettings ? "opacity-30" : "opacity-100"} bg-gray-2 xs:block md:hidden w-fit h-fit text-black border break-keep border-px border-black p-2 rounded-sm text-md gap-1 flex flex-row items-center max-w-full`}
					>
						<ExclamationTriangleIcon className="size-6 mr-2"></ExclamationTriangleIcon>
						{isKorean ? (
							<span>원활한 디스플레이를 위해 pc 사용이 권장되며, 800 픽셀 이하 해상도 기기에서 일부 요소가 정상적으로 표시되지 않을 수 있습니다.</span>
						) : (
							<span className="text-wider">
								Devices with resolutions below 800 pixels may not display some elements correctly. For optimal display, PC usage is recommended.
							</span>
						)}
					</div>
					<div className="ml-auto flex flex-row-reverse gap-2">
						<button
							onClick={() => setShowSettings(prev => !prev)}
							className="bg-transparent flex w-fit h-fit p-spacing-2 justify-center items-center rounded-full !pointer-events-auto"
						>
							<Cog8ToothIcon className="size-8 hover:animate-[spin_1300ms_ease-in-out_infinite]"></Cog8ToothIcon>
						</button>
						{showSettings && (
							<div className="fixed top-4 right-[3.9rem] rounded-sm pointer-events-auto bg-gray-2 border border-px w-[15rem] h-fit border-black text-black text-md p-4">
								<div className="flex flex-col justify-start gap-2">
									<span>Settings</span>
									<div className="flex flex-row gap-3">
										{colorNames.map(color => (
											<div key={color} className="flex flex-row gap-2 text-sm">
												<input
													type="radio"
													name="colors"
													value={color}
													onChange={handleColorChange}
													checked={colorNames[colorIndex] === color}
													className="cursor-pointer"
												/>
												<label className="form-check-label">{color}</label>
											</div>
										))}
									</div>
									<div className="flex flex-row gap-2 items-center">
										<label>Always on top</label>
										<input type="checkbox" id="always-on-top" name="always-on-top" defaultChecked onChange={handleAlwaysOnTop} className="cursor-pointer" />
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			)}
			<div className="w-screen h-full flex items-center justify-start md:justify-center overflow-auto">
				<div className="gameboy-body w-[77rem] h-[30rem] flex items-center justify-center">
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
				<div className="w-full h-fit position-center pointer-events-none">
					<div className="blur-shadow">
						<div className="body-filler"></div>
					</div>
				</div>
			</div>
		</div>
	);
}
