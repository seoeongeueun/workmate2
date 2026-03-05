import type {Metadata} from "next";
import {QueryProvider} from "@/query";
import "./globals.css";

export const metadata: Metadata = {
	title: "workmate",
	description: "Work with me! 📻",
	openGraph: {
		title: "workmate",
		description: "A retro music player true old-school lovers 📻",
		url: "https://workmatebeta.vercel.app",
		siteName: "Workmate",
		images: [
			{
				url: "/opengraph.png",
				width: 1200,
				height: 630,
				alt: "OpenGraph Preview",
			},
		],
		type: "website",
	},
};

export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
	return (
		<html lang="en">
			<body>
				<QueryProvider>{children}</QueryProvider>
			</body>
		</html>
	);
}
