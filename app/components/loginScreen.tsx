"use client";
import React, {useState, useEffect} from "react";
import {PlayIcon, ExclamationTriangleIcon} from "@heroicons/react/24/solid";
import {apiRequest} from "../lib/tools";
import {useQueryClient} from "@tanstack/react-query";

enum ErrorCodes {
	MissingFields = 0,
	UsernameTaken = 1,
	SignupFail = 2,
	LoginError = 3,
	PasswordLength = 4,
	InvalidChars = 5,
	UserNotFound = 6,
}

export default function LoginScreen() {
	const [selectLogin, setSelectLogin] = useState<boolean>(true);
	const [errorCode, setErrorCode] = useState<number | null>(null);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const queryClient = useQueryClient();

	const errorMessages: Record<ErrorCodes, string> = {
		[ErrorCodes.MissingFields]: "All fields are required",
		[ErrorCodes.UsernameTaken]: "Username is already in use",
		[ErrorCodes.SignupFail]: "Failed to sign up, please try again later",
		[ErrorCodes.LoginError]: "Log in failed, please check the fields again",
		[ErrorCodes.PasswordLength]: "Password should be at least 6 characters long",
		[ErrorCodes.InvalidChars]: "Username can only contain letters and nums",
		[ErrorCodes.UserNotFound]: "Username not found",
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
		if (isLoading) return "Processing...";
		if (code === null) {
			if (selectLogin) return "Log in or sign up to continue";
			return "Fill in the fields to sign up";
		}
		return errorMessages[code];
	};

	const handleLogin = async () => {
		setIsLoading(true);

		//login으로 화살표 이동
		setSelectLogin(true);

		const usernameInput = document.getElementById("username") as HTMLInputElement;
		const passwordInput = document.getElementById("password") as HTMLInputElement;

		const username = usernameInput?.value;
		const password = passwordInput?.value;

		if (!password || !username) {
			setIsLoading(false);
			setErrorCode(0);
			return;
		}

		if (password.length < 6) {
			setIsLoading(false);
			setErrorCode(4);
			return;
		}

		if (/[^a-zA-Z0-9]/.test(username)) {
			setIsLoading(false);
			setErrorCode(5);
			return;
		}

		try {
			const response = await apiRequest("/api/auth", "POST", {username, password});

			if (!response.success) {
				switch (response.error.code) {
					case "MISSING_INPUT":
						setErrorCode(ErrorCodes.MissingFields);
						break;
					case "USER_NOT_FOUND":
						setErrorCode(ErrorCodes.UserNotFound);
						break;
					case "USERNAME_TAKEN":
						setErrorCode(ErrorCodes.UsernameTaken);
						break;
					default:
						setErrorCode(ErrorCodes.LoginError);
				}
				setIsLoading(false);
				return;
			}
			queryClient.invalidateQueries({queryKey: ["session"]}); //최신 세션 반영

			//로그인 성공 후 /play로 이동
			window.location.href = "/play";
			return;
		} catch (error) {
			setIsLoading(false);
			setErrorCode(ErrorCodes.LoginError);
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
			setIsLoading(false);
			setErrorCode(0);
			return;
		}

		if (password.length < 6) {
			setIsLoading(false);
			setErrorCode(4);
			return;
		}

		if (/[^a-zA-Z0-9]/.test(username)) {
			setIsLoading(false);
			setErrorCode(5);
			return;
		}

		try {
			setIsLoading(true);
			const response = await apiRequest("/api/signup", "POST", {username, password});

			if (!response.success) {
				switch (response.error.code) {
					case "MISSING_INPUT":
						setErrorCode(ErrorCodes.MissingFields);
						break;
					case "USERNAME_TAKEN":
						setErrorCode(ErrorCodes.UsernameTaken);
						break;
					default:
						setErrorCode(ErrorCodes.SignupFail);
				}
				setIsLoading(false);
				return;
			}
			queryClient.invalidateQueries({queryKey: ["session"]});
			setIsLoading(false);

			//로그인 성공 후 /play로 이동
			window.location.href = "/play";
			return;
		} catch (error) {
			setIsLoading(false);
			setErrorCode(ErrorCodes.LoginError);
			return;
		}
	};

	return (
		<section className="font-galmuri flex flex-col items-center w-full h-full justify-between gap-spacing-10 bg-gray-2 p-spacing-10 text-black">
			<div className="battery flex flex-row w-fit items-center ml-auto mb-px">
				<div className="relative border border-px border-black w-[1.7rem] h-[0.9rem] bg-transparent rounded-[0.2rem]">
					<div className="absolute rounded-xs max-w-[1.2rem] max-h-[0.4rem] w-full h-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
						<div className="h-full bg-black w-full"></div>
					</div>
				</div>
				<div className="w-[0.15rem] h-[0.5rem] bg-black rounded-r-sm"></div>
			</div>
			<div className="flex flex-row items-center text-xxs">
				{errorCode !== null && !isLoading && <ExclamationTriangleIcon className="size-5 mr-2 mt-px" />}
				{getErrorMessage(errorCode)}
			</div>
			<div className="flex flex-col items-center w-full text-s gap-spacing-6 mb-1">
				<input id="username" type="text" placeholder="Username" className="w-full text-xs bg-gray-1 border border-black rounded-[1px] px-3" />
				<input id="password" type="password" minLength={6} placeholder="Password" className="w-full text-xs bg-gray-1 border border-black rounded-[1px] px-3" />
				<div className="flex flex-row justify-center items-center mt-spacing-8 mr-4 gap-16">
					<div className="flex flex-row items-center justify-end gap-2 w-32">
						{selectLogin && <PlayIcon className="size-5 animate-blink"></PlayIcon>}
						<button type="submit" disabled={isLoading} onClick={handleLogin}>
							Log In
						</button>
					</div>
					<div className="flex flex-row items-center justify-end gap-2 w-32">
						{!selectLogin && <PlayIcon className="size-5 animate-blink"></PlayIcon>}
						<button type="submit" disabled={isLoading} onClick={handleSignup}>
							Sign Up
						</button>
					</div>
				</div>
			</div>
		</section>
	);
}
