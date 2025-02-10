"use client";
import React, {useState, useEffect} from "react";
import {Battery100Icon, PlayIcon, ExclamationTriangleIcon} from "@heroicons/react/24/solid";
import {apiRequest} from "../lib/tools";

enum ErrorCodes {
	MissingFields = 0,
	UsernameTaken = 1,
	SignupFail = 2,
	LoginError = 3,
	PasswordLength = 4,
}

interface LoginScreenProps {
	setIsLogin: React.Dispatch<React.SetStateAction<boolean | undefined>>;
}

export default function LoginScreen({setIsLogin}: LoginScreenProps) {
	const [selectLogin, setSelectLogin] = useState<boolean>(true);
	const [errorCode, setErrorCode] = useState<number | null>(null);

	const errorMessages: Record<ErrorCodes, string> = {
		[ErrorCodes.MissingFields]: "All fields are required",
		[ErrorCodes.UsernameTaken]: "Username is already in use",
		[ErrorCodes.SignupFail]: "Failed to sign up, please try again later",
		[ErrorCodes.LoginError]: "Log in failed, please check the fields again",
		[ErrorCodes.PasswordLength]: "Password should be at least 6 characters long",
	};

	const handleKeyDown = (event: KeyboardEvent) => {
		if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
			setSelectLogin(prev => !prev);
		}
	};

	useEffect(() => {
		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, []);

	const getErrorMessage = (code: ErrorCodes | null): string => {
		if (code === null) {
			if (selectLogin) return "Log in or sign up to continue";
			return "Fill in the fields to sign up";
		}
		return errorMessages[code];
	};

	const handleLogin = async () => {
		//login으로 화살표 이동
		setSelectLogin(true);

		const usernameInput = document.getElementById("username") as HTMLInputElement;
		const passwordInput = document.getElementById("password") as HTMLInputElement;

		const username = usernameInput?.value;
		const password = passwordInput?.value;

		if (!password || !username) {
			setErrorCode(0);
			return;
		}

		if (password.length < 6) {
			setErrorCode(4);
			return;
		}

		try {
			const response = await apiRequest<{success: boolean}>("/api/auth", "POST", {
				username,
				password,
			});

			if (response?.error) {
				const match = response.error.match(/ErrorCode:\s*(\d+)/);
				if (match) setErrorCode(parseInt(match[1]));
				else setErrorCode(3);
				setIsLogin(false);
				return;
			}
			setIsLogin(true);
		} catch (error) {
			setErrorCode(3);
			setIsLogin(false);
			return;
		}
	};

	const handleSignup = async () => {
		// signup으로 화살표 이동
		setSelectLogin(false);

		const usernameInput = document.getElementById("username") as HTMLInputElement;
		const passwordInput = document.getElementById("password") as HTMLInputElement;

		const username = usernameInput?.value;
		const password = passwordInput?.value;

		if (!password || !username) {
			setErrorCode(0);
			return;
		}

		if (password.length < 6) {
			setErrorCode(4);
			return;
		}

		try {
			const response = await apiRequest<{success: boolean}>("/api/signup", "POST", {
				username,
				password,
			});

			if (response?.error) {
				const match = response.error.match(/ErrorCode:\s*(\d+)/);
				if (match) setErrorCode(parseInt(match[1]));
				else setErrorCode(2);
				setIsLogin(false);
				return;
			}
			setIsLogin(true);
		} catch (error) {
			setErrorCode(2);
			setIsLogin(false);
			return;
		}
	};

	return (
		<div className="font-galmuri flex flex-col items-center w-full h-full justify-between gap-spacing-10 bg-gray-2 p-spacing-10 text-black">
			<div className="battery flex flex-row w-fit items-center ml-auto mb-px">
				<div className="relative border border-px border-black w-[1.7rem] h-[0.9rem] bg-transparent rounded-[0.2rem]">
					<div className="absolute rounded-xs max-w-[1.2rem] max-h-[0.4rem] w-full h-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
						<div className="h-full bg-black w-full"></div>
					</div>
				</div>
				<div className="w-[0.15rem] h-[0.5rem] bg-black rounded-r-sm"></div>
			</div>
			<div className="flex flex-row items-center text-xxs">
				{errorCode !== null && <ExclamationTriangleIcon className="size-5 mr-2 mt-px" />}
				{getErrorMessage(errorCode)}
			</div>
			<div className="flex flex-col items-center w-full text-s gap-spacing-6 mb-1">
				<input
					id="username"
					type="text"
					placeholder="Username"
					className="w-full text-xs bg-gray-1 border border-black rounded-[1px] px-3"
					onInput={e => {
						e.currentTarget.value = e.currentTarget.value.replace(/[^A-Za-z]/g, "");
					}}
				/>
				<input id="password" type="password" minLength={6} placeholder="Password" className="w-full text-xs bg-gray-1 border border-black rounded-[1px] px-3" />
				<div className="flex flex-row justify-center items-center mt-spacing-8 mr-4 gap-16">
					<div className="flex flex-row items-center justify-end gap-2 w-32">
						{selectLogin && <PlayIcon className="size-5 animate-blink"></PlayIcon>}
						<button type="submit" onClick={handleLogin}>
							log in
						</button>
					</div>
					<div className="flex flex-row items-center justify-end gap-2 w-32">
						{!selectLogin && <PlayIcon className="size-5 animate-blink"></PlayIcon>}
						<button type="submit" onClick={handleSignup}>
							sign up
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
