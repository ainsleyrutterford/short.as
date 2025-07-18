import type { Config } from "tailwindcss";

const config = {
  // Disables hover styling on iOS after a button is tapped
  // https://github.com/tailwindlabs/tailwindcss/discussions/1739#discussioncomment-3630717
  future: {
    hoverOnlyWhenSupported: true,
  },
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border)/<alpha-value>)",
        input: "hsl(var(--input)/<alpha-value>)",
        ring: "hsl(var(--ring)/<alpha-value>)",
        background: "hsl(var(--background)/<alpha-value>)",
        foreground: "hsl(var(--foreground)/<alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--primary)/<alpha-value>)",
          foreground: "hsl(var(--primary-foreground)/<alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary)/<alpha-value>)",
          foreground: "hsl(var(--secondary-foreground)/<alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive)/<alpha-value>)",
          foreground: "hsl(var(--destructive-foreground)/<alpha-value>)",
        },
        success: {
          DEFAULT: "hsl(var(--success)/<alpha-value>)",
          foreground: "hsl(var(--success-foreground)/<alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted)/<alpha-value>)",
          foreground: "hsl(var(--muted-foreground)/<alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent)/<alpha-value>)",
          foreground: "hsl(var(--accent-foreground)/<alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover)/<alpha-value>)",
          foreground: "hsl(var(--popover-foreground)/<alpha-value>)",
        },
        card: {
          DEFAULT: "hsl(var(--card)/<alpha-value>)",
          foreground: "hsl(var(--card-foreground)/<alpha-value>)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        gradient: {
          to: { "background-position": "200% center" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        gradient: "gradient 5s linear infinite",
        "fade-in": "fade-in 0.3s ease-in-out",
        "fade-in-slow": "fade-in 1.5s ease-in-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
