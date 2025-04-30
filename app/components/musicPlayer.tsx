import LoadingScreen from "./loadingScreen";
import LoginScreen from "./loginScreen";
import PlayScreen from "./playScreen";
import {apiRequest} from "../lib/tools";
import {useState, useEffect} from "react";
import {Triggers} from "../page";
import LuckyScreen from "./luckyScreen";
import {MAX_AGE} from "@/app/lib/session";
import {usePlaylistStore} from "@/app/stores/playlistStore";
import {useSession} from "@/app/hooks/useSession";
import {usePlaylist} from "@/app/hooks/usePlaylist";
import {useSessionExpiration} from "@/app/hooks/useSessionExpiration";

interface MusicPlayerProps {
	triggers: Triggers;
}

export default function MusicPlayer({triggers}: MusicPlayerProps) {
	const [chosenTrack, setChosenTrack] = useState<string>("");
	const [showLucky, setShowLucky] = useState<boolean>(false);
	const [expiration, setExpiration] = useState<string>("");
	const [delayFetch, setDelayFetch] = useState<boolean>(false);

	const initialize = usePlaylistStore(s => s.initialize);
	const reset = usePlaylistStore(s => s.reset);
	const title = usePlaylistStore(s => s.title);

	const {data: session, isLoading: sessionLoading, isFetching: sessionFetching} = useSession();
	const {data: expirationTime} = useSessionExpiration(!!session?.isValid); //세션이 존재할때만
	const {data: playlistData} = usePlaylist(session?.playlistId, delayFetch);

	useEffect(() => {
		const isOver = localStorage.getItem("interactionOver");
		setShowLucky(isOver !== "true");
	}, []);

	useEffect(() => {
		let timer;
		if (session?.isValid) {
			const isOver = localStorage.getItem("interactionOver");
			setShowLucky(isOver !== "true");

			timer = setTimeout(() => setDelayFetch(true), 2000);
		} else {
			timer = setTimeout(() => {
				localStorage.removeItem("interactionOver");
				reset();
			}, 2000);
		}
		return () => clearTimeout(timer);
	}, [session]);

	useEffect(() => {
		if (playlistData?.title) {
			initialize(playlistData.title, session?.playlistId, playlistData.tracks);
		} else {
			reset();
		}
	}, [playlistData]);

	useEffect(() => {
		if (expirationTime) {
			setExpiration(calcExpiration(expirationTime));
		}
	}, [expirationTime]);

	//재미 요소로 로그인 할때마다 남은 세션 타임을 계산해서 배터리 잔량으로 반영
	const calcExpiration = (timeLeft: number) => {
		return ((timeLeft / MAX_AGE) * 100).toFixed(2) + "%";
	};

	if (session === undefined) return <LoadingScreen />;
	if (!session?.isValid) return <LoginScreen />;
	if (showLucky) return <LuckyScreen triggers={triggers} username={session.username} setChosenTrack={setChosenTrack} setOpen={setShowLucky} />;
	if (title) return <PlayScreen triggers={triggers} chosenTrack={chosenTrack} setIsLogin={() => {}} expiration={expiration} />;
	return <LoadingScreen />;
}
