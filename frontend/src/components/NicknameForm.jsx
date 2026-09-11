import { useState } from "react";

const AVATARS = ["❤️", "💕", "😄", "🐻", "🐰", "🌸", "🔥", "🌙"];

export default function NicknameForm({ title, subtitle, submitLabel, onSubmit, error, loading }) {
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);

  return (
    <div className="postcard max-w-md w-full mx-auto p-7">
      <h2 className="font-display text-2xl text-plum mb-1">{title}</h2>
      {subtitle && <p className="text-plum/60 text-sm mb-5">{subtitle}</p>}

      <label className="block text-sm font-semibold text-plum/80 mb-1">Your nickname</label>
      <input
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        maxLength={24}
        placeholder="e.g. Nirnay"
        className="w-full rounded-xl border border-plum/15 px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-rose/40"
      />

      <label className="block text-sm font-semibold text-plum/80 mb-2">Pick an avatar</label>
      <div className="flex gap-2 flex-wrap mb-5">
        {AVATARS.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setAvatar(a)}
            className={`w-11 h-11 rounded-full grid place-items-center text-xl border-2 transition-colors ${
              avatar === a ? "border-rose bg-rose/10" : "border-plum/10 bg-white"
            }`}
            aria-pressed={avatar === a}
          >
            {a}
          </button>
        ))}
      </div>

      {error && <p className="text-coral text-sm mb-4">{error}</p>}

      <button
        disabled={!nickname.trim() || loading}
        onClick={() => onSubmit({ nickname: nickname.trim(), avatar })}
        className="w-full py-3 rounded-full bg-rose text-white font-semibold shadow-soft disabled:opacity-50 hover:bg-rose-dark transition-colors"
      >
        {loading ? "One sec…" : submitLabel}
      </button>
    </div>
  );
}
