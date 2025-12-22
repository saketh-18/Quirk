import { create } from "zustand"

interface Message {
    type : string,
    contents : string,
    sender : string,
    time_stamp : string
}

interface MessageStoreState {
    messages : Message[],
    setMessages : (arg : Message) => void
}

export const messageStore = create<MessageStoreState>()((set) => ({
    messages : [],
    setMessages : (message) => set((state) => ({ messages : [...state.messages, message]}))
}))