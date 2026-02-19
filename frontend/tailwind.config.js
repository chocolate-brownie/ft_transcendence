/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // === Base Palette ===
        "lime-moss": {
          50: "#f4f9ec",
          100: "#e9f2d9",
          200: "#d4e6b3",
          300: "#bed98c",
          400: "#a8cc66",
          500: "#93bf40",
          600: "#759933",
          700: "#587326",
          800: "#3b4d19",
          900: "#1d260d",
          950: "#151b09",
        },
        "carrot-orange": {
          50: "#fdf3e7",
          100: "#fce8cf",
          200: "#f9d09f",
          300: "#f6b96f",
          400: "#f3a23f",
          500: "#f08b0f",
          600: "#c06f0c",
          700: "#905309",
          800: "#603706",
          900: "#301c03",
          950: "#221302",
        },
        "shadow-grey": {
          50: "#f2f2f3",
          100: "#e6e5e6",
          200: "#cccace",
          300: "#b3b0b5",
          400: "#99969c",
          500: "#807c83",
          600: "#666369",
          700: "#4d4a4f",
          800: "#333135",
          900: "#1a191a",
          950: "#121112",
        },

        // === Semantic Theme ===
        pong: {
          background: "#ffffff",   // pure white — page background
          surface:    "#f2f2f3",   // shadow-grey-50 — cards / panels
          text:       "#333135",   // shadow-grey-800 — primary text
          accent:     "#f08b0f",   // carrot-orange-500 — buttons / highlights
          accentDark: "#c06f0c",   // carrot-orange-600 — hover state
          secondary:  "#759933",   // lime-moss-600 — secondary actions
        },
      },
    },
  },
  plugins: [],
};
