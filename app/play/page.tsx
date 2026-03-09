import {dehydrate, HydrationBoundary, QueryClient} from "@tanstack/react-query";
import DialogueScreen from "@/components/DialogueScreen";
import {luckyQueries} from "@/query";
import {QUERY_CLIENT_DEFAULT_OPTIONS} from "@/lib";

export default async function Page() {
	const queryClient = new QueryClient({
		defaultOptions: QUERY_CLIENT_DEFAULT_OPTIONS,
	});

	await queryClient.prefetchQuery(luckyQueries.all());

	return (
		<HydrationBoundary state={dehydrate(queryClient)}>
			<DialogueScreen />
		</HydrationBoundary>
	);
}
