interface APIResponse<T = any> {
	error?: string;
	data?: T;
	[key: string]: any;
}

export async function apiRequest<T = any>(url: string, method: string = "GET", data?: unknown): Promise<APIResponse<T>> {
	if (typeof window !== "undefined" && window.electron) {
		//console.log(`[IPC Request Sent] ${url}`, {method, data, stack: new Error().stack});
		const response = await window.electron.invoke("api-request", {url, method, data});
		//console.log(`[IPC Response Received] ${url}`, response);
		return {data: response};
	} else {
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
				console.log(`Error with ${method} request to ${url}:`, errorData);
				return {error: errorData.error};
			}
			const responseData = await response.json();
			return {data: responseData};
		} catch (error) {
			console.error("Error during fetch:", error);
			throw error;
		}
	}
}
