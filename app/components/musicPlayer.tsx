import LoadingScreen from "./loadingScreen";
import LoginScreen from "./loginScreen";
import PlayScreen from "./playScreen";
import {apiRequest} from "../lib/tools";
import {useState, useEffect} from "react";
import {usePlaylistContext} from "../context/playlistContext";

export default function MusicPlayer() {
	const {playlist, setPlaylist} = usePlaylistContext();
	const [isLogin, setIsLogin] = useState<boolean>(false);

	const checkSession = async () => {
		try {
			const response = await apiRequest("/api/auth", "GET");
			const id = response?.playlistId;
			setIsLogin(response.isValid);
			if (id) fetchPlaylist(id);
		} catch (error) {
			console.error("Error checking session:", error);
			setIsLogin(false);
			setPlaylist(undefined);
		}
	};

	const fetchPlaylist = async (id: string) => {
		try {
			const playlist = await apiRequest(`/api/playlist/${id}`, "GET");
			if (playlist) setPlaylist(playlist);
		} catch (error) {
			console.error("Error fetching playlist:", error);
		}
	};

	useEffect(() => {
		checkSession();
	}, []);

	return (
		<>
			<LoadingScreen />
		</>
	);
}
