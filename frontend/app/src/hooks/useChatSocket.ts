import { useState, useEffect, useCallback, useRef } from "react";
import { Alert } from "../utils/alert";
import { messageStore } from "@/stores/message-store";
import { uiStateStore } from "@/stores/uiState-store";
import { pairedStore } from "@/stores/paired-store";
import { loginStore } from "@/stores/login-store";
import { connectionStore } from "@/stores/connection-store";

export const useChatSocket = (username: string, interests: string) => {
  const [randomWs, setRandomWs] = useState<WebSocket | null>(null);
  const [savedWs, setSavedWsState] = useState<WebSocket | null>(null);
  const [activeSavedId, setActiveSavedId] = useState<string | null>(null);

  // Refs to hold latest socket instances so callbacks don't create new effects
  const randomWsRef = useRef<WebSocket | null>(null);
  const savedWsRef = useRef<WebSocket | null>(null);

  const setMessages = messageStore((state) => state.setMessages);
  const setUiState = uiStateStore((state) => state.setUiState);
  const uiState = uiStateStore((state) => state.uiState);
  const setPairedTo = pairedStore((state) => state.setPairedTo);
  const isLoggedIn = loginStore((state) => state.isLoggedIn);

  // Helper to format timestamps
  const getTime = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // Handle incoming messages for BOTH types of sockets
  const handleMessage = useCallback(
    (event: MessageEvent, isSavedMode: boolean) => {
      const raw = JSON.parse(event.data);

      // Normalize shapes: some server messages use top-level `system` (legacy),
      // others use { type: 'system', data: {...} } or { type: 'chat', data: {...} }
      const dataType = raw.type ?? (raw.system ? "system" : undefined);
      const payload = raw.data ?? {};

      // 1. Random match notification (legacy shape uses top-level `system` + `paired_to`)
      if (raw.system && raw.paired_to) {
        setPairedTo(raw.paired_to);
        setUiState("found");
        setTimeout(() => setUiState("chatting"), 1000);
        return;
      }

      // 2. System actions (support both { type: 'system', data: {...} } and legacy shapes)
      if (dataType === "system") {
        const action = payload.action;
        if (action === "got_skipped") {
          setUiState("got_skipped");
          return;
        }

        // Ignore server heartbeat/waiting messages from matching flow
        const systemMsgCandidate = payload.message ?? raw.system ?? "";
        if (
          typeof systemMsgCandidate === "string" &&
          systemMsgCandidate.toLowerCase().includes("waiting for a partner")
        ) {
          return;
        }

        if (action === "save_request") {
          Alert.fire({
            title: "Save this conversation?",
            text:
              payload.message ||
              "The other person would like to save this chat.",
            showCancelButton: true,
            confirmButtonText: "Accept",
          }).then((result) => {
            if (result.isConfirmed) {
              const sock = randomWsRef.current;
              if (sock && sock.readyState === WebSocket.OPEN) {
                sock.send(
                  JSON.stringify({
                    type: "system",
                    data: { action: "save_accept" },
                  })
                );
              }
            }
          });
          return;
        }

        // Generic system message text
        const systemMsg = payload.message ?? raw.system;
        if (systemMsg) {
          setMessages({
            type: "system",
            contents: systemMsg,
            sender: "system",
            time_stamp: getTime(),
          });
        }
        return;
      }

      // 3. Chat messages (support both top-level sender and nested sender)
      if (dataType === "chat") {
        const messageText = payload.message ?? raw.message ?? payload.contents;
        const sender = payload.sender ?? raw.sender ?? "unknown";
        if (messageText) {
          setMessages({
            type: "chat",
            contents: messageText,
            sender,
            time_stamp: getTime(),
          });
        }
        return;
      }
    },
    [setMessages, setPairedTo, setUiState]
  );

  // Connect to Random Chat
  useEffect(() => {
    if (uiState !== "searching") return;

    // Prevent creating multiple sockets if one already exists
    if (randomWsRef.current) return;

    const access_token = localStorage.getItem("access_token");
    const hasToken = Boolean(access_token && username);

    const tokenParam =
      isLoggedIn && hasToken
        ? `&token=${encodeURIComponent(access_token as string)}`
        : "";

    const socket = new WebSocket(
      `wss://echo-l8ml.onrender.com/ws?username=${encodeURIComponent(
        username
      )}&mode=random${tokenParam}&interests=${encodeURIComponent(interests)}`
    );

    socket.onopen = () => {
      randomWsRef.current = socket;
      setRandomWs(socket);
      // Clear messages when a fresh random connection opens
      setMessages([]);
      // expose to global connection store so other UI (Navbar) can skip on navigation
      connectionStore.getState().setRandomWs(socket);
    };
    socket.onmessage = (e) => handleMessage(e, false);
    socket.onerror = (err) => {
      // keep error visible in dev console

      console.error("Random WS error:", err);
    };
    socket.onclose = () => {
      // clear both ref and state
      if (randomWsRef.current === socket) randomWsRef.current = null;
      setRandomWs(null);
      // clear global store if it still points to this socket
      try {
        const cs = connectionStore.getState();
        if (cs.randomWs === socket) cs.setRandomWs(null);
      } catch {}
      // If we were chatting, the close likely means partner disconnected
      if (uiState !== "searching") {
        setUiState("got_skipped");
      }
    };

    return () => {
      //   if (uiState === "searching") {
      // try {
      //   socket.close();
      // } catch {}
      // if (randomWsRef.current === socket) {
      //   randomWsRef.current = null;
      //   setRandomWs(null);
      // }
      //   }
    };
    // intentionally excluding handleMessage ref to avoid re-creating socket on message handler change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uiState, username, interests]);

  // In useChatSocket.ts, update the cleanup effect
  // Cleanup sockets on unmount. Use the store directly when deciding
  // whether to move back to `searching` so we don't accidentally override
  // a `got_skipped` state set by an onclose handler (which triggers a
  // uiState change and would otherwise run this effect's cleanup with
  // the previous uiState value).
  useEffect(() => {
    return () => {
      // Clean up random chat WebSocket
      if (randomWsRef.current) {
        try {
          randomWsRef.current.close();
        } catch (e) {
          console.error("Error closing random chat WebSocket:", e);
        }
        randomWsRef.current = null;
        setRandomWs(null);
      }

      // Clean up saved chat WebSocket
      if (savedWsRef.current) {
        try {
          savedWsRef.current.close();
        } catch (e) {
          console.error("Error closing saved chat WebSocket:", e);
        }
        savedWsRef.current = null;
        setSavedWsState(null);
      }

      // Decide whether to return to searching. Read current uiState
      // directly from the zustand store so we don't use a stale value
      // captured by the effect closure.
      try {
        const currentUiState = uiStateStore.getState().uiState;
        if (currentUiState === "chatting" || currentUiState === "saved_chat") {
          // Only move back to searching if the state hasn't already
          // been set to something else (e.g. `got_skipped`).
          setUiState("searching");
        }
      } catch (e) {
        // Fallback: if we can't read the store, be conservative and
        // don't force a UI transition.
        console.warn("Could not read uiState store during cleanup:", e);
      }
    };
    // run only on mount/unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendChatMessage = (msg: string) => {
    const payload = {
      type: "chat",
      contents: msg,
      sender: "you",
      time_stamp: getTime(),
    };
    if (
      uiState === "saved_chat" &&
      savedWsRef.current?.readyState === WebSocket.OPEN
    ) {
      savedWsRef.current.send(
        JSON.stringify({
          type: "chat",
          context: "saved",
          data: { connection_id: activeSavedId, message: msg },
        })
      );
      setMessages(payload);
      return;
    }

    if (randomWsRef.current?.readyState === WebSocket.OPEN) {
      randomWsRef.current.send(
        JSON.stringify({ type: "chat", data: { message: msg } })
      );
      setMessages(payload);
      return;
    }

    // If we reach here no socket was available

    console.warn("No open websocket to send message", { uiState, msg });
  };

  const skip = () => {
    const sock = randomWsRef.current;
    if (sock?.readyState === WebSocket.OPEN) {
      sock.send(JSON.stringify({ type: "system", data: { action: "skip" } }));
    }
    setMessages([]);
    setUiState("searching");
  };

  // wrapper to keep savedWsRef in sync when external callers set saved socket
  const setSavedWs = (ws: WebSocket | null) => {
    savedWsRef.current = ws;
    setSavedWsState(ws);
    // Clear messages when opening a saved-chat socket
    if (ws) setMessages([]);
  };

  return {
    randomWs,
    savedWs,
    setSavedWs,
    setActiveSavedId,
    sendChatMessage,
    skip,
    handleMessage, // Expose this so SavedChats can bind it
  };
};
