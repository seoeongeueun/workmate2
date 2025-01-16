import LoadingScreen from "./loadingScreen";
import LoginScreen from "./loginScreen";
import PlayScreen from "./playScreen";
import {apiRequest} from "../lib/tools";
import {useState, useEffect} from "react";
import {Triggers} from "../page";
import Playlist from "../classes/Playlist";

interface MusicPlayerProps {
	triggers: Triggers;
}

export default function MusicPlayer({triggers}: MusicPlayerProps) {
	const [playlist, setPlaylist] = useState<Playlist | undefined>();
	const [isLogin, setIsLogin] = useState<boolean | undefined>(undefined);

	const checkSession = async () => {
		try {
			const response = await apiRequest("/api/auth", "GET");
			const id = response?.playlistId;

			setTimeout(() => {
				setIsLogin(response.isValid);
				if (id) fetchPlaylist(id);
				else setPlaylist(undefined);
			}, 1500);
		} catch (error) {
			console.error("Error checking session:", error);
			setIsLogin(false);
			setPlaylist(undefined);
		}
	};

	const fetchPlaylist = async (id: string) => {
		try {
			const data = await apiRequest(`/api/playlist/?id=${id}`, "GET");
			if (data?.title) {
				const playlist = new Playlist(data.title, id, data.tracks);
				setPlaylist(playlist);
			}
		} catch (error) {
			console.error("Error fetching playlist:", error);
		}
	};

	useEffect(() => {
		if (isLogin === undefined) checkSession();
	}, [isLogin]);

	if (isLogin === false) return <LoginScreen setIsLogin={setIsLogin} />;
	else {
		if (playlist) return <PlayScreen playlist={playlist} triggers={triggers} />;
		else return <LoadingScreen />;
	}
}
