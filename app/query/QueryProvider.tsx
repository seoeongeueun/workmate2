"use client";

import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {useState} from "react";
import {QUERY_CLIENT_DEFAULT_OPTIONS} from "@/lib";

export function QueryProvider({children}: {children: React.ReactNode}) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: QUERY_CLIENT_DEFAULT_OPTIONS,
			})
	);

	return (
		<QueryClientProvider client={queryClient}>
			{children}
			{/* <ReactQueryDevtools initialIsOpen={false} /> */}
		</QueryClientProvider>
	);
}
