import { create } from "zustand";

interface ConnectionStoreState {
  randomWs: WebSocket | null;
  setRandomWs: (ws: WebSocket | null) => void;
  skipRandom: () => void;
}

export const connectionStore = create<ConnectionStoreState>()((set, get) => ({
  randomWs: null,
  setRandomWs: (ws) => set({ randomWs: ws }),
  skipRandom: () => {
    try {
      const sock = get().randomWs;
      if (sock && sock.readyState === WebSocket.OPEN) {
        sock.send(JSON.stringify({ type: "system", data: { action: "skip" } }));
        try {
          sock.close();
        } catch {}
      }
    } catch (e) {
      console.warn("skipRandom error", e);
    }
    set({ randomWs: null });
  },
}));
