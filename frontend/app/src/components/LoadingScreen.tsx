"use client";

export default function LoadingScreen() {
  return (
    <div className="flex-1 flex items-center justify-center w-full h-full overflow-hidden">
      <div className="relative w-full h-full flex items-center justify-center bg-bg-dark">
        {/* ================= DOMINANT AMBIENT BACKGROUND ================= */}
        <div className="absolute inset-0">
          {/* Base gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-bg-dark via-surface to-bg-dark" />

          {/* Primary blobs */}
          <div className="absolute -top-56 left-[-10%] h-[48rem] w-[48rem] rounded-full bg-accent/20 blur-[180px] animate-[blobA_22s_ease-in-out_infinite]" />
          <div className="absolute bottom-[-20%] right-[-10%] h-[52rem] w-[52rem] rounded-full bg-surface-highlight/35 blur-[200px] animate-[blobB_28s_ease-in-out_infinite]" />

          {/* Secondary blobs */}
          <div className="absolute top-[20%] right-[15%] h-[28rem] w-[28rem] rounded-full bg-accent/18 blur-[160px] animate-[blobC_18s_ease-in-out_infinite]" />
          <div className="absolute bottom-[10%] left-[20%] h-[26rem] w-[26rem] rounded-full bg-accent/12 blur-[150px] animate-[blobD_24s_ease-in-out_infinite]" />
        </div>

        {/* ================= MINIMAL CORE ================= */}
        <div className="relative z-10 flex flex-col items-center gap-6">
          {/* Loader core */}
          <div className="relative flex items-center justify-center">
            <div className="h-20 w-20 rounded-full border border-accent/30 animate-[pulseSoft_2.5s_ease-in-out_infinite]" />
            <div className="absolute h-10 w-10 rounded-full bg-accent/90 animate-[pulseSoft_2.5s_ease-in-out_infinite_1s]" />
          </div>

          {/* Text */}
          <div className="text-center space-y-1">
            <p className="text-lg text-text-main">Looking for someone</p>
            <p className="text-sm text-text-main/50">stay for a moment</p>
          </div>
        </div>
      </div>
    </div>
  );
}
