import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "ai.noesis.app",
  appName: "Noesis",
  webDir: "dist",
  android: {
    allowMixedContent: false,
  },
};

export default config;
