"use client";

import {useEffect, useState} from "react";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import DialogueScreen from "@/components/DialogueScreen";
import {luckyQueries, playlistQueries} from "@/query";
import {usePlaylistStore} from "@/stores";
import MusicScreen from "@/components/MusicScreen";

export default function Page() {
	const [isOpenLucky, setIsOpenLucky] = useState<boolean | undefined>(undefined);
	const queryClient = useQueryClient();
	const initializePlaylist = usePlaylistStore(state => state.initialize);

	const {data: playlistData} = useQuery(playlistQueries.detail());

	useEffect(() => {
		//sessionstorage에 interactionover가 true로 설정되어 있으면 openLucky는 스킵한다
		const interactionOver = sessionStorage.getItem("interactionOver");
		setIsOpenLucky(interactionOver !== "true");
	}, []);

	useEffect(() => {
		//초기 로딩 시 lucky 트랙과 플레이리스트 정보를 미리 패칭하여 캐시에 저장한다
		void Promise.all([queryClient.prefetchQuery(luckyQueries.all()), queryClient.prefetchQuery(playlistQueries.detail())]);
	}, [queryClient]);

	// playlistData가 로드되면 플레이리스트 스토어에 값 추가
	useEffect(() => {
		if (!playlistData || !playlistData.objectId) return;
		initializePlaylist(playlistData.title, String(playlistData.objectId), playlistData.tracks);
	}, [playlistData, initializePlaylist]);

	if (isOpenLucky === undefined) return null;
	return isOpenLucky ? <DialogueScreen setOpen={setIsOpenLucky} /> : <MusicScreen />;
}
