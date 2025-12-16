import { create } from "zustand";

interface userState {
    username : string,
    setUsername : (arg : string) => void,
}

export const usernameStore = create<userState>()((set) => ({
    username : "",
    setUsername : (newUsername :string) => set({username : newUsername})
}))

