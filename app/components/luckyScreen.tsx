import {PlayIcon} from "@heroicons/react/24/solid";
import {use, useEffect, useState} from "react";
import {Triggers} from "../page";
import songs from "../data/lucky.json" assert {type: "json"};
import dialogue from "../data/dialogue.json" assert {type: "json"};

const choice1 = ["💖", "❤️‍🔥", "🪄", "🍀"];
const choice2 = ["🌃", "🌙", "🛸", "🌉"];
const choice3 = ["🥀", "❤️‍🩹", "🕳️", "🪫"];
const choice4 = ["🎰", "🎲", "🧩", "🪤"];

type DialogueKeys = keyof typeof dialogue;
type SongsKeys = keyof typeof songs;

export default function LuckyScreen({
	triggers,
	username,
	setChosenTrack,
	setOpen,
}: {
	triggers: Triggers;
	username: string;
	setChosenTrack: React.Dispatch<React.SetStateAction<string>>;
	setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
	const [choices, setChoices] = useState<string[]>([]);
	const [selectedIndex, setSelectedIndex] = useState<number>(0);
	const [currentLine, setCurrentLine] = useState<DialogueKeys>("000");
	const [nextLine, setNextLine] = useState<DialogueKeys | undefined>("000");
	const [lineIndex, setLineIndex] = useState<number>(0);
	const [displayText, setDisplayText] = useState<string>("");
	const [showChoices, setShowChoices] = useState<boolean>(false);
	const [showChoices2, setShowChoices2] = useState<boolean>(false);
	const [month, setMonth] = useState<string>("");

	useEffect(() => {
		const randomSelection = [
			choice1[Math.floor(Math.random() * choice1.length)],
			choice2[Math.floor(Math.random() * choice2.length)],
			choice3[Math.floor(Math.random() * choice3.length)],
			choice4[Math.floor(Math.random() * choice4.length)],
		];
		setChoices(randomSelection);
		const monthInEng = new Date().toLocaleString("en-US", {month: "long"});
		setMonth(monthInEng);

		const isFirstDay = new Date().getDate() === 1;
		if (isFirstDay) {
			//새로운 month의 첫 날인 경우 005 - 007까지의 랜덤한 텍스트를 지정 & month 테마곡을 선택곡으로 지정
			const jsonKeys = Object.keys(dialogue) as DialogueKeys[];
			const randomNum = Math.floor(Math.random() * (jsonKeys?.length - 1 - 6 + 1)) + 6;
			const formatted = jsonKeys.find(key => key === String(randomNum).padStart(3, "0")) as DialogueKeys;
			setNextLine(formatted);
			const list = songs[monthInEng.toLowerCase() as SongsKeys];
			setChosenTrack(list[0]);
		}
	}, []);

	useEffect(() => {
		const {prev, current} = triggers;

		switch (current) {
			case "left":
				setSelectedIndex((selectedIndex - 1 + choice1.length) % choice1.length);
				break;
			case "right":
				setSelectedIndex((selectedIndex + 1 + choice1.length) % choice1.length);
				break;
			case "a":
				handleChoiceSelect(selectedIndex);
				break;
			default:
				break;
		}
	}, [triggers]);

	useEffect(() => {
		//다음 대사 줄이 존재하고 현재 대사 줄이 끝났을 때만만
		if (nextLine) {
			setLineIndex(0);
			setDisplayText("");
			setCurrentLine(nextLine);
			setShowChoices(false);
		}
	}, [nextLine]);

	useEffect(() => {
		const rawLine = dialogue[currentLine][lineIndex] ?? "";
		const line = handleFormat(rawLine);

		let i = 0;
		let timeoutId: NodeJS.Timeout | null = null;
		let displayed = "";

		function typeChar() {
			if (i >= line.length) {
				setTimeout(() => {
					setLineIndex(prev => Math.min(prev + 1, dialogue[currentLine].length - 1));
					if (currentLine === "000") setShowChoices(true);
					//거절 대사인 경우 창 닫기
					if (currentLine === "005" && dialogue[currentLine].length - 1 === lineIndex) setOpen(false);
				}, 800);
				return;
			}

			const current = line[i];
			const next = line[i + 1] ?? "";

			if (current === "\\" && next === "n") {
				displayed += "\n";
				i += 2;
			} else {
				displayed += current;
				i += 1;
			}

			setDisplayText(displayed);

			timeoutId = setTimeout(typeChar, 50);
		}

		typeChar();

		return () => {
			if (timeoutId) clearTimeout(timeoutId);
		};
	}, [currentLine, lineIndex]);

	useEffect(() => {
		if (showChoices2) {
			//선택지는 둘 중 하나만 노출
			setShowChoices(false);
			setSelectedIndex(0);
		}
	}, [showChoices2]);

	const handleFormat = (text: string) => {
		const state: Record<string, string> = {
			user: username,
			month: month,
		};
		return text.replace(/\$\{(\w+)\}/g, (_, key) => state[key] || "");
	};

	const handleChoiceSelect = (index: number) => {
		setNextLine(`00${index}` as DialogueKeys);

		const songLists = songs[`00${index}` as SongsKeys];
		if (songLists?.length > 0) {
			const randomIndex = Math.floor(Math.random() * songLists.length);
			setChosenTrack(songLists[randomIndex]);
		}

		setTimeout(() => {
			setShowChoices2(true);
		}, 1000);
	};

	const handlePlayTrack = (isPlay: boolean) => {
		if (!isPlay) {
			setNextLine("005");
			setChosenTrack("");
		}
	};

	return (
		<div className="relative flex flex-col w-full h-full justify-end items-center">
			<div className="absolute top-1/2 -translate-y-1/2 max-h-full flex flex-col w-full justify-end items-center gap-4">
				<div className="text-box relative w-fit max-w-[26rem] h-fit min-h-12 py-spacing-10 px-spacing-12 max-h-2/3 bg-black border border-px border-white rounded-md text-white flex flex-col items-start gap-spacing-4">
					<p id="dialog" className="tracking-widest text-xxxs">
						{displayText}
					</p>
				</div>
				<img src="/icon/alien.gif" alt="alien" className="w-12 h-12" />
			</div>
			{showChoices && (
				<div className="animate-fadeIn choices flex flex-row items-center justify-between w-[28rem] max-w-full text-xl p-spacing-10 h-20">
					{choices?.length > 0 &&
						choices.map((c, i) => (
							<button key={`choice-${i + 1}`} onClick={() => handleChoiceSelect(i + 1)} className="flex flex-row items-center gap-spacing-2">
								<PlayIcon className={`size-5 animate-blink ${i === selectedIndex ? "h-8" : "h-0"} mt-spacing-6`}></PlayIcon>
								<p>{c}</p>
							</button>
						))}
				</div>
			)}
			{showChoices2 && (
				<div className="animate-fadeIn choices flex flex-row items-center justify-between w-[28rem] max-w-full text-xxxs p-spacing-10 h-20">
					<button onClick={() => handlePlayTrack(false)} className="flex flex-row items-center gap-spacing-2">
						<PlayIcon className={`size-5 animate-blink ${selectedIndex % 2 === 0 ? "h-8" : "h-0"}`}></PlayIcon>
						<p className="tracking-widest">no</p>
					</button>
					<button onClick={() => handlePlayTrack(true)} className="flex flex-row items-center gap-spacing-2">
						<PlayIcon className={`size-5 animate-blink ${selectedIndex % 2 === 1 ? "h-8" : "h-0"}`}></PlayIcon>
						<p className="tracking-widest">play</p>
					</button>
				</div>
			)}
		</div>
	);
}
