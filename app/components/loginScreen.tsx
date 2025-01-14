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
		[ErrorCodes.LoginError]: "Login error, please try again",
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
			return "Please log in to continue";
		}
		return errorMessages[code];
	};

	const handleLogin = async () => {
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

			if (response.success) {
				setIsLogin(true);
			}
		} catch (error) {
			setErrorCode(3);
			setIsLogin(false);
			return;
		}
	};

	const handleSignup = async () => {
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

			console.log(response);

			if (response.success) {
				setIsLogin(true);
			}
		} catch (error) {
			setErrorCode(2);
			setIsLogin(false);
			return;
		}
	};

	return (
		<div className="font-galmuri flex flex-col items-center w-full h-full justify-between gap-spacing-10 bg-gray-2 p-spacing-10 text-black">
			<div className="flex flex-row w-full justify-end items-center gap-2">
				<Battery100Icon className="mb-px size-8" />
			</div>
			<div className="flex flex-row items-center text-xxs">
				{errorCode !== null && <ExclamationTriangleIcon className="size-5 mr-2" />}
				{getErrorMessage(errorCode).toUpperCase()}
			</div>
			<div className="flex flex-col items-center w-full text-s gap-spacing-6 mb-1">
				<input id="username" type="text" placeholder="Username" className="w-full text-xs bg-gray-2 border border-black rounded-[1px] px-3" />
				<input id="password" type="password" minLength={6} placeholder="Password" className="w-full text-xs bg-gray-2 border border-black rounded-[1px] px-3" />
				<div className="flex flex-row justify-center items-center mt-spacing-8 mr-4 gap-16">
					<div className="flex flex-row items-center justify-end gap-2 w-32">
						{selectLogin && <PlayIcon className="size-5 animate-blink"></PlayIcon>}
						<button type="submit" onClick={handleLogin}>
							LOG IN
						</button>
					</div>
					<div className="flex flex-row items-center justify-end gap-2 w-32">
						{!selectLogin && <PlayIcon className="size-5 animate-blink"></PlayIcon>}
						<button type="submit" onClick={handleSignup}>
							SIGN UP
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
