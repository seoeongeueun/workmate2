import {createContext, useState, useContext, ReactNode} from "react";

type ButtonValue = "a" | "b" | "up" | "down" | "left" | "right" | "select" | "power";

interface ButtonContextType {
	prev: ButtonValue | undefined;
	setPrev: (value: ButtonValue | undefined) => void;
	current: ButtonValue | undefined;
	setCurrent: (value: ButtonValue | undefined) => void;
}

const ButtonContext = createContext<ButtonContextType | undefined>(undefined);

export const ButtonProvider: React.FC<{children: ReactNode}> = ({children}) => {
	const [prev, setPrev] = useState<ButtonValue | undefined>(undefined);
	const [current, setCurrent] = useState<ButtonValue | undefined>(undefined);

	return <ButtonContext.Provider value={{prev, setPrev, current, setCurrent}}>{children}</ButtonProvider.Provider>;
};

export const useButtonContext = () => {
    const context = useContext(ButtonContext);
    if (!context) {
        throw new Error("useButtonContext not available");
    }
    return context;
};

export default ButtonContext;
