import { messageStore } from "../../stores/message-store";
import React, { useLayoutEffect, useRef } from "react";

// interface Message {
//   message: string;
//   time_stamp: string;
//   sender: string;
// }

interface chatProps {
  pairedTo: string;
  sendMessage: (e: React.FormEvent<HTMLFormElement>) => void;
  currentMsg: string;
  setCurrentMsg: (arg: string) => void;
}

export default function ChatBox({
  pairedTo,
  sendMessage,
  currentMsg,
  setCurrentMsg,
}: chatProps) {
  const messageRef = useRef(null);

  const messages = messageStore((state) => state.messages);
  function scrollToBottom() {
    messageRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useLayoutEffect(() => {
    scrollToBottom();
    // console.log(messages);
  }, [messages]);

  return (
    <section className="flex flex-1 justify-center">
      <div className="relative flex w-full flex-col">
        {/* header */}
        <div className="px-6 py-4 text-sm text-text-main/60">
          Talking with{" "}
          <span className="text-text-main">{pairedTo || "someone new"}</span>
        </div>

        {/* messages */}
        <div className="flex-1 overflow-y-auto hide-scrollbar justify-end px-6 py-6 space-y-5">
          {messages.map((msg, index) => (
            <ChatBubble key={index} msg={msg} />
          ))}
          <div ref={messageRef} />
          <div />
        </div>

        {/* input dock */}
        <form
          onSubmit={(e) => sendMessage(e)}
          className="
                mx-6
                mb-6
                flex
                gap-4
                rounded-xl
                border
                border-border-dark
                bg-bg-dark/70
                backdrop-blur-lg
                px-5
                py-2
                shadow-lg
              "
        >
          <input
            value={currentMsg}
            onChange={(e) => setCurrentMsg(e.target.value)}
            placeholder="Type something honest…"
            className="
                  flex-1
                  bg-transparent
                  text-text-main
                  placeholder:text-text-main/40
                  focus:outline-none
                "
          />

          <button
            type="submit"
            className="
                  rounded-full
                  bg-accent
                  px-6
                  py-2
                  font-medium
                  text-bg-dark
                  hover:opacity-90
                  transition
                "
          >
            Send
          </button>
        </form>
      </div>
    </section>
  );
}

/* ======================================================
   Chat Bubble
   ====================================================== */

interface Message {
  type: string;
  contents: string;
  sender: string;
  time_stamp: string;
}
function ChatBubble({ msg }: { msg: Message }) {
  const isSystem = msg.type === "system";
  const isYou = msg.sender === "you";

  if (isSystem) {
    return (
      <div className="w-full flex justify-center animate-[fadeUp_0.3s_ease-out]">
        <div className="rounded-full bg-surface/40 px-4 py-1 text-xs text-text-main/60 italic">
          {msg.contents}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-fit max-w-[60%] animate-[fadeUp_0.3s_ease-out] ${
        isYou ? "ml-auto text-right" : "mr-auto"
      }`}
    >
      <div
        className={`rounded-lg px-4 py-2 text-sm leading-relaxed ${
          isYou ? "bg-accent text-bg-dark" : "bg-surface text-text-main"
        }`}
      >
        {msg.contents}
      </div>

      <div className="mt-1 text-xs text-text-main/40">{msg.time_stamp}</div>
    </div>
  );
}
