import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FDF6EC',
          100: '#F9E8D0',
          200: '#F4D1A1',
          300: '#E8B266',
          400: '#D4A574',
          500: '#C89A5D',
          600: '#B37F43',
          700: '#8F6538',
          800: '#755332',
          900: '#60442C',
        },
        navy: {
          50: '#E8EDF3',
          100: '#D1DBE7',
          200: '#A3B7CF',
          300: '#7593B7',
          400: '#476F9F',
          500: '#1E3A5F',
          600: '#1A3352',
          700: '#152844',
          800: '#101E37',
          900: '#0C1429',
        },
        teal: {
          50: '#E6F7F7',
          100: '#CCEFEF',
          200: '#99DFDF',
          300: '#66CFCF',
          400: '#4DB8B8',
          500: '#3DA3A3',
          600: '#318383',
          700: '#256262',
          800: '#194242',
          900: '#0C2121',
        },
      },
    },
  },
  plugins: [],
};

export default config;
