import { useEffect, useState } from "react";

const COLORS = ["#E4557A", "#B79CE0", "#F3A6BC", "#5CB88A", "#F2C9C2"];
const PIECES = ["❤️", "💕", "✨", "🎉"];

// Fires a burst of falling confetti/heart pieces whenever `trigger` changes
// to a truthy, new value. Self-cleans after the animation finishes.
export default function Confetti({ trigger, count = 24 }) {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    if (!trigger) return;
    const next = Array.from({ length: count }, (_, i) => ({
      id: `${trigger}-${i}`,
      left: Math.random() * 100,
      delay: Math.random() * 0.4,
      duration: 2.2 + Math.random() * 1.4,
      size: 12 + Math.random() * 14,
      isEmoji: Math.random() > 0.5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      emoji: PIECES[Math.floor(Math.random() * PIECES.length)],
    }));
    setPieces(next);
    const timeout = setTimeout(() => setPieces([]), 4000);
    return () => clearTimeout(timeout);
  }, [trigger, count]);

  if (pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            fontSize: p.isEmoji ? `${p.size}px` : 0,
            width: p.isEmoji ? "auto" : `${p.size * 0.6}px`,
            height: p.isEmoji ? "auto" : `${p.size * 0.6}px`,
            backgroundColor: p.isEmoji ? "transparent" : p.color,
            borderRadius: p.isEmoji ? 0 : "3px",
          }}
        >
          {p.isEmoji ? p.emoji : ""}
        </span>
      ))}
    </div>
  );
}
