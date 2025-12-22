"use client";

import Link from "next/link";

/**
 * Quirk – Landing Page
 * Asymmetric layout
 * Left: Message + CTA
 * Right: Ambient activity & motion
 */

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-bg-dark font-display">

      {/* ================= BACKGROUND GRID ================= */}
      <div className="absolute inset-0 bg-grid opacity-70" />

      {/* ================= PAGE LAYOUT ================= */}
      <section className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center px-8">

        {/* ================= LEFT CONTENT ================= */}
        <div className="flex w-full max-w-xl flex-col gap-8">

          {/* Brand */}
          <div className="text-accent text-4xl font-serif font-bold">
            Quirk
          </div>

          {/* Hero line */}
          <h1 className="text-5xl leading-tight text-text-main">
            Talk to someone
            <br />
            you were never meant
            <br />
            to meet.
          </h1>

          {/* Tagline */}
          <p className="text-lg text-text-main/70">
            No profiles. No pressure.
            <br />
            Just a conversation — random, honest, human.
          </p>

          {/* CTA */}
          <div className="mt-4 flex items-center gap-4">
            <Link
            href={"/chat"}  
             className="rounded-full bg-accent px-8 py-4 font-semibold text-bg-dark transition hover:scale-[1.03]">
              Start chatting
            </Link>

            <span className="text-sm text-text-main/40">
              Save chats when you log in
            </span>
          </div>
        </div>

        {/* ================= RIGHT AMBIENCE ================= */}
        <div className="relative hidden h-[520px] w-full max-w-xl md:block">

          {/* Radar / presence rings */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="radar-circle h-[260px] w-[260px] animate-ripple" />
            <div className="radar-circle h-[260px] w-[260px] animate-ripple ripple-delay-2" />
          </div>

          {/* Floating signals */}
          <AmbientBubble
            text="New match found"
            className="top-[18%] left-[20%] animate-float-1"
            dot
          />

          <AmbientBubble
            text="Matched on music"
            className="top-[45%] right-[10%] animate-float-2"
          />

          <AmbientBubble
            text="Someone skipped"
            className="bottom-[20%] left-[30%] animate-float-3"
          />

          <AmbientBubble
            text="1,420 online"
            className="top-[8%] right-[30%] animate-float-4"
          />
        </div>
      </section>
    </main>
  );
}

/* ======================================================
   Ambient Bubble (subtle, not flashy)
   ====================================================== */
function AmbientBubble({
  text,
  className,
  dot = false,
}: {
  text: string;
  className: string;
  dot?: boolean;
}) {
  return (
    <div
      className={`ephemeral-bubble ${className} opacity-80 hover:opacity-100 transition`}
    >
      {dot && <span className="h-2 w-2 rounded-full bg-accent" />}
      {text}
    </div>
  );
}
