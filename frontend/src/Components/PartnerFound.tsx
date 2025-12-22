"use client";

export default function PartnerFound() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">

      {/* Converging glow */}
      <div className="absolute h-[30rem] w-[30rem] rounded-full bg-accent/20 blur-[120px] animate-[converge_0.8s_ease-out_forwards]" />

      {/* Center pulse */}
      <div className="relative z-10 flex flex-col items-center gap-3 animate-[fadeIn_0.6s_ease-out]">
        <div className="h-12 w-12 rounded-full bg-accent/90 animate-[pulseSoft_1.5s_ease-in-out_infinite]" />
        <p className="text-sm text-text-main">
          You’re connected
        </p>
      </div>
    </div>
  );
}
