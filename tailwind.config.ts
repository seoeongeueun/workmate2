import type {Config} from "tailwindcss";

const config: Config = {
	content: ["./pages/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}", "./app/**/*.{js,ts,jsx,tsx,mdx}"],
	theme: {
		extend: {
			spacing: {
				"spacing-2": "0.2rem",
				"spacing-3": "0.3rem",
				"spacing-4": "0.4rem",
				"spacing-5": "0.5rem",
				"spacing-6": "0.6rem",
				"spacing-8": "0.8rem",
				"spacing-10": "1rem",
				"spacing-12": "1.2rem",
				"spacing-13": "1.3rem",
				"spacing-14": "1.4rem",
				"spacing-16": "1.6rem",
				"spacing-18": "1.8rem",
				"spacing-20": "2rem",
				"spacing-24": "2.4rem",
				"spacing-28": "2.8rem",
				"spacing-29": "2.9rem",
				"spacing-32": "3.2rem",
				"spacing-36": "3.6rem",
				"spacing-40": "4rem",
				"screen-w": "32rem",
			},
			fontFamily: {
				cursyger: ["Cursyger", "sans-serif"],
				galmuri: ["Galmuri9", "sans-serif"],
				dunggeunmo: ["DungGeunMo", "sans-serif"],
			},
			fontSize: {
				xxxs: ["1rem", "1.2rem"],
				xxs: ["1.1rem", "1.6rem"],
				xs: ["1.2rem", "2.08rem"],
				s: ["1.3rem", "2.24rem"],
				m: ["1.4rem", "2.56rem"],
				lg: ["1.6rem", "2.7rem"],
				xl: ["1.8rem", "3rem"],
				xxl: ["2rem", "3rem"],
			},
			backgroundColor: {
				"gray-1": "#d3d3d3",
				"gray-2": "#A8A8A8",
				"gray-3": "#615E61",
				"gray-4": "#696969",
				body: "var(--body)",
				"body-shadow": "var(--body-shadow)",
				"body-light": "var(--body-light)",
				button: "#b8bcc2",
				"button-light": "#cbd0d2",
				frame: "#242b29",
				"frame-shadow": "#030b08",
			},
			backgroundImage: {
				"off-screen": "linear-gradient(130deg, #858383, #3f3c3c)",
			},
			keyframes: {
				fadeIn: {
					"0%": {opacity: "0%"},
					"100%": {opacity: "100%"},
				},
				flicker: {
					"0%, 30%, 50%, 100%": {opacity: "1"},
					"10%, 25%, 90%": {opacity: "0.8"},
				},
				blink: {
					"0%, 50%": {opacity: "100%"},
					"50.01%, 100%": {opacity: "0%"},
				},
				typing: {
					"0%": {clipPath: "inset(0 100% 0 0)"},
					"100%": {clipPath: "inset(0 0 0 0)"},
				},
			},
			animation: {
				fadeIn: "fadeIn 2s ease-in-out",
				bounceSlow: "bounce 3s ease-in-out infinite 0.3s",
				wobble: "wobble 5s ease-in-out infinite",
				slide: "slide 3s ease-in-out",
				flicker: "flicker 3s ease-in-out infinite",
				blink: "blink 1.2s linear infinite",
				typing: "typing 2s steps(28, end) forwards",
			},
		},
	},
	plugins: [],
};

export default config;
