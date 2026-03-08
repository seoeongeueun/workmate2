import {create} from "zustand";
import type {ButtonValue} from "@/types";
import {play} from "@/lib";

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
	togglePower: () => void;
	pressedButton: {prev: ButtonValue | null; current: ButtonValue | null};
	pressButton: (button: ButtonValue) => void;
	resetButtons: () => void;
}

export const useButtonStore = create<ButtonState>((set, get) => ({
	isPowerOn: false,
	pressedButton: {prev: null, current: null},
	togglePower: () =>
		set(state => {
			// 전원이 켜지면 효과음 재생
			const next = !state.isPowerOn;
			if (next) play("power");
			return {isPowerOn: next};
		}),
	pressButton: button => {
		if (button === "power") {
			const next = !get().isPowerOn;
			if (next) play("power");
			set({isPowerOn: next, pressedButton: {prev: get().pressedButton.current, current: button}});
			return;
		}
		set({pressedButton: {prev: get().pressedButton.current, current: button}});
	},
	resetButtons: () => set({pressedButton: {prev: null, current: null}}),
}));
