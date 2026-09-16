import { motion } from "framer-motion";
import Confetti from "./Confetti.jsx";

export default function RevealBreakdown({ questions, myResults, myScore, partnerScore, maxPossible, onFinish }) {
  const correctCount = myResults.filter((r) => r.isCorrect).length;

  return (
    <div className="max-w-md mx-auto">
      {correctCount > 0 && <Confetti trigger={`reveal-${correctCount}`} count={Math.min(correctCount * 6, 30)} />}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="postcard p-6 mt-6">
        <p className="text-xs uppercase tracking-widest text-plum/40 mb-1">Round results</p>
        <p className="font-display text-2xl text-plum mb-1">
          You got {correctCount} of {questions.length} 👀
        </p>
        <p className="text-sm text-plum/50 mb-5">
          You: {myScore} / {maxPossible} · Them: {partnerScore} / {maxPossible}
        </p>

        <div className="space-y-2.5">
          {questions.map((q, i) => {
            const r = myResults.find((res) => res.questionId === q.id);
            const guessedOpt = q.options.find((o) => o.id === r?.guessedOptionId);
            const actualOpt = q.options.find((o) => o.id === r?.actualPartnerOptionId);
            return (
              <motion.div
                key={q.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`rounded-xl border-2 px-3.5 py-2.5 ${r?.isCorrect ? "border-mint bg-mint/5" : "border-coral/60 bg-coral/5"}`}
              >
                <p className="text-sm text-plum/80 mb-1">
                  {q.emoji} {q.text}
                </p>
                <p className="text-xs">
                  {r?.isCorrect ? (
                    <span className="text-mint font-semibold">✓ Correct — {actualOpt?.text}</span>
                  ) : (
                    <span className="text-coral font-semibold">
                      ✗ You guessed {guessedOpt?.text || "—"}, actual was {actualOpt?.text}
                    </span>
                  )}
                </p>
              </motion.div>
            );
          })}
        </div>

        <motion.button
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={onFinish}
          className="shimmer-sweep w-full mt-6 py-3 rounded-full bg-plum text-white font-semibold shadow-soft hover:shadow-glow-lg transition-shadow"
        >
          See final result 🏆
        </motion.button>
      </motion.div>
    </div>
  );
}
