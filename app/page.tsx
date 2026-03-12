"use client";

import {useEffect, useState} from "react";
import LoadingScreen from "@/components/loadingScreen";
import LoginScreen from "@/components/loginScreen";
import {useButtonStore} from "@/stores";

export default function Page() {
	const isPowerOn = useButtonStore(state => state.isPowerOn);
	const [showLoading, setShowLoading] = useState(true);

	useEffect(() => {
		if (isPowerOn) {
			const timer = setTimeout(() => {
				setShowLoading(false);
			}, 3000);

			return () => clearTimeout(timer);
		}
	}, [isPowerOn]);

	if (!isPowerOn) return <></>;
	return <>{showLoading ? <LoadingScreen /> : <LoginScreen />}</>;
}
