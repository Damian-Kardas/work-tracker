import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#0066cc",
        "primary-focus": "#0071e3",
        "primary-on-dark": "#2997ff",
        ink: "#1d1d1f",
        body: "#1d1d1f",
        "body-on-dark": "#ffffff",
        canvas: "#ffffff",
        "canvas-parchment": "#f5f5f7",
        "surface-pearl": "#fafafc",
        "surface-tile-1": "#272729",
        "surface-tile-2": "#2a2a2c",
        "surface-tile-3": "#252527",
        "surface-black": "#000000",
        hairline: "#e0e0e0",
      },
      borderRadius: {
        pill: "9999px",
      },
      boxShadow: {
        product: "3px 5px 30px 0px rgba(0, 0, 0, 0.22)",
      },
    },
  },
  plugins: [],
};
export default config;
