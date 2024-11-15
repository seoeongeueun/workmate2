export default function Home() {
	return (
		<div className="App font-cursyger">
			<div className="gameboy-body">
				<div className="position-center w-[32rem] h-[26rem] rounded-outer bg-black" style={{left: "41%"}}></div>
				<div className="w-fit">
					{/* 상단 테두리 */}
					<div className="relative w-[42.6rem] h-[14rem] overflow-hidden top-[35.58rem] ml-[-8.4rem]">
						<div className="absolute bg-frame w-full h-full top-[91%] z-20" style={{borderRadius: "60%"}}></div>
					</div>
					<div className="relative w-[27rem] h-[19rem] overflow-hidden top-[18.2rem] ml-[-0.6rem]">
						<div className="absolute bg-frame w-full h-full top-[91%]" style={{borderRadius: "8%"}}></div>
					</div>
					{/* 오른쪽 테두리 */}
					<div className="relative w-[3rem] h-[19rem] overflow-hidden left-[24.7rem] top-[17.4rem] [transform:rotateY(180deg)]">
						<div className="absolute bg-frame w-[3rem] h-full right-0" style={{borderTopLeftRadius: "60% 100%", borderBottomLeftRadius: "40% 10%"}}></div>
					</div>
					{/* 화면 영역 */}
					<div className="bg-frame p-spacing-8 w-fit">
						<div className="w-96 h-64">
							{/* <PlaylistProvider initialTitle="My Playlist">
                <MusicPlayer />
              </PlaylistProvider> */}
						</div>
					</div>
					{/* 왼쪽 테두리 */}
					<div className="relative w-[3rem] h-[19rem] overflow-hidden right-[1.8rem] bottom-[19.4rem]">
						<div className="absolute bg-frame w-[3rem] h-full right-0" style={{borderTopLeftRadius: "60% 100%", borderBottomLeftRadius: "40% 10%"}}></div>
					</div>
					{/* 하단 테두리 */}
					<div className="relative w-[29.3rem] h-[25rem] overflow-hidden bottom-[20.2rem] ml-[-1.67rem] [transform:rotateX(180deg)]">
						<div className="absolute bg-frame w-full h-full top-[91%] z-20" style={{borderRadius: "10%"}}></div>
					</div>
					<div className="relative w-[39.2rem] h-[18rem] overflow-hidden bottom-[43.08rem] ml-[-6.7rem] scale-y-[-1]">
						<div className="absolute bg-frame w-full h-full top-[91%] z-20" style={{borderRadius: "45%"}}></div>
					</div>
				</div>
			</div>
		</div>
	);
}
