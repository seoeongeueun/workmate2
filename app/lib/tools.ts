interface APIResponse<T = any> {
	error?: string;
	data?: T;
	[key: string]: any;
}

export async function apiRequest<T = any>(url: string, method: string = "GET", data?: unknown): Promise<APIResponse<T>> {
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
		if (!response.ok) {
			const errorData = await response.json();
			console.error(`Error with ${method} request to ${url}:`, errorData);
			return {error: errorData.error};
		}
		return (await response.json()) as T;
	} catch (error) {
		console.error("Error during fetch:", error);
		throw error;
	}
}
