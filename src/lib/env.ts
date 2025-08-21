// Environment variable validation
const required = ["VITE_GEMINI_API_KEY", "VITE_API_URL"] as const;

// Validate required environment variables at boot
required.forEach((key) => {
  if (!import.meta.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

export const ENV = {
  GEMINI: import.meta.env.VITE_GEMINI_API_KEY!,
  API: import.meta.env.VITE_API_URL!,
} as const;
