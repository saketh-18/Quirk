import { loginStore } from "@/stores/login-store";
import { messageStore } from "@/stores/message-store";
import { savedChatsStore } from "@/stores/savedChats-store";
import { uiStateStore } from "@/stores/uiState-store";
import React, { useEffect, useState } from "react";

export default function SavedChats() {
  const savedChats = savedChatsStore((state) => state.savedChats);
  const isLoggedIn = loginStore((state) => state.isLoggedIn);
  const setSavedChats = savedChatsStore((state) => state.setSavedChats);
  const [connId, setConnId] = useState("");
  const setMessages =  messageStore((state) => state.setMessages)
  const setUiState = uiStateStore((state) => state.setUiState);

  useEffect(() => {
    async function getMessages(connId: string) {
      if (connId.trim().length == 0) return;
      const access_token = localStorage.getItem("access_token");
      if (access_token?.length == 0) return;
      const queryParams = new URLSearchParams({
        connection_id: connId,
      });
      const res = await fetch(`http://localhost:8000/messages?${queryParams}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
      if (res.ok) {
        const rawMessages = await res.json();
        console.log(rawMessages);
        const cleanedMessages = rawMessages.map((msg) => ({
          type: "chat",
          contents: msg.contents,
          sender: msg.sender_username,
          time_stamp: new Date(msg.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }));
        setMessages(cleanedMessages);
        setUiState("chatting");
      }
    }



    getMessages(connId);
  }, [connId]);

  useEffect(() => {
    async function fetchChats() {
      // we need access_token to fetch saved_chats
      const access_token = localStorage.getItem("access_token");
      const res = await fetch("http://localhost:8000/connections", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setSavedChats(data);
      }
    }
    fetchChats();
  }, [isLoggedIn]);

  return (
    <aside className="hidden lg:flex w-80 flex-col border-r border-border-dark bg-bg-dark/60 backdrop-blur-md p-6">
      <p className="mb-4 text-xs uppercase tracking-wider text-text-main/40">
        Saved chats
      </p>

      {!isLoggedIn && <p>Login to view Saved Chats</p>}

      {isLoggedIn && savedChats.length === 0 && <p>No saved Chats to show</p>}

      {isLoggedIn && savedChats.length > 0 && (
        <div className="space-y-3 overflow-y-auto">
          {savedChats.map((chat, ind) => (
            <div
              key={ind}
              onClick={() => setConnId(chat.connection_id)}
              className="rounded-lg border border-border-dark p-3 hover:bg-surface-highlight transition cursor-pointer"
            >
              <p className="text-sm text-text-main">{chat.username}</p>
              {/* <p className="mt-1 text-xs text-text-main/40 truncate">
                  {chat.connection_id}
                </p> */}
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}

// No nested curly braces
