import { loginStore } from "@/stores/login-store";
import { messageStore } from "@/stores/message-store";
import { savedChatsStore } from "@/stores/savedChats-store";
import { uiStateStore } from "@/stores/uiState-store";
import { usernameStore } from "@/stores/user-store";
import React, { useEffect } from "react";

interface SavedChatsProps {
  onSavedChatOpen?: (connectionId: string, socket: WebSocket | null) => void;
}

export default function SavedChats({ onSavedChatOpen }: SavedChatsProps) {
  const savedChats = savedChatsStore((state) => state.savedChats);
  const isLoggedIn = loginStore((state) => state.isLoggedIn);
  const setSavedChats = savedChatsStore((state) => state.setSavedChats);
  const setMessages = messageStore((state) => state.setMessages);
  const setUiState = uiStateStore((state) => state.setUiState);
  const username = usernameStore((state) => state.username);

  async function openSavedChat(connectionId: string) {
    if (connectionId.trim().length === 0) return;

    const access_token = localStorage.getItem("access_token");
    if (!access_token) return;

    // Switch UI to saved chat view
    setUiState("saved_chat");

    // 1) Fetch existing messages for this saved chat
    const queryParams = new URLSearchParams({
      connection_id: connectionId,
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
      const cleanedMessages = rawMessages.map((msg: any) => ({
        type: "chat",
        contents: msg.contents,
        // format like live chat: show my own messages as "you"
        sender: msg.sender_username === username ? "you" : msg.sender_username,
        time_stamp: new Date(msg.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));
      // Replace the current messages with this saved chat
      setMessages(cleanedMessages);
      console.log(cleanedMessages);
    }

    // 2) Open websocket for realtime saved-chat messaging
    try {
      const socket = new WebSocket(
        `ws://localhost:8000/ws?username=${encodeURIComponent(
          username
        )}&mode=saved&connection_id=${encodeURIComponent(
          connectionId
        )}&token=${encodeURIComponent(access_token)}`
      );

      socket.onopen = () => {
        onSavedChatOpen?.(connectionId, socket);
      };

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("saved chat ws message", data);

        if (data.type === "chat" && data.data?.message) {
          setMessages({
            type: "chat",
            contents: data.data.message,
            sender: data.data.sender,
            time_stamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          });
        }
      };

      socket.onclose = () => {
        onSavedChatOpen?.(connectionId, null);
      };

      socket.onerror = () => {
        socket.close();
      };
    } catch (err) {
      console.error("failed to open saved chat websocket", err);
    }
  }

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
              onClick={() => {
                openSavedChat(chat.connection_id);
              }}
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
