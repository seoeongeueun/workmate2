import LoadingScreen from "./loadingScreen";
import LoginScreen from "./loginScreen";
import PlayScreen from "./playScreen";
import {apiRequest} from "../lib/tools";
import {useState, useEffect} from "react";
import {Triggers} from "../page";
import Playlist from "../classes/Playlist";
import LuckyScreen from "./luckyScreen";
import {MAX_AGE} from "@/app/lib/session";

interface MusicPlayerProps {
	triggers: Triggers;
}

export default function MusicPlayer({triggers}: MusicPlayerProps) {
	const [playlist, setPlaylist] = useState<Playlist | undefined>(undefined);
	const [isLogin, setIsLogin] = useState<boolean | undefined>(undefined);
	const [username, setUsername] = useState<string>("user");
	const [chosenTrack, setChosenTrack] = useState<string>("");
	const [showLucky, setShowLucky] = useState<boolean>(false);
	const [expiration, setExpiration] = useState<string>("");

	useEffect(() => {
		const isOver = localStorage.getItem("interactionOver");
		setShowLucky(isOver !== "true");
	}, []);

	const checkSession = async () => {
		try {
			const response = await apiRequest("/api/auth", "GET");
			const id = response?.playlistId;
			setUsername(response?.username);

			const expiration = await apiRequest("/api/logout");
			const timeLeft = expiration?.timeLeft;
			if (timeLeft) setExpiration(calcExpiration(timeLeft));

			setTimeout(() => {
				const loggedIn = response?.isValid;
				if (!loggedIn) localStorage.removeItem("interactionOver");
				setIsLogin(loggedIn);

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

	//재미 요소로 로그인 할때마다 남은 세션 타임을 계산해서 배터리 잔량으로 반영
	const calcExpiration = (timeLeft: number) => {
		return ((timeLeft / MAX_AGE) * 100).toFixed(2) + "%";
	};

	useEffect(() => {
		switch (isLogin) {
			case true:
				const isOver = localStorage.getItem("interactionOver");
				setShowLucky(isOver !== "true");
				checkSession();
				break;
			case undefined:
				checkSession();
				break;
			case false:
				setShowLucky(false);
				setPlaylist(undefined);
			default:
				break;
		}
	}, [isLogin]);

	if (isLogin === false) return <LoginScreen setIsLogin={setIsLogin} />;
	else if (isLogin && showLucky && username)
		return <LuckyScreen triggers={triggers} username={username} setChosenTrack={setChosenTrack} setOpen={setShowLucky} />;
	else if (playlist) return <PlayScreen playlist={playlist} triggers={triggers} chosenTrack={chosenTrack} setIsLogin={setIsLogin} expiration={expiration} />;
	else return <LoadingScreen />;

	// if (isLogin === false) return <LoginScreen setIsLogin={setIsLogin} />;
	// else {
	// 	if (showLucky) return <LuckyScreen triggers={triggers} username={username} setChosenTrack={setChosenTrack} setOpen={setShowLucky} />;
	// 	else if (playlist) return <PlayScreen playlist={playlist} triggers={triggers} chosenTrack={chosenTrack} setIsLogin={setIsLogin} />;
	// }
}
