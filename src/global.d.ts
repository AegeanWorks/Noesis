import type { AiApi } from "./engine/ai";

declare global {
  interface Window {
    __NOESIS__?: AiApi;
  }
}

export {};
