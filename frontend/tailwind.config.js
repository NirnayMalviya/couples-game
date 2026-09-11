/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FBF5F1",
        blush: "#F6DCD8",
        rose: {
          DEFAULT: "#E4557A",
          dark: "#C43F63",
          light: "#F3A6BC",
        },
        plum: {
          DEFAULT: "#3D1735",
          light: "#5C2A52",
        },
        lavender: {
          DEFAULT: "#B79CE0",
          light: "#DACBF0",
        },
        mint: "#5CB88A",
        coral: "#E1576B",
      },
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["Manrope", "sans-serif"],
      },
      boxShadow: {
        soft: "0 12px 30px -10px rgba(61, 23, 53, 0.25)",
        card: "0 2px 0 rgba(61, 23, 53, 0.08), 0 14px 24px -12px rgba(61, 23, 53, 0.28)",
      },
      backgroundImage: {
        "grain-fade": "radial-gradient(circle at 20% 20%, rgba(228,85,122,0.10), transparent 55%), radial-gradient(circle at 85% 10%, rgba(183,156,224,0.14), transparent 50%)",
      },
    },
  },
  plugins: [],
};
