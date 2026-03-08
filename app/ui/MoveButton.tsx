"use client";
import {useButtonStore} from "@/stores";

export function MoveButton() {
	const pressButton = useButtonStore(state => state.pressButton);

	return (
		<div className="move-button">
			<div className="vertical">
				<div onClick={() => pressButton("up")} className="tip trigger" data-button-type="up"></div>
				<div onClick={() => pressButton("down")} className="tip trigger opacity-0" data-button-type="down"></div>
			</div>
			<div className="horizontal">
				<div onClick={() => pressButton("left")} className="tip trigger" data-button-type="left"></div>
				<div onClick={() => pressButton("right")} className="tip trigger" data-button-type="right"></div>
			</div>
			<div className="rect pointer-events-none"></div>
		</div>
	);
}
