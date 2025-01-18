import {MusicalNoteIcon} from "@heroicons/react/24/solid";

export default function LoadingScreen() {
	return (
		<div className="flex flex-col h-full justify-center items-center">
			<div className="flex flex-row justify-between gap-2">
				<MusicalNoteIcon className="size-4 animate-bounce mt-2" />
				<img src="/icon/alien.gif" alt="alien" className="w-12 h-12" />
				<img src="/icon/song.png" alt="song" className="w-3 h-3 mt-2 animate-bounce"></img>
			</div>
			<span className="text-xxxs text-black tracking-widest ml-1 mt-2">loading</span>
		</div>
	);
}
