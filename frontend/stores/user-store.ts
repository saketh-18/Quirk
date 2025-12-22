import { create } from "zustand"

interface usernameState {
    username : string,
    setUsername : (arg : string) => void
}

export const usernameStore = create<usernameState>()((set) => ({
    username : "",
    setUsername : (username : string) => set({username})
}))