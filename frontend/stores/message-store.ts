import { create } from "zustand"

interface Message {
    type : string,
    contents : string,
    sender : string,
    time_stamp : string
}

interface MessageStoreState {
    messages : Message[],
    setMessages : (arg : Message | Message[]) => void
}

export const messageStore = create<MessageStoreState>()((set) => ({
    messages : [],
    setMessages : (messageOrMessages) =>
        set((state) => {
            // If we receive an array (e.g. loading a saved chat), replace the list
            if (Array.isArray(messageOrMessages)) {
                return { messages: messageOrMessages };
            }
            // Otherwise, append a single incoming message (live chat)
            return { messages: [...state.messages, messageOrMessages] };
        }),
}))