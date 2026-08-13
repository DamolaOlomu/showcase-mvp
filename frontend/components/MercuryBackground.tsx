export default function MercuryBackground() {
  return (
    <div aria-hidden className="fixed inset-0 z-0 overflow-hidden bg-void pointer-events-none">
      {/* Global optical-distortion filter. Every .glass element references
          this via backdrop-filter: url(#glass-distortion) — it's what
          actually bends the content behind the glass, the way real glass
          (or Apple's material) does, instead of just blurring it flat. */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <filter id="glass-distortion" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.009 0.012"
              numOctaves="2"
              seed="8"
              result="noise"
            />
            <feGaussianBlur in="noise" stdDeviation="3" result="blurred" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="blurred"
              scale="46"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>

          {/* Goo filter for the mercury blobs: blur pushes edges into each
              other, the color-matrix contrast snaps it back into a soft
              merged shape instead of a blend, so blobs visibly join and
              split as they drift. */}
          <filter id="mercury-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="30" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 10 -3.5"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Soft light field with enough tonal range for the glass distortion
          to actually be visible — pale, airy, still fully monochrome. */}
      <div className="absolute inset-0 opacity-[0.55]" style={{ filter: "url(#mercury-goo)" }}>
        <div className="absolute top-[8%] left-[6%] w-[42vw] h-[42vw] rounded-full bg-white blur-3xl animate-drift1" />
        <div className="absolute top-[30%] right-[4%] w-[36vw] h-[36vw] rounded-full bg-[#c7cbd1] blur-3xl animate-drift2" />
        <div className="absolute bottom-[4%] left-[26%] w-[38vw] h-[38vw] rounded-full bg-[#d8dbdf] blur-3xl animate-drift3" />
        <div className="absolute top-[0%] right-[28%] w-[22vw] h-[22vw] rounded-full bg-[#bfc3c9] blur-3xl animate-drift4" />
      </div>

      {/* Faint vignette to gently ground the corners. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 30%, transparent 0%, rgba(200,202,206,0.35) 70%, rgba(190,192,197,0.55) 100%)",
        }}
      />
      <div className="grain-overlay" />
    </div>
  );
}
