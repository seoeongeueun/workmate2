"use client";

import {useButtonStore} from "@/stores";
import {useEffect} from "react";
import type {ButtonValue} from "@/types";

const keyToButtonValue: Record<string, ButtonValue> = {KeyA: "a", KeyB: "b", ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right"};

export function PowerLight() {
	const isPowerOn = useButtonStore(state => state.isPowerOn);
	const pressButton = useButtonStore(state => state.pressButton);

	// 글로벌한 키보드 이벤트 핸들러 등록
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			const buttonValue = keyToButtonValue[event.code];
			if (buttonValue) pressButton(buttonValue);
		};

		window.addEventListener("keydown", handleKeyDown);

		//TODO: 언어 설정 추가 여부 검토
		// if (navigator.language.startsWith("ko")) {
		// 	setIsKorean(true);
		// } else {
		// 	setIsKorean(false);
		// }

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			//document.removeEventListener("click", handleGlobalClick);
		};
	}, []);

	return (
		<div className="power-button">
			<div className={`power ${isPowerOn ? "on animate-flicker" : ""}`}></div>
			<span>POWER</span>
		</div>
	);
}
