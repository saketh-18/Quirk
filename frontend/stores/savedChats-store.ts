import { create } from "zustand"

interface savedChatState {
    connection_id : string,
    username : string
}

interface savedChatsStoreState {
    savedChats : savedChatState[],
    setSavedChats : (arg : savedChatState[]) => void
}
export const savedChatsStore = create<savedChatsStoreState>()((set) => ({
    savedChats : [],
    setSavedChats : (savedChats) => set({savedChats})
}));

