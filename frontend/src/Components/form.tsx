"use client";

import { uiStateStore } from "../../stores/uiState-store";
import { usernameStore } from "../../stores/user-store";
import React from "react";

export default function Form() {
  const username = usernameStore((state) => state.username);
  const setUsername = usernameStore((state) => state.setUsername);

  // const uiState = uiStateStore((state) => state.uiState);
  const setUiState = uiStateStore((state) => state.setUiState);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (username.trim().length > 0) {
      setUiState("searching");
    }
  }

  return (
    <main className="relative w-full h-full font-display overflow-hidden flex flex-col justify-center items-end">
      {/* Subtle grid — background texture, not decoration */}
      <div className="absolute inset-0 bg-grid opacity-50" />

      {/* Content */}
      <section className="relative z-10 mx-auto flex max-w-4xl items-center px-8">
        <div className="w-full max-w-md space-y-8 ">
          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-3xl text-text-main">Choose a name</h1>
            <p className="text-sm text-text-main/60">
              This is how others will see you. It doesn’t have to be real.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={(e) => handleSubmit(e)} className="space-y-4">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. nightowl_92"
              className="
                w-full
                rounded-md
                bg-surface
                px-4
                py-3
                text-text-main
                placeholder:text-text-main/40
                focus:outline-none
                focus:ring-1
                focus:ring-accent/40
                border
                border-border-dark
              "
            />

            <button
              type="submit"
              className="
                inline-flex
                items-center
                gap-2
                rounded-md
                bg-accent
                px-6
                py-3
                font-medium
                text-bg-dark
                transition
                hover:opacity-90
              "
            >
              Continue
            </button>
          </form>

          {/* Helper text */}
          <p className="text-xs text-text-main/40">
            You can change this later. Saved chats require login.
          </p>
        </div>
      </section>
    </main>
  );
}
