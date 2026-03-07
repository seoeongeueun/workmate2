"use client";
import {useState, useEffect} from "react";
import {Cog8ToothIcon} from "@heroicons/react/24/outline";

const themeColors: string[] = ["rgb(79, 82, 147)", "rgb(83, 83, 83)", "rgb(236, 122, 147)"];
const colorNames: string[] = ["blue", "gray", "pink"];
type ColorIndex = Extract<keyof typeof themeColors, number>;

export function SettingsButton() {
	const [showSettings, setShowSettings] = useState<boolean>(false);
	const [colorIndex, setColorIndex] = useState<ColorIndex>(0);

	useEffect(() => {
		const index = parseInt(localStorage.getItem("color") || "") || 0;
		setColorIndex(index);
		document.documentElement.setAttribute("data-theme", colorNames[index]);
	}, []);

	const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newIndex = colorNames.indexOf(e.target.value);
		setColorIndex(newIndex);
		document.documentElement.setAttribute("data-theme", colorNames[newIndex]);
		localStorage.setItem("color", newIndex.toString());
	};

	return (
		<div className="fixed right-0 p-4 w-fit pointer-events-none">
			<div className="z-[999] pointer-events-none flex flex-row-reverse gap-2">
				<button
					onClick={() => setShowSettings(prev => !prev)}
					className="bg-transparent flex w-fit h-fit p-spacing-2 justify-center items-center rounded-full pointer-events-auto"
				>
					<Cog8ToothIcon className="size-8 hover:animate-[spin_700ms_ease-in-out_backwards]"></Cog8ToothIcon>
				</button>
				{showSettings && (
					<div className="rounded-sm pointer-events-auto bg-gray-2 border border-px min-w-[15rem] w-fit h-fit border-black text-black text-md p-4">
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
							{/* <div className="flex flex-row gap-2 items-center">
								<label>Always on top</label>
								<input type="checkbox" id="always-on-top" name="always-on-top" defaultChecked />
							</div> */}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
