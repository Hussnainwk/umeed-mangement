/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./context/**/*.{js,ts,jsx,tsx,mdx}",
    "./data/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          ice: "#DDE3E8",
          "ice-dark": "#c2cbd3",
          "ice-light": "#f4f7f9",
          aubergine: "#3A0F34",
          "aubergine-dark": "#23081f",
          "aubergine-light": "#54194c",
          "aubergine-deep": "#190617",
          marigold: "#EAAA00",
          "marigold-hover": "#d49a00",
          "marigold-light": "#fff4d4",
          "marigold-dark": "#b88500",
        },
        dark: {
          bg: "#150917",
          surface: "#1f0f22",
          "surface-raised": "#29142e",
          "surface-inset": "#170a19",
          border: "#3d1e44",
          text: "#f5f0f6",
          "text-muted": "#bdaec2",
        },
      },
      boxShadow: {
        // Light neumorphic shadows
        "neu-flat": "6px 6px 14px #b8bec5, -6px -6px 14px #ffffff",
        "neu-raised": "9px 9px 20px #b2b9c0, -9px -9px 20px #ffffff",
        "neu-sm": "3px 3px 8px #bcc3ca, -3px -3px 8px #ffffff",
        "neu-inset": "inset 3px 3px 6px #b8bec5, inset -3px -3px 6px #ffffff",
        "neu-inset-sm": "inset 2px 2px 4px #bcc3ca, inset -2px -2px 4px #ffffff",
        "neu-marigold": "4px 4px 12px rgba(234, 170, 0, 0.35), -2px -2px 8px rgba(255, 255, 255, 0.8)",

        // Dark neumorphic shadows
        "neu-dark-flat": "6px 6px 14px #0c040d, -6px -6px 14px #2b142f",
        "neu-dark-raised": "9px 9px 20px #09030a, -9px -9px 20px #34193a",
        "neu-dark-sm": "3px 3px 8px #0d050e, -3px -3px 8px #2d1632",
        "neu-dark-inset": "inset 3px 3px 6px #09030a, inset -3px -3px 6px #2d1632",
        "neu-dark-inset-sm": "inset 2px 2px 4px #0b040c, inset -2px -2px 4px #27132a",
        "neu-dark-marigold": "0px 4px 16px rgba(234, 170, 0, 0.3)",
      },
      fontFamily: {
        manrope: ["var(--font-manrope)", "sans-serif"],
        montserrat: ["var(--font-montserrat)", "sans-serif"],
        inter: ["var(--font-inter)", "sans-serif"],
        plusjakarta: ["var(--font-plus-jakarta)", "sans-serif"],
        dmsans: ["var(--font-dm-sans)", "sans-serif"],
        playfair: ["var(--font-playfair)", "serif"],
        cormorant: ["var(--font-cormorant)", "serif"],
        bebas: ["var(--font-bebas-neue)", "sans-serif"],
        oswald: ["var(--font-oswald)", "sans-serif"],
        lora: ["var(--font-lora)", "serif"],
      },
    },
  },
  plugins: [],
};
