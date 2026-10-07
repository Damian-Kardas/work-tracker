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
        "ink-muted-80": "#333333",
        "ink-muted-48": "#7a7a7a",
        "body-muted": "#cccccc",
        "divider-soft": "#f0f0f0",
        hairline: "#e0e0e0",
        canvas: "#ffffff",
        parchment: "#f5f5f7",
        pearl: "#fafafc",
        "tile-1": "#272729",
        "tile-2": "#2a2a2c",
        "tile-3": "#252527",
        void: "#000000",
        "chip-translucent": "#d2d2d7",
        danger: "#ff3b30",
      },
      fontFamily: {
        display: [
          "-apple-system",
          "BlinkMacSystemFont",
          "'SF Pro Display'",
          "Inter",
          "system-ui",
          "sans-serif",
        ],
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "'SF Pro Text'",
          "Inter",
          "system-ui",
          "sans-serif",
        ],
      },
      borderRadius: {
        none: "0px",
        xs: "5px",
        sm: "8px",
        md: "11px",
        lg: "18px",
        pill: "9999px",
      },
      boxShadow: {
        product: "3px 5px 30px 0px rgba(0, 0, 0, 0.22)",
      },
      spacing: {
        18: "4.5rem",
      },
    },
  },
  plugins: [],
};
export default config;
