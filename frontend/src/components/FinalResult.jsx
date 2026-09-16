import { motion } from "framer-motion";
import Confetti from "./Confetti.jsx";
import AnimatedNumber from "./AnimatedNumber.jsx";

export default function FinalResult({ players, myPlayerId, scores, winnerPlayerId, isPerfectMatch, onPlayAgain, onChoosePackage }) {
  const me = players.find((p) => p.playerId === myPlayerId);
  const partner = players.find((p) => p.playerId !== myPlayerId);
  const myScore = scores[myPlayerId] || 0;
  const partnerScore = partner ? scores[partner.playerId] || 0 : 0;
  const iWon = winnerPlayerId === myPlayerId;
  const celebrate = iWon || isPerfectMatch;

  let headline = "💕 PERFECT MATCH";
  let sub = "You two are suspiciously good at this.";
  if (!isPerfectMatch) {
    headline = iWon ? `🏆 ${me?.nickname?.toUpperCase()} WINS!` : `🏆 ${partner?.nickname?.toUpperCase()} WINS!`;
    sub = iWon
      ? "You know your partner ridiculously well."
      : "You lost the game… but you still got the love. 😌❤️";
  }

  return (
    <>
      <Confetti trigger={celebrate ? "final" : null} count={36} />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 20 }}
        className="postcard max-w-md w-full mx-auto p-8 text-center"
      >
        <p className="text-xs uppercase tracking-widest text-plum/40 mb-2">Game complete</p>
        <div className="flex justify-center gap-8 mb-4">
          <motion.div initial={{ y: -6 }} animate={{ y: 0 }} transition={{ delay: 0.1, type: "spring", stiffness: 300 }}>
            <div className="text-3xl mb-1">{me?.avatar}</div>
            <div className="text-sm text-plum/60">{me?.nickname}</div>
            <AnimatedNumber value={myScore} className="font-display text-3xl text-rose" />
          </motion.div>
          <div className="text-plum/20 text-2xl self-center">–</div>
          <motion.div initial={{ y: -6 }} animate={{ y: 0 }} transition={{ delay: 0.2, type: "spring", stiffness: 300 }}>
            <div className="text-3xl mb-1">{partner?.avatar}</div>
            <div className="text-sm text-plum/60">{partner?.nickname}</div>
            <AnimatedNumber value={partnerScore} className="font-display text-3xl text-lavender" />
          </motion.div>
        </div>

        <motion.h2
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 16 }}
          className="font-display text-2xl text-plum mb-1"
        >
          {headline}
        </motion.h2>
        <p className="text-plum/60 mb-6">{sub}</p>

        {celebrate && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.45 }}
            className="inline-block px-4 py-1.5 rounded-full bg-rose/10 text-rose font-semibold text-sm mb-6"
          >
            💯 +100 Love Points
          </motion.div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.96 }}
            onClick={onPlayAgain}
            className="shimmer-sweep px-5 py-2.5 rounded-full bg-rose text-white font-semibold shadow-glow hover:shadow-glow-lg transition-shadow"
          >
            🔄 Play Again
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.96 }}
            onClick={onChoosePackage}
            className="px-5 py-2.5 rounded-full bg-white border border-plum/15 text-plum font-semibold hover:shadow-card transition-shadow"
          >
            💕 Choose Another Package
          </motion.button>
        </div>
      </motion.div>
    </>
  );
}
