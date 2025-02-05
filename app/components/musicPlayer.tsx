import LoadingScreen from "./loadingScreen";
import LoginScreen from "./loginScreen";
import PlayScreen from "./playScreen";
import {apiRequest} from "../lib/tools";
import {useState, useEffect} from "react";
import {Triggers} from "../page";
import Playlist from "../classes/Playlist";
import LuckyScreen from "./luckyScreen";

interface MusicPlayerProps {
	triggers: Triggers;
}

export default function MusicPlayer({triggers}: MusicPlayerProps) {
	const [playlist, setPlaylist] = useState<Playlist | undefined>();
	const [isLogin, setIsLogin] = useState<boolean | undefined>(undefined);
	const [username, setUsername] = useState<string>("user");
	const [chosenTrack, setChosenTrack] = useState<string>("");
	const [showLucky, setShowLucky] = useState<boolean>(true);

	const checkSession = async () => {
		try {
			const response = await apiRequest("/api/auth", "GET");
			const id = response?.playlistId;
			setUsername(response?.username);

			setTimeout(() => {
				setIsLogin(response.isValid);
				if (id) fetchPlaylist(id);
				else setPlaylist(undefined);
			}, 2000);
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
		// isLogin이 정확히 false라고 판단된 케이스 제외 세션 확인
		if (isLogin !== false) checkSession();
	}, [isLogin]);

	//return <LuckyScreen triggers={triggers} username={username} setChosenTrack={setChosenTrack} />;

	if (isLogin === false) return <LoginScreen setIsLogin={setIsLogin} />;
	else {
		if (showLucky) return <LuckyScreen triggers={triggers} username={username} setChosenTrack={setChosenTrack} setOpen={setShowLucky} />;
		else if (playlist) return <PlayScreen playlist={playlist} triggers={triggers} chosenTrack={chosenTrack} />;
		else return <LoadingScreen isLoading={isLogin} />;
	}
}
