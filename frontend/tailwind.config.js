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
        glow: "0 0 0 1px rgba(228,85,122,0.25), 0 10px 30px -8px rgba(228,85,122,0.45)",
        "glow-lg": "0 0 0 1px rgba(228,85,122,0.3), 0 18px 45px -10px rgba(228,85,122,0.55)",
        "glow-mint": "0 0 0 1px rgba(92,184,138,0.3), 0 10px 26px -8px rgba(92,184,138,0.5)",
        "glow-coral": "0 0 0 1px rgba(225,87,107,0.3), 0 10px 26px -8px rgba(225,87,107,0.5)",
      },
      backgroundImage: {
        "grain-fade": "radial-gradient(circle at 20% 20%, rgba(228,85,122,0.10), transparent 55%), radial-gradient(circle at 85% 10%, rgba(183,156,224,0.14), transparent 50%)",
        "shimmer": "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.55) 50%, transparent 70%)",
      },
      keyframes: {
        floaty: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-14px) rotate(4deg)" },
        },
        "floaty-slow": {
          "0%, 100%": { transform: "translateY(0px) translateX(0px)" },
          "50%": { transform: "translateY(-20px) translateX(8px)" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(228,85,122,0.45)" },
          "70%": { boxShadow: "0 0 0 12px rgba(228,85,122,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(228,85,122,0)" },
        },
        heartbeat: {
          "0%, 100%": { transform: "scale(1)" },
          "25%": { transform: "scale(1.18)" },
          "40%": { transform: "scale(1)" },
          "60%": { transform: "scale(1.1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "blob-spin": {
          "0%, 100%": { borderRadius: "42% 58% 65% 35% / 45% 40% 60% 55%", transform: "rotate(0deg) scale(1)" },
          "50%": { borderRadius: "60% 40% 30% 70% / 55% 65% 35% 45%", transform: "rotate(8deg) scale(1.05)" },
        },
      },
      animation: {
        floaty: "floaty 6s ease-in-out infinite",
        "floaty-slow": "floaty-slow 9s ease-in-out infinite",
        "pulse-ring": "pulse-ring 1.8s cubic-bezier(0.4,0,0.6,1) infinite",
        heartbeat: "heartbeat 1.6s ease-in-out infinite",
        shimmer: "shimmer 2.4s linear infinite",
        "blob-spin": "blob-spin 12s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
