import { create } from "zustand"

interface InterestState {
    interests: string;
    setInterests: (interests: string) => void;
}

export const InterestStore = create<InterestState>()((set) => ({
    interests: "",
    setInterests: (interests) => set({ interests }),
}));
