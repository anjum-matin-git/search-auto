export function BackgroundCanvas() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 overflow-hidden bg-[#01000a] text-white/80"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(30,10,80,0.7),_rgba(1,0,10,0.98))]" />

      <div className="absolute pointer-events-none inset-0 mix-blend-screen opacity-55">
        <div className="absolute -left-1/4 top-[-10%] h-[70vw] w-[70vw] rounded-full bg-gradient-to-r from-[#4b2dff]/60 via-[#ff2d78]/35 to-transparent blur-[160px] animate-blob" />
        <div className="absolute bottom-[-20%] right-[-15%] h-[60vw] w-[60vw] rounded-full bg-gradient-to-br from-[#08f7fe]/25 via-[#15bffd]/15 to-transparent blur-[190px] animate-blob-slow" />
        <div className="absolute top-1/3 right-1/4 h-[30vw] w-[30vw] rounded-full bg-gradient-to-br from-[#f6d365]/25 via-transparent to-transparent blur-[150px] animate-blob-delay" />
      </div>

      <div className="absolute inset-0 bg-noise opacity-25 mix-blend-soft-light" />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(255,255,255,0.12),transparent_60%)] opacity-60 mix-blend-soft-light" />

      <div className="absolute inset-0 backdrop-mask" />
    </div>
  );
}

