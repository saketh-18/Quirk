// create a websocket and configure onconnect and on message ✔️
// create states for currentMessage and messages ✔️
// import userStore to get username of userStore ✔️
// extract system message and display it accordingly ✔️
// create a sidebar and display the who the user currently paired with and also new chat options
// create a chat window with input and send button, ✔️
// appropriate ui for displaying messages
// import navbar and display it in the front ✔️
// create responsive ui (mobile first)
// use simple gradient rather than complex images for background
// use component structure

"use client";

import Navbar from "@/src/Components/Navbar";
import { usernameStore } from "@/stores/user-store";
import { FormEvent, useEffect, useState } from "react";

interface message {
  message: string;
  time_stamp: string; // we will give timestamp while adding it to state var, rather than getting it from backend
  sender: string;
}

export default function Page() {
  const [messages, setMessages] = useState<message[]>([]);
  const [currentMsg, setCurrentMsg] = useState<string>("");
  const [ws, setWs] = useState<WebSocket>();
  const [paired_to, setPaired_to] = useState<string>("");
  const username = usernameStore((state) => state.username);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const socket = new WebSocket(`ws://localhost:8000/ws?username=${username}`);

    socket.onopen = () => {
      console.log("connection Established");
      setWs(socket);
    };

    socket.onmessage = (event) => {
      // console.log(event.data);
      const data = JSON.parse(event.data);
      console.log(data);
      // console.log(typeof(data));
      if (data.system) {
        setPaired_to(data.paired_to);
      }
      const now = new Date().toLocaleTimeString();
      setMessages((prev) => [
        ...prev,
        {
          message: data.message,
          sender: data.sender,
          time_stamp: now,
        },
      ]);
      // console.log(messages)
    };

    socket.onclose = () => {
      console.log("connection closed");
    };

    socket.onerror = (error) => {
      console.log("websocket Error", error);
    };
  }, []);

  function sendMessage(e : FormEvent) {
    e.preventDefault();
    const current_time : string = new Date().toLocaleTimeString();
    ws?.send(currentMsg);
    setMessages((prev) => [
      ...prev,
      {"message" : currentMsg,
        "time_stamp" : current_time,
        "sender" : "you",
      }
    ]);
  }

  return (
    <>
      <Navbar />
      <div className="flex-col w-full">
        <div className="h-96 overflow-scroll flex-col">
        {paired_to && <p className=" self-center"> Connected to {paired_to}</p>}
        {messages.map((msg, index) => (
          <li key={index}>
            {msg.time_stamp} - {msg.sender} - {msg.message} 
          </li>
        ))}
        </div>
        <form className="" onSubmit={(e) => sendMessage(e)}>
          <input className="p-2 rounded-lg" value={currentMsg} onChange={(e) => setCurrentMsg(e.target.value)} placeholder="enter your message"></input>
          <button className="p-2" type="submit">Send</button>
        </form>
      </div>
    </>
  );
}
