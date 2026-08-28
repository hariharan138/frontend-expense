import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // These are public API origins, not credentials. Vite only exposes these two
  // additional environment variables to the browser bundle.
  envPrefix: ["VITE_", "PRIMARY_API_URL", "SECONDARY_API_URL"],
  plugins: [react()],
});
