import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // This is a public API origin, not a credential. Vite only exposes this
  // additional environment variable to the browser bundle.
  envPrefix: ["VITE_", "API_URL"],
  plugins: [react()],
});
