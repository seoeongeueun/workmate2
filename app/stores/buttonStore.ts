import {create} from "zustand";
import type {ButtonValue} from "@/types";

// 작동하는 게임보이의 버튼 종류와 키보드 매핑
// export const KEY_TO_BUTTON: Record<string, ButtonValue> = {
// 	KeyA: "a",
// 	KeyB: "b",
// 	ArrowUp: "up",
// 	ArrowDown: "down",
// 	ArrowLeft: "left",
// 	ArrowRight: "right",
// };

interface ButtonState {
	isPowerOn: boolean;
	pressedButton: ButtonValue | null;
	pressButton: (button: ButtonValue) => void;
	resetButtons: () => void;
}

export const useButtonStore = create<ButtonState>(set => ({
	isPowerOn: false,
	pressedButton: null,
	pressButton: button =>
		set(state => {
			if (button === "power") {
				return {isPowerOn: !state.isPowerOn, pressedButton: button};
			}
			return {pressedButton: button};
		}),
	resetButtons: () => set({pressedButton: null}),
}));
