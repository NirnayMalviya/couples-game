import { useState } from "react";
import { motion } from "framer-motion";

const AVATARS = ["❤️", "💕", "😄", "🐻", "🐰", "🌸", "🔥", "🌙"];

export default function NicknameForm({ title, subtitle, submitLabel, onSubmit, error, loading }) {
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="postcard max-w-md w-full mx-auto p-7"
    >
      <h2 className="font-display text-2xl text-plum mb-1">{title}</h2>
      {subtitle && <p className="text-plum/60 text-sm mb-5">{subtitle}</p>}

      <label className="block text-sm font-semibold text-plum/80 mb-1">Your nickname</label>
      <input
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        maxLength={24}
        placeholder="e.g. Nirnay"
        className="w-full rounded-xl border border-plum/15 px-4 py-3 mb-4 outline-none transition-shadow focus:border-rose/50 focus:ring-4 focus:ring-rose/15"
      />

      <label className="block text-sm font-semibold text-plum/80 mb-2">Pick an avatar</label>
      <div className="flex gap-2 flex-wrap mb-5">
        {AVATARS.map((a) => (
          <motion.button
            key={a}
            type="button"
            onClick={() => setAvatar(a)}
            whileHover={{ scale: 1.15, rotate: -6 }}
            whileTap={{ scale: 0.9 }}
            animate={avatar === a ? { scale: [1, 1.15, 1] } : {}}
            transition={{ duration: 0.3 }}
            className={`relative w-11 h-11 rounded-full grid place-items-center text-xl border-2 transition-colors ${
              avatar === a ? "border-rose bg-rose/10" : "border-plum/10 bg-white hover:border-plum/25"
            }`}
            aria-pressed={avatar === a}
          >
            {a}
            {avatar === a && (
              <motion.span
                layoutId="avatar-ring"
                className="absolute inset-0 rounded-full animate-pulse-ring"
              />
            )}
          </motion.button>
        ))}
      </div>

      {error && (
        <motion.p initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} className="text-coral text-sm mb-4">
          {error}
        </motion.p>
      )}

      <motion.button
        disabled={!nickname.trim() || loading}
        onClick={() => onSubmit({ nickname: nickname.trim(), avatar })}
        whileHover={!loading && nickname.trim() ? { scale: 1.02, y: -1 } : {}}
        whileTap={!loading && nickname.trim() ? { scale: 0.97 } : {}}
        className="shimmer-sweep w-full py-3 rounded-full bg-rose text-white font-semibold shadow-glow disabled:opacity-50 disabled:shadow-none hover:shadow-glow-lg transition-shadow"
      >
        {loading ? (
          <span className="inline-flex items-center gap-1">
            One sec
            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }}>.</motion.span>
            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}>.</motion.span>
            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}>.</motion.span>
          </span>
        ) : (
          submitLabel
        )}
      </motion.button>
    </motion.div>
  );
}
