import type {ApiResponse} from "@/types";
import {MAX_AGE} from "./constants";

export async function apiRequest<T = any>(url: string, method: string = "GET", data?: unknown): Promise<ApiResponse<T>> {
	const options: RequestInit = {
		method,
		headers: {
			"Content-Type": "application/json",
		},
		credentials: "include",
	};

	if (data) {
		options.body = JSON.stringify(data);
	}

	try {
		const response = await fetch(url, options);
		const responseData = await response.json().catch(() => undefined);

		if (!response.ok) {
			return (responseData ?? {success: false, error: {message: "Request failed"}}) as ApiResponse<T>;
		}

		return (responseData ?? {success: false, error: {message: "Empty response"}}) as ApiResponse<T>;
	} catch (error) {
		console.error("Error during fetch:", error);
		throw error;
	}
}

export function extractVideoId(url: string): string {
	const idMatch = url.match(/(?:youtube\.com\/(?:[^\/\n\s]+\/\s*[^\/\n\s]+\/|(?:v|e(?:mbed)?)\/|\S*?watch\?v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
	return idMatch ? idMatch[1] : "";
}

export const formatDate = (date: Date): string => {
	const options: Intl.DateTimeFormatOptions = {month: "2-digit", day: "2-digit", weekday: "short"};
	return new Intl.DateTimeFormat("en-US", options).format(date).replace(",", ".").replace(/\//g, ".");
};

export const formatTime = (date: Date): string => {
	const options: Intl.DateTimeFormatOptions = {
		hour: "2-digit",
		minute: "2-digit",
		hour12: true, // AM/PM format
	};
	return new Intl.DateTimeFormat("en-US", options).format(date);
};

//재미 요소로 로그인 할때마다 남은 세션 타임을 계산해서 배터리 잔량으로 반영
export const calcExpiration = (timeLeft: number) => {
	return ((timeLeft / MAX_AGE) * 100).toFixed(2) + "%";
};
