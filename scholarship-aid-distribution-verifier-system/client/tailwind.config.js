/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      colors: {
        academic: {
          navy: "#12355b",
          ink: "#172033",
          paper: "#f7f9fc",
          line: "#d8e1ec"
        }
      }
    }
  },
  plugins: []
};
