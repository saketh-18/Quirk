import { create } from "zustand"

type UIState = "form" | "searching" | "found" | "chatting" | "got_skipped" | "saved_chat"


interface uiStateFormat {
    uiState : "form" | UIState
    setUiState : (arg : UIState) => void
}

export const uiStateStore = create<uiStateFormat>()((set) => ({
    uiState : "form",
    setUiState : (uiState) => set({uiState}) 
}));
