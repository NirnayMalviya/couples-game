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

export default function Landing() {
  return (
    <div className="min-h-screen bg-cream bg-grain-fade">
      <nav className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <span className="font-display text-xl text-plum">Us</span>
        <Link to="/join" className="text-sm text-plum/70 hover:text-plum underline underline-offset-4">
          Have a code? Join here
        </Link>
      </nav>

      <header className="max-w-3xl mx-auto px-6 pt-10 pb-16 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-display text-4xl sm:text-5xl leading-tight text-plum"
        >
          How well do you <em className="text-rose not-italic">really</em> know each other? 👀
        </motion.h1>
        <p className="mt-5 text-plum/70 text-lg">
          A playful game for two — answer secretly, guess each other, and find out who
          actually pays attention. Even when you're miles apart.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/create"
            className="px-7 py-3 rounded-full bg-rose text-white font-semibold shadow-soft hover:bg-rose-dark transition-colors"
          >
            💕 Create a Game
          </Link>
          <Link
            to="/join"
            className="px-7 py-3 rounded-full bg-white border border-plum/10 text-plum font-semibold hover:border-plum/30 transition-colors"
          >
            🔗 Join With Code
          </Link>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="font-display text-2xl text-plum text-center mb-8">How it works</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="postcard px-4 py-5 text-center"
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
