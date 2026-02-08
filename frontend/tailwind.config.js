/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Custom Pong theme colors
        pong: {
          dark: "#0a0a0f",
          light: "#e0e0e0",
          accent: "#00ff88",
          warning: "#ff6b35",
        },
      },
    },
  },
  plugins: [],
};
