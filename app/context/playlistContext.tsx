import {createContext, useState, useContext, ReactNode} from "react";
import Playlist from "../classes/Playlist";

interface PlaylistContextType {
	playlist: Playlist;
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);

export const PlaylistProvider: React.FC<{children: ReactNode; initialTitle: string}> = ({children, initialTitle}) => {
	const [playlist] = useState(new Playlist(initialTitle));

	return <PlaylistContext.Provider value={{playlist}}>{children}</PlaylistContext.Provider>;
};

export const usePlaylistContext = () => {
	const context = useContext(PlaylistContext);
	if (!context) {
		throw new Error("usePlaylistContext not available");
	}
	return context;
};

export default PlaylistContext;
