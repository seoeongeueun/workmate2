"use client";

import {PlayIcon} from "@heroicons/react/24/solid";
import React, {useRef, useEffect, useState} from "react";
import dialogue from "@/data/dialogue.json" assert {type: "json"};
import {DIALOGUE_CHOICES} from "@/lib";
import {useButtonStore, useLuckyTrackStore} from "@/stores";
import {useQuery} from "@tanstack/react-query";
import {luckyQueries, sessionQueries} from "@/query";
import type {LuckyTracks} from "@/types";

type DialogueKeys = keyof typeof dialogue;

/*
	Dialogue 설명
	000: 기본 인사말
	001 - 004: 선택지에 대한 대사
	005: 거절에 대한 반응
	006 - 009: 새로운 달의 첫 날을 위한 대사
	010: 에러 케이스 대사
	011: 발렌타인 데이
	012: 크리스마스
	013: 새해 전날
*/

export default function DialogueScreen() {
	const [choices] = useState(() => [
		DIALOGUE_CHOICES[0][Math.floor(Math.random() * DIALOGUE_CHOICES[0].length)],
		DIALOGUE_CHOICES[1][Math.floor(Math.random() * DIALOGUE_CHOICES[1].length)],
		DIALOGUE_CHOICES[2][Math.floor(Math.random() * DIALOGUE_CHOICES[2].length)],
		DIALOGUE_CHOICES[3][Math.floor(Math.random() * DIALOGUE_CHOICES[3].length)],
	]); //각 선택지에서 랜덤한 값으로 선택지를 구성
	const [selectedIndex, setSelectedIndex] = useState<number>(0);
	const [displayLineRow, setDisplayLineRow] = useState<DialogueKeys>("000"); //현재 표시 중인 대사 묶음 key
	const [lineIndex, setLineIndex] = useState<number>(0); //현재 대사 묶음 내부의 줄 인덱스
	const [displayText, setDisplayText] = useState<string>("");
	const [trackToPlay, setTrackToPlay] = useState<string>("");
	const [displayChoice, setDisplayChoice] = useState<"emoji" | "interactive" | null>(null); // 보여줄 선택지 타입

	const setLuckyTrack = useLuckyTrackStore(state => state.setLuckyTrack); //선택한 트랙을 저장하는 전역 상태 업데이트 함수
	const reset = useLuckyTrackStore(state => state.reset); //트랙 선택 이벤트가 끝난 후 상태 초기화 함수

	const {data: tracksData} = useQuery(luckyQueries.all()); //lucky 트랙 데이터
	const {data: session} = useQuery(sessionQueries.session()); //세션 정보로 username을 가져옴

	const monthInEng = new Date().toLocaleString("en-US", {month: "long"});
	const isFirstDay = new Date().getDate() === 1; //오늘이 달의 첫 날인지

	const pressedButton = useButtonStore(state => state.pressedButton);

	const charTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const nextLineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const runIdRef = useRef<number>(0);

	useEffect(() => {
		//달의 첫 날인 경우, 곡은 따로 선택할 필요 없이 그 달의 대표 곡을 지정
		if (isFirstDay && tracksData) {
			setTrackToPlay(tracksData?.[monthInEng.toLowerCase()]?.[0] ?? "");
		}
	}, [tracksData, isFirstDay, monthInEng]);

	useEffect(() => {
		if (isFirstDay) {
			//새로운 month의 첫 날인 경우 006 - 009까지의 랜덤한 텍스트를 지정 & month 테마곡을 선택곡으로 지정
			const jsonKeys = Object.keys(dialogue) as DialogueKeys[];
			const randomNum = Math.floor(Math.random() * (9 - 6 + 1)) + 6;
			const formatted = jsonKeys.find(key => key === String(randomNum).padStart(3, "0")) as DialogueKeys;
			setDisplayLineRow(formatted);
		} else {
			//첫 날이 아니면 일반적인 대사 흐름
			setDisplayLineRow("000");
		}
	}, [isFirstDay]);

	// 대사 묶음(row)이 바뀌면 첫 줄부터 다시 타이핑
	useEffect(() => {
		setLineIndex(0);
		setDisplayText("");
		setDisplayChoice(null);
	}, [displayLineRow]);

	useEffect(() => {
		const {current} = pressedButton;
		if (!current) return;

		const len = DIALOGUE_CHOICES[0].length;
		const canPickEmoji = displayChoice === "emoji";
		const canPickInteractive = displayChoice === "interactive";

		//화살표 좌우로 선택지 이동, A버튼으로 선택지 선택
		switch (current) {
			case "left":
				if (canPickEmoji) {
					setSelectedIndex(prev => (prev - 1 + len) % len);
				} else if (canPickInteractive) {
					setSelectedIndex(prev => (prev - 1 + 2) % 2);
				}
				break;
			case "right":
				if (canPickEmoji) {
					setSelectedIndex(prev => (prev + 1) % len);
				} else if (canPickInteractive) {
					setSelectedIndex(prev => (prev + 1) % 2);
				}
				break;
			case "a":
				if (canPickEmoji) {
					handleEmojiSelect(selectedIndex + 1);
				} else if (canPickInteractive) {
					handlePlaySelect(selectedIndex % 2 === 1);
				}
				break;
			default:
				break;
		}
	}, [pressedButton]);

	const handleEmojiSelect = (index: number) => {
		setDisplayChoice("interactive"); //이모지 선택이 끝나면 재생 여부 선택지로 전환

		setDisplayLineRow(`00${index}` as DialogueKeys);
		setSelectedIndex(0);

		//오늘이 달의 첫 달이면 트랙 데이터를 불러오지 않고 달 전용 곡을 지정하면 되기 때문에 스킵
		if (!tracksData || Object.keys(tracksData).length === 0 || isFirstDay) return;

		const list: string[] = tracksData[`00${index}` as keyof LuckyTracks];
		if (!list || list.length === 0) return;

		setTrackToPlay(list[Math.floor(Math.random() * list.length)]); //선택한 이모지에 맞는 랜덤 곡을 임시 상태에 저장
	};

	//emoji 선택으로 골라진 곡을 유저가 재생을 컨펌하거나 취소
	const handlePlaySelect = (isPlay: boolean) => {
		//유저가 선택지를 고르면 이벤트가 끝난 것으로 세션 스토리지에 저장
		sessionStorage.setItem("interactionOver", "true");

		if (isPlay) {
			setLuckyTrack(trackToPlay); //전역 상태에 최종 선택된 트랙 저장
		} else {
			reset(); //유저가 재생을 원하지 않으면 저장된 트랙 정보 초기화
			setDisplayLineRow("005"); //재생 거절에 대한 고정 대사
		}
		setDisplayChoice(null);
	};

	//대사에 ${user}, ${month}이 포함된 경우 실제 값으로 치환
	const handleFormat = (text: string) => {
		const state: Record<string, string> = {user: session?.username ?? "user", month: monthInEng};
		return text.replace(/\$\{(\w+)\}/g, (_, key) => state[key] || "");
	};

	useEffect(() => {
		const lines = dialogue[displayLineRow] ?? [];
		const rawLine = lines[lineIndex] ?? "";

		if (!rawLine) {
			// 대사 묶음을 모두 출력한 뒤 선택지를 노출한다.
			if (displayLineRow === "000") setDisplayChoice("emoji");
			else if (isFirstDay) setDisplayChoice("interactive");
			else if (displayLineRow !== "005") setDisplayChoice("interactive");
			else setDisplayChoice(null);
			return;
		}

		const line = handleFormat(rawLine);
		let charIndex = 0;
		let displayed = "";
		const runId = ++runIdRef.current;
		setDisplayText("");

		function typeChar() {
			if (runId !== runIdRef.current) return;

			if (charIndex >= line.length) {
				nextLineTimerRef.current = setTimeout(() => {
					if (runId !== runIdRef.current) return;
					setLineIndex(prev => prev + 1);
				}, 700);
				return;
			}

			const current = line[charIndex];
			const next = line[charIndex + 1] ?? "";

			if (current === "\\" && next === "n") {
				displayed += "\n";
				charIndex += 2;
			} else {
				displayed += current;
				charIndex += 1;
			}

			setDisplayText(displayed);
			charTimerRef.current = setTimeout(typeChar, 50);
		}

		typeChar();

		return () => {
			if (charTimerRef.current) clearTimeout(charTimerRef.current);
			if (nextLineTimerRef.current) clearTimeout(nextLineTimerRef.current);
		};
	}, [displayLineRow, lineIndex, isFirstDay, monthInEng, session?.username]);

	return (
		<section className="animate-fadeIn flex flex-col w-full h-full justify-end items-center">
			<div className="mb-[5.5rem] max-h-full flex flex-col w-full justify-end items-center gap-4">
				{displayText && (
					<div className="text-box relative w-fit max-w-[26rem] h-fit min-h-12 py-spacing-10 px-spacing-12 max-h-2/3 bg-black border border-px border-white rounded-md text-white flex flex-col items-start gap-spacing-4">
						<p id="dialog" className="tracking-widest text-xxxs">
							{displayText}
						</p>
					</div>
				)}
				<img src="/icon/alien.gif" alt="alien" className="w-12 h-12 mt-auto" />
			</div>
			{displayChoice === "emoji" && (
				<div className="-mt-20 animate-fadeIn choices flex flex-row items-center justify-between w-[28rem] max-w-full text-xl p-spacing-10 h-20 duration-50">
					{choices?.length > 0 &&
						choices.map((c, i) => (
							<button key={`choice-${i + 1}`} onClick={() => handleEmojiSelect(i + 1)} className="flex flex-row items-center gap-spacing-2">
								<PlayIcon className={`size-5 animate-blink ${i === selectedIndex ? "h-8" : "h-0"} mt-spacing-6`}></PlayIcon>
								<p>{c}</p>
							</button>
						))}
				</div>
			)}
			{displayChoice === "interactive" && (
				<div className="-mt-20 animate-fadeIn choices flex flex-row items-center justify-between w-[28rem] max-w-full text-xxxs p-spacing-10 h-20 duration-100">
					<button onClick={() => handlePlaySelect(false)} className="flex flex-row items-center gap-spacing-2">
						<PlayIcon className={`size-5 animate-blink ${selectedIndex % 2 === 0 ? "h-8" : "h-0"}`}></PlayIcon>
						<p className="tracking-widest">no</p>
					</button>
					<button onClick={() => handlePlaySelect(true)} className="flex flex-row items-center gap-spacing-2">
						<PlayIcon className={`size-5 animate-blink ${selectedIndex % 2 === 1 ? "h-8" : "h-0"}`}></PlayIcon>
						<p className="tracking-widest">play</p>
					</button>
				</div>
			)}
		</section>
	);
}
