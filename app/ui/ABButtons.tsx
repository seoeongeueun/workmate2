"use client";

import {useButtonStore} from "@/stores";

export function ABButtons() {
	const pressButton = useButtonStore(state => state.pressButton);

	return (
		<div className="ab-buttons">
			<div onClick={() => pressButton("b")} className="b-button trigger" data-button-type="b">
				<span className="pointer-events-none">B</span>
			</div>
			<div onClick={() => pressButton("a")} className="a-button trigger" data-button-type="a">
				<span className="pointer-events-none">A</span>
			</div>
		</div>
	);
}
