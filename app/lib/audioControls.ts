const Power = "/music/power.mp3";

type AudioKey = "power";

const audios: Record<AudioKey, HTMLAudioElement> = {
	power: typeof window !== "undefined" ? new Audio(Power) : (null as unknown as HTMLAudioElement),
};

let current: AudioKey | null = null;

export const play = (name: AudioKey): void => {
	if (current) {
		audios[current].pause();
	}

	audios[name].play();
	current = name;
};

export const pause = (name: AudioKey): void => {
	current = null;
	audios[name].pause();
};
