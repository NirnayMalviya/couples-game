import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const steps = [
  { n: "1", label: "Create a room" },
  { n: "2", label: "Share the code" },
  { n: "3", label: "Answer secretly" },
  { n: "4", label: "Guess your partner" },
  { n: "5", label: "Reveal answers" },
  { n: "6", label: "See who knows whom better" },
];

const FLOATERS = [
  { emoji: "💕", top: "12%", left: "8%", size: 28, delay: 0, dur: 7 },
  { emoji: "❤️", top: "22%", left: "88%", size: 22, delay: 1.2, dur: 8 },
  { emoji: "✨", top: "68%", left: "6%", size: 20, delay: 0.6, dur: 6 },
  { emoji: "💗", top: "78%", left: "90%", size: 26, delay: 2, dur: 9 },
  { emoji: "🌸", top: "5%", left: "50%", size: 18, delay: 1.6, dur: 7.5 },
  { emoji: "💫", top: "50%", left: "94%", size: 16, delay: 0.3, dur: 6.5 },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-cream bg-grain-fade relative overflow-hidden">
      {/* Ambient blurred gradient blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 bg-rose/20 blur-3xl animate-blob-spin" />
      <div className="pointer-events-none absolute top-1/3 -right-32 w-96 h-96 bg-lavender/20 blur-3xl animate-blob-spin" style={{ animationDelay: "2s" }} />

      {/* Floating ambient hearts */}
      {FLOATERS.map((f, i) => (
        <span
          key={i}
          className="pointer-events-none absolute select-none opacity-60 animate-floaty-slow"
          style={{ top: f.top, left: f.left, fontSize: f.size, animationDelay: `${f.delay}s`, animationDuration: `${f.dur}s` }}
        >
          {f.emoji}
        </span>
      ))}

      <nav className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <span className="font-display text-xl text-plum">Us</span>
        <Link to="/join" className="text-sm text-plum/70 hover:text-rose transition-colors underline underline-offset-4 decoration-plum/20 hover:decoration-rose">
          Have a code? Join here
        </Link>
      </nav>

      <header className="max-w-3xl mx-auto px-6 pt-10 pb-16 text-center relative z-10">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-4xl sm:text-5xl leading-tight text-plum"
        >
          How well do you{" "}
          <span className="relative inline-block">
            <em className="text-rose not-italic">really</em>
            <motion.span
              className="absolute -bottom-1 left-0 h-2 bg-rose/20 rounded-full -z-10"
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ delay: 0.6, duration: 0.5 }}
            />
          </span>{" "}
          know each other? 👀
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mt-5 text-plum/70 text-lg"
        >
          A playful game for two — answer secretly, guess each other, and find out who
          actually pays attention. Even when you're miles apart.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-8 flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Link to="/create">
            <motion.span
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              className="shimmer-sweep inline-block px-7 py-3 rounded-full bg-rose text-white font-semibold shadow-glow hover:shadow-glow-lg transition-shadow"
            >
              💕 Create a Game
            </motion.span>
          </Link>
          <Link to="/join">
            <motion.span
              whileHover={{ scale: 1.04, y: -2, borderColor: "rgba(228,85,122,0.5)" }}
              whileTap={{ scale: 0.96 }}
              className="inline-block px-7 py-3 rounded-full bg-white border border-plum/10 text-plum font-semibold hover:shadow-card transition-shadow"
            >
              🔗 Join With Code
            </motion.span>
          </Link>
        </motion.div>
      </header>

      <section className="max-w-4xl mx-auto px-6 pb-20 relative z-10">
        <h2 className="font-display text-2xl text-plum text-center mb-8">How it works</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="postcard px-4 py-5 text-center cursor-default hover:shadow-glow"
            >
              <div className="font-display text-2xl text-rose mb-1">{s.n}</div>
              <div className="text-sm text-plum/80">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
