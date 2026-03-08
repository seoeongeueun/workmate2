"use client";
import {useButtonStore} from "@/stores";

export function StartButtons() {
	const pressButton = useButtonStore(state => state.pressButton);

	return (
		<div className="start-buttons">
			<div className="border">
				<div onClick={() => pressButton("power")} className="start trigger" data-button-type="power"></div>
				<span>START</span>
			</div>
			<div className="border">
				<div onClick={() => pressButton("select")} className="select trigger" data-button-type="select"></div>
				<span>MENU</span>
			</div>
		</div>
	);
}
