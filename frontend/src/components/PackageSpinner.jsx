import { useRef, useState } from "react";
import { motion } from "framer-motion";

const ITEM_HEIGHT = 104; // px, must match the fixed-height item below
const LOOPS = 4; // full reel cycles before landing, purely for spin feel

export default function PackageSpinner({ packages, selectedId, onSpinResult, disabled, spinning, setSpinning }) {
  const [offset, setOffset] = useState(0);
  const trackRef = useRef(null);
  const selected = packages.find((p) => p.id === selectedId);

  function spin() {
    if (disabled || spinning || packages.length === 0) return;
    setSpinning(true);
    const targetIndex = Math.floor(Math.random() * packages.length);
    const totalSteps = LOOPS * packages.length + targetIndex;
    setOffset(totalSteps * ITEM_HEIGHT);

    const node = trackRef.current;
    const handleEnd = () => {
      node?.removeEventListener("transitionend", handleEnd);
      setSpinning(false);
      onSpinResult(packages[targetIndex].id);
      // Snap back to an equivalent low offset so future spins don't grow forever.
      setOffset(targetIndex * ITEM_HEIGHT);
    };
    node?.addEventListener("transitionend", handleEnd);
  }

  const reelItems = Array.from({ length: LOOPS + 1 }, () => packages).flat();

  return (
    <div className="flex flex-col items-center">
      <div
        className="relative w-full max-w-xs mx-auto overflow-hidden rounded-2xl border-2 border-plum/10 bg-white shadow-card"
        style={{ height: ITEM_HEIGHT }}
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white via-transparent to-white z-10" />
        <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-rose/40 z-10" />
        <div
          ref={trackRef}
          className="will-change-transform"
          style={{
            transform: `translateY(-${offset}px)`,
            transition: spinning ? "transform 2.6s cubic-bezier(0.12, 0.7, 0.15, 1)" : "none",
          }}
        >
          {reelItems.map((pkg, i) => (
            <div key={i} className="flex flex-col items-center justify-center gap-0.5" style={{ height: ITEM_HEIGHT }}>
              <span className="text-3xl">{pkg.emoji}</span>
              <span className="font-display text-sm text-plum">{pkg.title}</span>
            </div>
          ))}
        </div>
      </div>

      {!disabled && (
        <motion.button
          whileHover={!spinning ? { scale: 1.04 } : {}}
          whileTap={!spinning ? { scale: 0.96 } : {}}
          onClick={spin}
          disabled={spinning}
          className="shimmer-sweep mt-5 px-7 py-3 rounded-full bg-rose text-white font-semibold shadow-glow disabled:opacity-60 disabled:shadow-none hover:shadow-glow-lg transition-shadow"
        >
          {spinning ? "Spinning… 🎡" : selected ? "Spin again 🎡" : "Spin for a package 🎡"}
        </motion.button>
      )}

      {disabled && !selected && <p className="text-center text-sm text-plum/50 mt-4">⏳ Waiting for your partner to spin…</p>}

      {selected && !spinning && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="mt-5 text-center"
        >
          <p className="text-xs uppercase tracking-widest text-plum/40 mb-1">Landed on</p>
          <p className="font-display text-xl text-rose">
            {selected.emoji} {selected.title}
          </p>
          <p className="text-sm text-plum/60 mt-1 max-w-xs mx-auto">{selected.description}</p>
        </motion.div>
      )}
    </div>
  );
}
