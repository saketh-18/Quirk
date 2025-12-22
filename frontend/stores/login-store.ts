import { create } from "zustand"

interface loginState {
    isLoggedIn : boolean,
    setIsLoggedIn : (arg1 : boolean) => void
}

export const loginStore = create<loginState>()((set) => ({
    isLoggedIn : false,
    setIsLoggedIn : (isLoggedIn) => set({isLoggedIn}),
}));


