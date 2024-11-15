import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
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
			},
			fontFamily: {
				cursyger: ["Cursyger", "sans-serif"],
			},
			fontSize: {
				xxs: ["1.1rem", "1.6rem"],
				xs: ["1.2rem", "2.08rem"],
				s: ["1.3rem", "2.24rem"],
				m: ["1.4rem", "2.56rem"],
				lg: ["1.6rem", "2.7rem"],
				xl: ["1.8rem", "3rem"],
				xxl: ["2rem", "3rem"],
			},
			backgroundColor: {
				"gray-2": "#A8A8A8",
				"gray-3": "#615E61",
				"gray-4": "#696969",
				body: "#46518a",
				"body-shadow": "#2e3d6e",
				"body-light": "#9698be",
				button: "#b8bcc2",
				"button-light": "#cbd0d2",
				frame: "#242b29",
				"frame-shadow": "#030b08",
			},
      borderRadius: {
        "outer": "5rem",
      }
		},
	},
	variants: {
		extend: {},
	},
	plugins: [],
} satisfies Config;
