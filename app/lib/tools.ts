import type {ApiResponse} from "@/types";

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
