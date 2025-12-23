/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import ChatBox from "@/src/components/ChatBox";
import Form from "@/src/components/form";
import LoadingScreen from "@/src/components/LoadingScreen";
import Navbar from "@/src/components/Navbar";
import PartnerFound from "@/src/components/PartnerFound";
import PartnerSkipped from "@/src/components/PartnerSkipped";
import SavedChats from "@/src/components/savedChats";
import { messageStore } from "@/stores/message-store";
import { pairedStore } from "@/stores/paired-store";
import { uiStateStore } from "@/stores/uiState-store";
import { usernameStore } from "@/stores/user-store";
import React, { FormEvent, useEffect, useState } from "react";
import Swal from "sweetalert2";

export default function Page() {
  // const [messages, setMessages] = useState<Message[]>([]);
  const [currentMsg, setCurrentMsg] = useState("");
  const [ws, setWs] = useState<WebSocket | null>();
  const [savedWs, setSavedWs] = useState<WebSocket | null>(null);
  const [activeSavedConnectionId, setActiveSavedConnectionId] = useState<
    string | null
  >(null);

  // const [pairedTo, setPairedTo] = useState("");
  const pairedTo = pairedStore((state) => state.pairedTo);
  const setPairedTo = pairedStore((state) => state.setPairedTo);

  const username = usernameStore((state) => state.username);
  const uiState = uiStateStore((state) => state.uiState);
  const setUiState = uiStateStore((state) => state.setUiState);

  // const messages = messageStore((state) => state.messages);
  const setMessages = messageStore((state) => state.setMessages);

  useEffect(() => {
    if (uiState !== "searching") return;
    if (ws && ws.readyState === WebSocket.OPEN) return;

    const access_token =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;
    const tokenParam = access_token
      ? `&token=${encodeURIComponent(access_token)}`
      : "";

    const socket = new WebSocket(
      `ws://localhost:8000/ws?username=${encodeURIComponent(
        username
      )}&mode=random${tokenParam}`
    );

    socket.onopen = () => setWs(socket);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log(data);

      // legacy system wrapper
      if (data.system) {
        if (data.paired_to) {
          setPairedTo(data.paired_to);
          setUiState("found");
          setTimeout(() => setUiState("chatting"), 1000);
        }
      }

      if (data.type === "system") {
        const action = data.data?.action;

        // Partner got skipped
        if (action === "got_skipped") {
          setUiState("got_skipped");
        }

        // Incoming save request: prompt the user to accept/reject
        if (action === "save_request") {
          Swal.fire({
            title: "Save Chat?",
            text:
              data.data?.message || "Partner wants to save this chat. Accept?",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, accept!",
            cancelButtonText: "Decline",
            // Ensures the user can't accidentally close it by clicking outside
            allowOutsideClick: false,
          }).then((result) => {
            if (result.isConfirmed) {
              // Send save_accept back to server
              socket.send(
                JSON.stringify({
                  type: "system",
                  data: { action: "save_accept" },
                })
              );

              // Optional: Show a small success toast after accepting
              Swal.fire({
                title: "Accepted!",
                text: "The chat will be saved.",
                icon: "success",
                timer: 1500,
                showConfirmButton: false,
              });
            }
          });
        }

        // Show any system message text inside the chat stream
        if (data.data?.message) {
          setMessages({
            type: "system",
            contents: data.data.message,
            sender: "system",
            time_stamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          });
        }
      }

      if (data.type === "chat") {
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

    // return () =>
    //   {
    //     socket.close();
    //     setWs(null)
    //   }
  }, [uiState]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      prompt("do you want to skip the chat and refresh");
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  function saveChatHandler() {
    // Only makes sense in live random chat mode
    if (uiState !== "chatting") return;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const access_token =
      typeof window !== "undefined"
        ? localStorage.getItem("access_token")
        : null;
    if (!access_token) {
      // notify user to login to save chats
      setMessages({
        type: "system",
        contents: "You need to login to save chats",
        sender: "system",
        time_stamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      });
      return;
    }

    ws.send(
      JSON.stringify({
        type: "system",
        data: {
          action: "save_request",
        },
      })
    );
  }

  function sendMessage(e: FormEvent) {
    e.preventDefault();
    if (!currentMsg.trim()) return;

    if (uiState === "saved_chat") {
      if (
        !savedWs ||
        savedWs.readyState !== WebSocket.OPEN ||
        !activeSavedConnectionId
      ) {
        return;
      }

      savedWs.send(
        JSON.stringify({
          type: "chat",
          context: "saved",
          data: {
            connection_id: activeSavedConnectionId,
            message: currentMsg,
          },
        })
      );
    } else {
      ws?.send(
        JSON.stringify({
          type: "chat",
          data: {
            message: currentMsg,
          },
        })
      );
    }

    setMessages({
      type: "chat",
      contents: currentMsg,
      sender: "you",
      time_stamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    });

    setCurrentMsg("");
  }

  function skipHandler() {
    if (uiState === "chatting") {
      ws?.send(
        JSON.stringify({
          type: "system",
          data: {
            action: "skip",
          },
        })
      );
      setUiState("searching");
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-bg-dark">
      <Navbar />
      {/* ================= AMBIENT BACKGROUND ================= */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-bg-dark via-surface to-bg-dark" />

        {/* stronger, slower blobs */}
        <div className="absolute -top-48 left-1/4 h-[36rem] w-[36rem] rounded-full bg-accent/15 blur-[140px] animate-[floatSlow_30s_ease-in-out_infinite]" />
        <div className="absolute bottom-0 right-1/4 h-[32rem] w-[32rem] rounded-full bg-surface-highlight/30 blur-[160px] animate-[floatSlow_40s_ease-in-out_infinite]" />
        <div className="absolute top-1/3 right-10 h-56 w-56 rounded-full bg-accent/10 blur-[120px] animate-[floatSlow_26s_ease-in-out_infinite]" />
      </div>

      {/* ================= LAYOUT ================= */}
      <div className="relative z-10 mx-auto flex h-[calc(100vh-56px)] max-w-[1600px]">
        {/* ================= SAVED CHATS ================= */}
        <div className="flex flex-col justify-between border-r border-border-dark bg-bg-dark/60">
          <SavedChats
            onSavedChatOpen={(connectionId, socket) => {
              // Close previous saved websocket if we switch chats
              if (savedWs && savedWs !== socket) {
                savedWs.close();
              }
              setSavedWs(socket);
              setActiveSavedConnectionId(socket ? connectionId : null);
            }}
          />
          <div className="flex flex-col gap-2 mb-3 mx-2">
            {uiState === "chatting" && (
              <>
                {" "}
                <button
                  onClick={skipHandler}
                  className="rounded-full bg-surface-highlight p-4 shadow-sm hover:shadow-accent border-1 border-surface-highlight"
                >
                  Skip
                </button>
                <button
                  onClick={saveChatHandler}
                  className="rounded-full bg-surface-highlight p-4 shadow-sm hover:shadow-accent border-1 border-surface-highlight"
                >
                  Save Chat
                </button>
              </>
            )}
            {uiState === "saved_chat" && (
              <button
                onClick={() => {
                  // Leaving saved chat: close websocket and clear messages
                  if (savedWs) {
                    savedWs.close();
                    setSavedWs(null);
                    setActiveSavedConnectionId(null);
                  }
                  setMessages([]);
                  setUiState("form");
                }}
                className="rounded-full bg-surface-highlight p-4 shadow-sm hover:shadow-accent border-1 border-surface-highlight"
              >
                Random Chat
              </button>
            )}
          </div>
        </div>
        {/* ================= CHAT ROOM ================= */}
        {uiState === "searching" && <LoadingScreen />}
        {uiState === "form" && <Form />}
        {uiState === "found" && <PartnerFound />}
        {uiState === "got_skipped" && (
          <PartnerSkipped onStartNew={skipHandler} />
        )}
        {(uiState === "chatting" || uiState === "saved_chat") && (
          <ChatBox
            pairedTo={pairedTo}
            sendMessage={sendMessage}
            currentMsg={currentMsg}
            setCurrentMsg={setCurrentMsg}
          />
        )}
      </div>
    </main>
  );
}
