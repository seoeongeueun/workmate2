"use client";
import React, {useState, useEffect} from "react";
import {Battery100Icon, PlayIcon, ExclamationTriangleIcon} from "@heroicons/react/24/solid";

enum ErrorCodes {
	MissingFields = 0,
	UsernameTaken = 1,
	SignupFail = 2,
	LoginError = 3,
}

export default function LoginScreen() {
	const [selectLogin, setSelectLogin] = useState<boolean>(true);
	const [errorCode, setErrorCode] = useState<number | null>(null);

	const errorMessages: Record<ErrorCodes, string> = {
		[ErrorCodes.MissingFields]: "All fields are required",
		[ErrorCodes.UsernameTaken]: "Username is already in use",
		[ErrorCodes.SignupFail]: "Failed to sign up, please try again later",
		[ErrorCodes.LoginError]: "Login error, please try again",
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

	return (
		<div className="font-galmuri animate-fadeIn flex flex-col items-center w-full h-full justify-between gap-spacing-10 bg-gray-2 p-spacing-10 text-black">
			<div className="flex flex-row w-full justify-end items-center gap-2">
				<Battery100Icon className="mb-px size-8" />
			</div>
			<div className="flex flex-row items-center text-xxs">
				{errorCode !== null && <ExclamationTriangleIcon className="size-5 mr-2" />}
				{getErrorMessage(errorCode).toUpperCase()}
			</div>
			<div className="flex flex-col items-center w-full text-s gap-spacing-6 mb-1">
				<input id="username" type="text" placeholder="Username" className="w-full text-xs bg-gray-2 border border-black rounded-[1px] px-3" />
				<input id="password" type="password" placeholder="Password" className="w-full text-xs bg-gray-2 border border-black rounded-[1px] px-3" />
				<div className="flex flex-row justify-center items-center mt-spacing-8 mr-4 gap-16">
					<div className="flex flex-row items-center justify-end gap-2 w-32">
						{selectLogin && <PlayIcon className="size-5 animate-blink"></PlayIcon>}
						<button type="submit">LOG IN</button>
					</div>
					<div className="flex flex-row items-center justify-end gap-2 w-32">
						{!selectLogin && <PlayIcon className="size-5 animate-blink"></PlayIcon>}
						<button type="button">SIGN UP</button>
					</div>
				</div>
			</div>
		</div>
	);
}
