import { motion } from "framer-motion";

export default function FinalResult({ players, myPlayerId, scores, winnerPlayerId, isPerfectMatch, onPlayAgain, onChoosePackage }) {
  const me = players.find((p) => p.playerId === myPlayerId);
  const partner = players.find((p) => p.playerId !== myPlayerId);
  const myScore = scores[myPlayerId] || 0;
  const partnerScore = partner ? scores[partner.playerId] || 0 : 0;
  const iWon = winnerPlayerId === myPlayerId;

  let headline = "💕 PERFECT MATCH";
  let sub = "You two are suspiciously good at this.";
  if (!isPerfectMatch) {
    headline = iWon ? `🏆 ${me?.nickname?.toUpperCase()} WINS!` : `🏆 ${partner?.nickname?.toUpperCase()} WINS!`;
    sub = iWon
      ? "You know your partner ridiculously well."
      : "You lost the game… but you still got the love. 😌❤️";
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="postcard max-w-md w-full mx-auto p-8 text-center"
    >
      <p className="text-xs uppercase tracking-widest text-plum/40 mb-2">Game complete</p>
      <div className="flex justify-center gap-8 mb-4">
        <div>
          <div className="text-3xl mb-1">{me?.avatar}</div>
          <div className="text-sm text-plum/60">{me?.nickname}</div>
          <div className="font-display text-3xl text-rose">{myScore}</div>
        </div>
        <div className="text-plum/20 text-2xl self-center">–</div>
        <div>
          <div className="text-3xl mb-1">{partner?.avatar}</div>
          <div className="text-sm text-plum/60">{partner?.nickname}</div>
          <div className="font-display text-3xl text-lavender">{partnerScore}</div>
        </div>
      </div>

      <h2 className="font-display text-2xl text-plum mb-1">{headline}</h2>
      <p className="text-plum/60 mb-6">{sub}</p>

      {(iWon || isPerfectMatch) && (
        <div className="inline-block px-4 py-1.5 rounded-full bg-rose/10 text-rose font-semibold text-sm mb-6">
          💯 +100 Love Points
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        <button onClick={onPlayAgain} className="px-5 py-2.5 rounded-full bg-rose text-white font-semibold hover:bg-rose-dark transition-colors">
          🔄 Play Again
        </button>
        <button onClick={onChoosePackage} className="px-5 py-2.5 rounded-full bg-white border border-plum/15 text-plum font-semibold hover:border-plum/30 transition-colors">
          💕 Choose Another Package
        </button>
      </div>
    </motion.div>
  );
}
