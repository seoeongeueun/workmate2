import type {Metadata} from "next";
import {SettingsButton, PowerLight, ABButtons, StartButtons, MoveButton} from "./ui";
import {QueryProvider} from "@/query";
import "./globals.css";
import "./global.scss";
import {Suspense} from "react";

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
				<SettingsButton />
				<div className="w-screen h-full flex items-center justify-start md:justify-center overflow-auto">
					<div className="gameboy-body w-[77rem] h-[30rem] flex items-center justify-center">
						<div className="gameboy-frames flex flex-row items-center position-center">
							<div className="body-left">
								<div className="body-wing left">
									<div className="wing">
										<div className="layer layer-3"></div>
										<div className="layer layer-4"></div>
										<div className="layer layer-5"></div>
										<div className="layer layer-6"></div>
										<div className="layer layer-7"></div>
										<div className="layer layer-8"></div>
									</div>
									<div className="corner"></div>
								</div>
								<div className="body-side left">
									<div className="inner"></div>
									<div className="shadow">
										<div className="layer layer-1"></div>
									</div>
									<div className="inner bottom"></div>
									<div className="shadow bottom"></div>
									<div className="shadow bottom right"></div>
								</div>
								<Suspense
									fallback={
										<div className="move-button">
											<div className="vertical">
												<div className="tip trigger" data-button-type="up"></div>
												<div className="tip trigger opacity-0" data-button-type="down"></div>
											</div>
											<div className="horizontal">
												<div className="tip trigger" data-button-type="left"></div>
												<div className="tip trigger" data-button-type="right"></div>
											</div>
											<div className="rect pointer-events-none"></div>
										</div>
									}
								>
									<MoveButton />
								</Suspense>
								<Suspense
									fallback={
										<div className="start-buttons">
											<div className="border">
												<div className="start trigger" data-button-type="power"></div>
												<span>START</span>
											</div>
											<div className="border">
												<div className="select trigger" data-button-type="select"></div>
												<span>MENU</span>
											</div>
										</div>
									}
								>
									<StartButtons />
								</Suspense>
							</div>
							<div className="flex flex-col items-center justify-center z-20">
								<div className="body-frame relative bg-body"></div>
								<div className="body-bottom">
									<div className="base absolute bg-body w-full h-full z-20">
										<div className="layer-1"></div>
									</div>
								</div>
								{/* <div className="logo">
									<span>Workmate</span>
								</div> */}
							</div>
							<div className="body-right">
								<div className="body-side right">
									<div className="inner"></div>
									<div className="shadow"></div>
									<div className="inner bottom"></div>
									<div className="corner"></div>
								</div>
								<div className="body-wing right">
									<div className="wing">
										<div className="layer layer-3"></div>
										<div className="layer layer-4"></div>
										<div className="layer layer-5"></div>
										<div className="layer layer-6"></div>
										<div className="layer layer-7"></div>
										<div className="layer layer-8"></div>
									</div>
									<div className="shadow">
										<div className="layer layer-1"></div>
									</div>
									<div className="corner" />
								</div>

								<Suspense
									fallback={
										<div className="power-button">
											<div className="power" />
											<span>POWER</span>
										</div>
									}
								>
									<PowerLight />
								</Suspense>
								<Suspense
									fallback={
										<div className="ab-buttons">
											<div className="b-button trigger" data-button-type="b">
												<span className="pointer-events-none">B</span>
											</div>
											<div className="a-button trigger" data-button-type="a">
												<span className="pointer-events-none">A</span>
											</div>
										</div>
									}
								>
									<ABButtons />
								</Suspense>
								<div className="speaker">
									<div className="line"></div>
									<div className="line"></div>
									<div className="line"></div>
									<div className="line"></div>
									<div className="line"></div>
								</div>
							</div>
						</div>
						<div className="relative pointer-events-none top-[4rem] w-fit h-fit flex flex-col justify-center items-center">
							<div className="frame-top">
								<div className="top">
									<div>
										<div className="top-layer"></div>
									</div>
								</div>
								<div className="base">
									<div></div>
								</div>
							</div>
							<div className="frame-side right">
								<div></div>
							</div>
							{/* 화면 영역 */}
							<QueryProvider>
								<div className="pointer-events-auto bg-black border border-black px-spacing-4 py-spacing-8 w-fit z-30">
									<div className="w-[32rem] h-[20rem] bg-off-screen">
										<div className="w-full h-full flex flex-col justify-center items-center [&>section]:bg-gray-2">{children}</div>
									</div>
								</div>
							</QueryProvider>
							<div className="frame-side left">
								<div></div>
							</div>
							<div className="frame-bottom">
								<div className="base">
									<div></div>
									<span className="playlist-title text-nowrap">WORKMATE</span>
								</div>
								<div className="top">
									<div>
										<div className="top-layer"></div>
									</div>
								</div>
							</div>
						</div>
					</div>
					<div className="w-full h-fit position-center pointer-events-none">
						<div className="blur-shadow">
							<div className="body-filler"></div>
						</div>
					</div>
				</div>
			</body>
		</html>
	);
}
