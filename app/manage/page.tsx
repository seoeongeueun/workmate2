"use client";

import {apiRequest} from "../lib/tools";
import React, {useState, useEffect} from "react";
import {useRouter} from "next/navigation";
import VideoChecker from "../components/VideoChecker";

export default function Manage() {
	const [message, setMessage] = useState<string>("");
	const [authenticated, setAuthenticated] = useState<boolean | undefined>(undefined);
	const router = useRouter();

	const handleAccess = async () => {
		const input = document.getElementById("access-code") as HTMLInputElement;
		const value = input?.value || "";

		if (!value) return;

		try {
			const response = await apiRequest("/api/manage", "POST", {
				inputKey: value,
			});

			if (response?.error) {
				console.log(response.error);
				setMessage("This is a restricted page. Redirecting to main page...");
				setAuthenticated(false);
				return;
			}
			setAuthenticated(true);
		} catch (error) {
			console.error("Request failed:", error);
			setMessage("error: try again");
		}
	};

	useEffect(() => {
		if (authenticated === false) {
			setTimeout(() => {
				router.push("/");
			}, 1500);
		}
	}, [authenticated]);

	return (
		<div className="flex w-full h-screen bg-gray-2 items-center justify-center gap-4">
			{!authenticated ? (
				<div className="flex flex-col items-center justify-center gap-4">
					<p className="text-xs text-black">Restricted: Enter Access Code</p>
					<div className="flex flex-row items-center">
						<input type="password" id="access-code" className="rounded-px px-spacing-4"></input>
						<button type="submit" className="ml-4" onClick={() => handleAccess()}>
							go
						</button>
					</div>
					{message}
				</div>
			) : (
				<VideoChecker />
			)}
		</div>
	);
}
