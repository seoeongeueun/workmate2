import LoadingScreen from "./loadingScreen";
import LoginScreen from "./loginScreen";
import PlayScreen from "./playScreen";
import {apiRequest} from "../lib/tools";
import {useState, useEffect} from "react";
import {Triggers} from "../page";
import LuckyScreen from "./luckyScreen";
import {MAX_AGE} from "@/app/lib/session";
import {usePlaylistStore} from "@/app/stores/playlistStore";

interface MusicPlayerProps {
	triggers: Triggers;
}

export default function MusicPlayer({triggers}: MusicPlayerProps) {
	const [isLogin, setIsLogin] = useState<boolean | undefined>(undefined);
	const [username, setUsername] = useState<string>("user");
	const [chosenTrack, setChosenTrack] = useState<string>("");
	const [showLucky, setShowLucky] = useState<boolean>(false);
	const [expiration, setExpiration] = useState<string>("");

	const initialize = usePlaylistStore(s => s.initialize);
	const reset = usePlaylistStore(s => s.reset);
	const title = usePlaylistStore(s => s.title);

	useEffect(() => {
		const isOver = localStorage.getItem("interactionOver");
		setShowLucky(isOver !== "true");
	}, []);

	const checkSession = async () => {
		try {
			const response = await apiRequest("/api/auth", "GET");
			const data = response?.data;
			const id = data?.playlistId;
			setUsername(data?.username);

			const expiration = await apiRequest("/api/logout");
			const timeLeft = expiration?.timeLeft;
			if (timeLeft) setExpiration(calcExpiration(timeLeft));

			setTimeout(() => {
				const loggedIn = data?.isValid;
				if (!loggedIn) localStorage.removeItem("interactionOver");
				setIsLogin(loggedIn);
				if (id) fetchPlaylist(id);
				else reset();
			}, 2000);
		} catch (error) {
			console.error("Error checking session:", error);
			setIsLogin(false);
			reset();
		}
	};

	const fetchPlaylist = async (id: string) => {
		try {
			const response = await apiRequest(`/api/playlist/?id=${id}`, "GET");
			const data = response?.data;
			if (data?.title) {
				// setPlaylist(prevPlaylist => {
				// 	if (!prevPlaylist) {
				// 		return new Playlist(data.title, id, data.tracks);
				// 	} else {
				// 		prevPlaylist.title = data.title;
				// 		prevPlaylist.objectId = id;
				// 		prevPlaylist.tracks = data.tracks;
				// 		return prevPlaylist;
				// 	}
				// });
				initialize(data.title, id, data.tracks);
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
				// 로그인 액션이 없었어도 유지된 세션이 있는지 확인
				checkSession();
				break;
			case false:
				setShowLucky(false);
				reset();
				break;
			default:
				break;
		}
	}, [isLogin]);

	if (isLogin === false) return <LoginScreen setIsLogin={setIsLogin} />;
	else if (isLogin && showLucky && username)
		return <LuckyScreen triggers={triggers} username={username} setChosenTrack={setChosenTrack} setOpen={setShowLucky} />;
	else if (title) return <PlayScreen triggers={triggers} chosenTrack={chosenTrack} setIsLogin={setIsLogin} expiration={expiration} />;
	else return <LoadingScreen />;
}
