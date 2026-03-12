"use client";

import {useEffect, useState} from "react";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import DialogueScreen from "@/components/DialogueScreen";
import {luckyQueries, playlistQueries} from "@/query";
import {useButtonStore} from "@/stores";
import MusicScreen from "@/components/MusicScreen";

export default function Page() {
	const [isOpenLucky, setIsOpenLucky] = useState<boolean | undefined>(undefined);
	const queryClient = useQueryClient();
	const isPowerOn = useButtonStore(state => state.isPowerOn);
	const togglePower = useButtonStore(state => state.togglePower);

	const {data: playlistData} = useQuery(playlistQueries.detail());

	useEffect(() => {
		//sessionstorage에 interactionover가 true로 설정되어 있으면 openLucky는 스킵한다
		const interactionOver = sessionStorage.getItem("interactionOver");
		setIsOpenLucky(interactionOver !== "true");
		togglePower(true); //페이지가 로드될 때 전원을 켠다
	}, []);

	useEffect(() => {
		//초기 로딩 시 lucky 트랙과 플레이리스트 정보를 미리 패칭하여 캐시에 저장한다
		void Promise.all([queryClient.prefetchQuery(luckyQueries.all()), queryClient.prefetchQuery(playlistQueries.detail())]);
	}, [queryClient]);

	if (isOpenLucky === undefined) return null;
	return (
		<section
			className={`${isPowerOn ? "animate-fadeIn" : "hidden"} relative w-full h-full flex items-center justify-center overflow-hidden bg-black text-white select-none`}
		>
			{isOpenLucky ? <DialogueScreen setOpen={setIsOpenLucky} /> : <MusicScreen />}
		</section>
	);
}
