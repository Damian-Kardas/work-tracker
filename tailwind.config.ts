import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#14171B",
          900: "#1C2126",
          800: "#262B32",
          700: "#323942",
          600: "#454E59",
        },
        paper: {
          100: "#EDEEF0",
          300: "#C7CBD1",
          500: "#8B92A0",
        },
        amber: {
          400: "#F0B658",
          500: "#E8A33D",
          600: "#C6822A",
        },
        moss: {
          400: "#7BBBA1",
          500: "#5FA88F",
          600: "#478E77",
        },
        brick: {
          400: "#D07C6E",
          500: "#C1594B",
          600: "#A5453A",
        },
      },
      fontFamily: {
        mono: ["'IBM Plex Mono'", "ui-monospace", "SFMono-Regular", "monospace"],
        sans: ["'IBM Plex Sans'", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "10px",
      },
    },
  },
  plugins: [],
};

export default config;
