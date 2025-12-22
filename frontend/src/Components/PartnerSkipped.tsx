"use client";

/**
 * PartnerSkipped
 * Shown when the other user skips
 * Fills parent container, not full screen
 */

export default function PartnerSkipped({
  onStartNew,
}: {
  onStartNew: () => void;
}) {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">

      {/* ================= AMBIENT BACKGROUND ================= */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-bg-dark via-surface to-bg-dark opacity-80" />

        {/* softer blobs than loading */}
        <div className="absolute -top-24 left-1/3 h-[24rem] w-[24rem] rounded-full bg-accent/10 blur-[120px] animate-[floatSlow_36s_ease-in-out_infinite]" />
        <div className="absolute bottom-0 right-1/4 h-[20rem] w-[20rem] rounded-full bg-surface-highlight/20 blur-[140px] animate-[floatSlow_42s_ease-in-out_infinite]" />
      </div>

      {/* ================= CORE ================= */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center max-w-md">

        {/* Neutral indicator */}
        <div className="h-10 w-10 rounded-full border border-border-dark" />

        {/* Text */}
        <div className="space-y-2">
          <p className="text-lg text-text-main">
            They chose to move on
          </p>
          <p className="text-sm text-text-main/50">
            It happens sometimes.  
            You can start a new conversation whenever you’re ready.
          </p>
        </div>

        {/* Action */}
        <button
          onClick={onStartNew}
          className="
            mt-2
            rounded-full
            bg-accent
            px-8
            py-3
            font-medium
            text-bg-dark
            hover:opacity-90
            transition
          "
        >
          Start a new chat
        </button>
      </div>
    </div>
  );
}
