import {MusicalNoteIcon} from "@heroicons/react/24/solid";
import Image from "next/image";

export default function LoadingScreen() {
	return (
		<div className="flex flex-col h-full justify-center items-center">
			<div className="flex flex-row justify-between gap-2">
				<MusicalNoteIcon className="size-4 animate-bounce mt-2" />
				<Image src="/icon/alien.gif" alt="alien" width={30} height={30} className="w-12 h-12" />
				<Image src="/icon/song.png" alt="song" width={7.5} height={7.5} className="w-3 h-3 mt-2 animate-bounce" />
			</div>
			<span className="text-xl text-black !tracking-widest ml-1 mt-2">workmate</span>
			<span className="text-xxxs text-black tracking-widest ml-l mt-1">by seoeongeueun</span>
		</div>
	);
}
