import { motion, AnimatePresence } from "framer-motion";

export default function PlayerBar({ players, myPlayerId, totalQuestions, currentIndex, disconnectedId }) {
  const me = players.find((p) => p.playerId === myPlayerId);
  const partner = players.find((p) => p.playerId !== myPlayerId);

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-3">
        <PlayerChip player={me} isDisconnected={disconnectedId === myPlayerId} you />
        <div className="connector-line" />
        <PlayerChip player={partner} isDisconnected={partner && disconnectedId === partner.playerId} />
      </div>
      {totalQuestions > 0 && (
        <>
          <div className="flex justify-center gap-1">
            {Array.from({ length: totalQuestions }, (_, i) => (
              <motion.span
                key={i}
                initial={false}
                animate={i < currentIndex ? { scale: [1, 1.4, 1] } : { scale: 1 }}
                transition={{ duration: 0.35 }}
                className="text-sm"
              >
                {i < currentIndex ? "❤️" : "🤍"}
              </motion.span>
            ))}
          </div>
          <p className="text-center text-xs text-plum/50 mt-0.5">
            Question {Math.min(currentIndex + 1, totalQuestions)} / {totalQuestions}
          </p>
        </>
      )}
    </div>
  );
}

function PlayerChip({ player, isDisconnected, you }) {
  if (!player) {
    return <div className="flex-1 text-center text-sm text-plum/40 italic">waiting for partner…</div>;
  }
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 18 }}
      whileHover={{ scale: 1.08 }}
      className="flex-1 flex flex-col items-center"
    >
      <div className="w-11 h-11 rounded-full bg-white border border-plum/10 grid place-items-center text-xl shadow-card">
        {player.avatar}
      </div>
      <span className="text-xs mt-1 text-plum/70">
        {player.nickname}
        {you ? " (you)" : ""}
      </span>
      <AnimatePresence>
        {isDisconnected && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-[10px] text-coral"
          >
            offline
          </motion.span>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
